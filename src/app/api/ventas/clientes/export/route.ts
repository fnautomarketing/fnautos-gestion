import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { sanitizeSearchInput } from '@/lib/security/sanitize-search'
import { auditLog } from '@/lib/security/audit-log'
import { clientConfig } from '@/config/clients'

/** Formato numérico español */
function formatNumeroES(n: number): string {
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n)
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const formatType = searchParams.get('format') || 'xlsx'
        if (formatType !== 'xlsx' && formatType !== 'csv') {
            return NextResponse.json({ error: 'Formato no válido. Use format=xlsx o format=csv' }, { status: 400 })
        }

        const { empresaId, userId } = await getUserContext()
        auditLog('export_clientes', userId, { empresaId, format: formatType })
        const adminClient = createAdminClient()

        const search = sanitizeSearchInput(searchParams.get('search'))
        const estado = searchParams.get('estado') || 'todos'
        const orden = searchParams.get('orden') || 'nombre_asc'

        let orderField = 'nombre_fiscal'
        let orderAsc = true
        switch (orden) {
            case 'nombre_desc': orderField = 'nombre_fiscal'; orderAsc = false; break
            case 'cif_asc': orderField = 'cif'; orderAsc = true; break
            case 'cif_desc': orderField = 'cif'; orderAsc = false; break
            case 'facturacion_asc': orderField = 'total_facturado'; orderAsc = true; break
            case 'facturacion_desc': orderField = 'total_facturado'; orderAsc = false; break
            case 'estado_asc': orderField = 'activo'; orderAsc = true; break
            case 'estado_desc': orderField = 'activo'; orderAsc = false; break
            default: orderField = 'nombre_fiscal'; orderAsc = true; break
        }

        let query = adminClient.from('clientes').select('*')

        if (empresaId) {
            const { data: ces } = await adminClient
                .from('clientes_empresas')
                .select('cliente_id')
                .eq('empresa_id', empresaId)
            const clienteIds = (ces || []).map((c: { cliente_id: string }) => c.cliente_id)
            if (clienteIds.length > 0) {
                query = query.in('id', clienteIds)
            } else {
                query = query.eq('id', '00000000-0000-0000-0000-000000000000')
            }
        }

        if (search) {
            query = query.or(`nombre_fiscal.ilike.%${search}%,cif.ilike.%${search}%,nombre_comercial.ilike.%${search}%`)
        }
        if (estado === 'activos') query = query.eq('activo', true)
        if (estado === 'inactivos') query = query.eq('activo', false)

        query = query.order(orderField, { ascending: orderAsc, nullsFirst: false })

        const { data: clientesRaw, error } = await query

        if (error) {
            console.error('[clientes/export]', error)
            return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 })
        }

        let clientes = (clientesRaw || []) as Array<Record<string, unknown> & { id: string; total_facturado?: number }>

        // Facturación por empresa cuando hay empresa seleccionada
        if (empresaId && clientes.length > 0) {
            const clienteIds = clientes.map((c) => c.id)
            const { data: facturas } = await adminClient
                .from('facturas')
                .select('cliente_id, total')
                .eq('empresa_id', empresaId)
                .in('cliente_id', clienteIds)
                .in('estado', ['emitida', 'vencida', 'parcial', 'pagada'])
            const totalPorCliente: Record<string, number> = {}
            for (const f of facturas || []) {
                totalPorCliente[f.cliente_id] = (totalPorCliente[f.cliente_id] || 0) + Number(f.total ?? 0)
            }
            clientes = clientes.map((c) => ({ ...c, total_facturado: totalPorCliente[c.id] ?? 0 }))
            if (orden === 'facturacion_asc' || orden === 'facturacion_desc') {
                const asc = orden === 'facturacion_asc'
                clientes = [...clientes].sort((a, b) => {
                    const ta = Number(a.total_facturado) || 0
                    const tb = Number(b.total_facturado) || 0
                    return asc ? ta - tb : tb - ta
                })
            }
        }

        const rows = clientes.map((c: Record<string, unknown>) => ({
            nombre: (c.nombre_fiscal as string) || '',
            cif: (c.cif as string) || '',
            email: (c.email_principal as string) || '',
            telefono: (c.telefono_principal as string) || '',
            ciudad: (c.ciudad as string) || '',
            facturacion: formatNumeroES(Number(c.total_facturado) || 0),
            estado: (c.activo as boolean) ? 'Activo' : 'Inactivo',
        }))

        const headers = ['Nombre', 'CIF', 'Email', 'Teléfono', 'Ciudad', 'Facturación', 'Estado']

        if (formatType === 'csv') {
            const csvRows = [headers.join(';'), ...rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))]
            const csv = '\ufeff' + csvRows.join('\n')
            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="clientes-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
                },
            })
        }

        const workbook = new ExcelJS.Workbook()
        workbook.creator = `${clientConfig.nombreCorto} ERP`
        const sheet = workbook.addWorksheet('Clientes')
        sheet.columns = [
            { header: 'Nombre', key: 'nombre', width: 35 },
            { header: 'CIF', key: 'cif', width: 14 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Teléfono', key: 'telefono', width: 16 },
            { header: 'Ciudad', key: 'ciudad', width: 20 },
            { header: 'Facturación', key: 'facturacion', width: 16 },
            { header: 'Estado', key: 'estado', width: 10 },
        ]

        const headerRow = sheet.getRow(1)
        headerRow.font = { bold: true }
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8EC' } }

        rows.forEach((r) => sheet.addRow(r))

        const buffer = await workbook.xlsx.writeBuffer()
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="clientes-${format(new Date(), 'yyyy-MM-dd')}.xlsx"`,
            },
        })
    } catch (err) {
        console.error('[clientes/export]', err)
        return NextResponse.json({ error: 'Error al exportar clientes' }, { status: 500 })
    }
}
