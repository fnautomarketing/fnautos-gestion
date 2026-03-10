import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { formatFacturaDisplayNumero } from '@/lib/utils'
import { sanitizeSearchInput } from '@/lib/security/sanitize-search'
import { auditLog } from '@/lib/security/audit-log'
import { clientConfig } from '@/config/clients'

/** Formato numérico español: 1.234,56 */
function formatNumeroES(n: number): string {
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n)
}

/** Fecha dd/mm/yyyy */
function formatFechaES(dateStr: string | null): string {
    if (!dateStr) return ''
    try {
        return format(new Date(dateStr), 'dd/MM/yyyy', { locale: es })
    } catch {
        return dateStr
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const formatType = searchParams.get('format') || 'xlsx'
        if (formatType !== 'xlsx' && formatType !== 'csv') {
            return NextResponse.json({ error: 'Formato no válido. Use format=xlsx o format=csv' }, { status: 400 })
        }

        const { empresaId, userId } = await getUserContext()
        auditLog('export_facturas', userId, { empresaId, format: formatType })
        const adminClient = createAdminClient()

        // Parámetros de filtro (mismos que la página)
        const q = sanitizeSearchInput(searchParams.get('q'))
        const estado = searchParams.get('estado') || 'todas'
        const desde = searchParams.get('desde') || ''
        const hasta = searchParams.get('hasta') || ''
        const mes = searchParams.get('mes') || ''
        const anio = searchParams.get('anio') || ''
        const clienteId = searchParams.get('clienteId') || ''
        const serieId = searchParams.get('serie') || ''
        const orden = searchParams.get('orden') || 'fecha_desc'

        // Ordenación
        type OrderField = 'fecha_emision' | 'total' | 'numero_orden'
        let orderField: OrderField = 'fecha_emision'
        let orderAsc = false
        let orderByCliente = false
        let orderByNumero = false

        switch (orden) {
            case 'fecha_asc':
                orderField = 'fecha_emision'; orderAsc = true; break
            case 'cliente_asc':
                orderByCliente = true; orderAsc = true; break
            case 'cliente_desc':
                orderByCliente = true; orderAsc = false; break
            case 'total_desc':
                orderField = 'total'; orderAsc = false; break
            case 'total_asc':
                orderField = 'total'; orderAsc = true; break
            case 'numero_asc':
                orderByNumero = true; orderAsc = true; break
            case 'numero_desc':
                orderByNumero = true; orderAsc = false; break
            default:
                orderField = 'fecha_emision'; orderAsc = false; break
        }

        let query = adminClient
            .from('facturas')
            .select(
                `*,
                cliente:clientes(nombre_fiscal, nombre_comercial, cif),
                empresa:empresas(nombre_comercial)`
            )

        if (empresaId) {
            query = query.eq('empresa_id', empresaId)
        }

        // Filtro búsqueda
        if (q) {
            const qNorm = q.replace(/[\s\-.]/g, '')
            const cifPatterns = qNorm !== q ? [`cif.ilike.%${q}%`, `cif.ilike.%${qNorm}%`] : [`cif.ilike.%${q}%`]
            const orCif = cifPatterns.join(',')
            const { data: clientesMatch } = await adminClient
                .from('clientes')
                .select('id')
                .or(`nombre_fiscal.ilike.%${q}%,nombre_comercial.ilike.%${q}%,${orCif}`)
            const clienteIds = clientesMatch?.map((c: { id: string }) => c.id) ?? []
            const orParts: string[] = [`numero.ilike.%${q}%`, `serie.ilike.%${q}%`]
            if (clienteIds.length > 0) orParts.push(`cliente_id.in.(${clienteIds.join(',')})`)
            const importeNum = parseFloat(q.replace(/\./g, '').replace(',', '.'))
            if (!Number.isNaN(importeNum)) orParts.push(`total.eq.${importeNum}`)
            query = query.or(orParts.join(','))
        }

        // Filtro estado
        if (estado && estado !== 'todas') {
            if (estado === 'externa-emitida') {
                query = query.eq('es_externa', true)
            } else if (estado === 'enviada') {
                const { data: facturasEnviadas } = await adminClient
                    .from('emails_factura')
                    .select('factura_id')
                    .eq('estado', 'enviado')
                const idsEnviadas = [...new Set((facturasEnviadas || []).map((e: { factura_id: string }) => e.factura_id))]
                if (idsEnviadas.length > 0) {
                    query = query.in('id', idsEnviadas)
                } else {
                    query = query.eq('id', '00000000-0000-0000-0000-000000000000')
                }
            } else if (estado === 'emitida') {
                const { data: facturasEnviadas } = await adminClient
                    .from('emails_factura')
                    .select('factura_id')
                    .eq('estado', 'enviado')
                const idsEnviadas = new Set((facturasEnviadas || []).map((e: { factura_id: string }) => e.factura_id))
                query = query.eq('estado', 'emitida')
                if (idsEnviadas.size > 0) {
                    const idsStr = Array.from(idsEnviadas).map((id) => `"${id}"`).join(',')
                    query = query.not('id', 'in', `(${idsStr})`)
                }
            } else {
                query = query.eq('estado', estado)
            }
        }

        if (clienteId) query = query.eq('cliente_id', clienteId)
        if (serieId) query = query.eq('serie_id', serieId)

        // Filtro fechas
        if (mes || anio) {
            const anioNum = anio ? parseInt(anio, 10) : new Date().getFullYear()
            const mesNum = mes ? parseInt(mes, 10) : null
            if (mesNum) {
                const desdeStr = `${anioNum}-${String(mesNum).padStart(2, '0')}-01`
                const ultimoDia = new Date(anioNum, mesNum, 0).getDate()
                const hastaStr = `${anioNum}-${String(mesNum).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
                query = query.gte('fecha_emision', desdeStr).lte('fecha_emision', hastaStr)
            } else if (anio) {
                query = query.gte('fecha_emision', `${anioNum}-01-01`).lte('fecha_emision', `${anioNum}-12-31`)
            }
        } else {
            if (desde) query = query.gte('fecha_emision', desde)
            if (hasta) query = query.lte('fecha_emision', hasta)
        }

        // Ordenación (sin paginación)
        if (orderByCliente) {
            query = query.order('nombre_fiscal', { referencedTable: 'clientes', ascending: orderAsc, nullsFirst: false })
        } else if (orderByNumero) {
            query = query.order('serie', { ascending: orderAsc }).order('numero_orden', { ascending: orderAsc, nullsFirst: false })
        } else {
            query = query.order(orderField, { ascending: orderAsc })
        }

        const { data: facturas, error } = await query

        if (error) {
            console.error('[facturas/export]', error)
            return NextResponse.json({ error: 'Error al obtener facturas' }, { status: 500 })
        }

        const rows = (facturas || []).map((f: Record<string, unknown>) => {
            const cliente = f.cliente as { nombre_fiscal?: string; nombre_comercial?: string; cif?: string } | null
            const empresa = f.empresa as { nombre_comercial?: string } | null
            const nombreCliente = cliente?.nombre_fiscal || cliente?.nombre_comercial || ''
            const cif = cliente?.cif || ''
            const base = Number(f.base_imponible) || 0
            const iva = Number(f.cuota_iva) || 0
            const descuento = Number(f.descuento) || 0
            const retencion = Number(f.retencion_irpf) || 0
            const total = Number(f.total) || 0
            return {
                numero: formatFacturaDisplayNumero(f.serie as string, f.numero as string),
                serie: (f.serie as string) || '',
                cliente: nombreCliente,
                cif,
                fechaEmision: formatFechaES(f.fecha_emision as string),
                fechaVencimiento: formatFechaES(f.fecha_vencimiento as string),
                baseImponible: formatNumeroES(base),
                iva: formatNumeroES(iva),
                descuento: formatNumeroES(descuento),
                retencion: formatNumeroES(retencion),
                total: formatNumeroES(total),
                estado: (f.estado as string) || '',
                externa: (f.es_externa as boolean) ? 'Sí' : 'No',
                empresa: empresa?.nombre_comercial || '',
            }
        })

        const headers = ['Número', 'Serie', 'Cliente', 'CIF', 'Fecha Emisión', 'Fecha Vencimiento', 'Base Imponible', 'IVA', 'Descuento', 'Retención', 'Total', 'Estado', 'Externa', 'Empresa']

        if (formatType === 'csv') {
            const csvRows = [headers.join(';'), ...rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))]
            const csv = '\ufeff' + csvRows.join('\n')
            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="facturas-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
                },
            })
        }

        // Excel
        const workbook = new ExcelJS.Workbook()
        workbook.creator = `${clientConfig.nombreCorto} ERP`
        const sheet = workbook.addWorksheet('Facturas')
        sheet.columns = [
            { header: 'Número', key: 'numero', width: 16 },
            { header: 'Serie', key: 'serie', width: 10 },
            { header: 'Cliente', key: 'cliente', width: 35 },
            { header: 'CIF', key: 'cif', width: 14 },
            { header: 'Fecha Emisión', key: 'fechaEmision', width: 14 },
            { header: 'Fecha Vencimiento', key: 'fechaVencimiento', width: 16 },
            { header: 'Base Imponible', key: 'baseImponible', width: 16 },
            { header: 'IVA', key: 'iva', width: 14 },
            { header: 'Descuento', key: 'descuento', width: 12 },
            { header: 'Retención', key: 'retencion', width: 12 },
            { header: 'Total', key: 'total', width: 14 },
            { header: 'Estado', key: 'estado', width: 12 },
            { header: 'Externa', key: 'externa', width: 8 },
            { header: 'Empresa', key: 'empresa', width: 22 },
        ]

        const headerRow = sheet.getRow(1)
        headerRow.font = { bold: true }
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8EC' } }

        rows.forEach((r) => sheet.addRow(r))

        const buffer = await workbook.xlsx.writeBuffer()
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="facturas-${format(new Date(), 'yyyy-MM-dd')}.xlsx"`,
            },
        })
    } catch (err) {
        console.error('[facturas/export]', err)
        return NextResponse.json({ error: 'Error al exportar facturas' }, { status: 500 })
    }
}
