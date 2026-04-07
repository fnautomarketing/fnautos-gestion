import { createAdminClient } from '@/lib/supabase/admin'
import { FacturasTable } from '@/components/ventas/facturas-table'
import { FacturasStats } from '@/components/ventas/facturas-stats'
import { FacturasFilters } from '@/components/ventas/facturas-filters'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { FacturaWithCliente } from '@/types/ventas'

interface SearchParams {
    q?: string
    estado?: string
    desde?: string
    hasta?: string
    mes?: string
    anio?: string
    serie?: string
    page?: string
    pageSize?: string
    orden?: string
    clienteId?: string
    clienteLabel?: string
}

import { getUserContext } from '@/app/actions/usuarios-empresas'
import { sanitizeSearchInput } from '@/lib/security/sanitize-search'

export const dynamic = 'force-dynamic'

export default async function FacturasPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    const params = await searchParams
    const adminClient = createAdminClient()

    // Obtener contexto de empresa (soporta Global/Null)
    const { empresaId, empresas } = await getUserContext()

    // Series para filtro: por empresa o solo de empresas del usuario (evita duplicados GRAL de empresas huérfanas)
    const empresaIds = (empresas as { empresa_id?: string }[]).map((e) => e.empresa_id).filter(Boolean) as string[]
    const seriesQuery = empresaId
        ? adminClient.from('series_facturacion').select('id, codigo, nombre').eq('empresa_id', empresaId).eq('activa', true).order('codigo')
        : empresaIds.length > 0
            ? adminClient.from('series_facturacion').select('id, codigo, nombre').in('empresa_id', empresaIds).eq('activa', true).order('codigo')
            : adminClient.from('series_facturacion').select('id, codigo, nombre').eq('activa', true).order('codigo')
    const { data: series } = await seriesQuery

    // Resolver ordenación
    type OrderField = 'fecha_emision' | 'total' | 'estado' | 'numero_orden'
    let orderField: OrderField = 'fecha_emision'
    let orderAsc = false
    let orderByCliente = false
    let orderByNumero = false

    switch (params.orden) {
        case 'fecha_asc':
            orderField = 'fecha_emision'; orderAsc = true; break
        case 'fecha_desc':
            orderField = 'fecha_emision'; orderAsc = false; break
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
        case 'estado_asc':
            orderField = 'estado'; orderAsc = true; break
        case 'estado_desc':
            orderField = 'estado'; orderAsc = false; break
        default:
            orderField = 'fecha_emision'; orderAsc = false; break
    }

    let query = adminClient
        .from('facturas')
        .select(`
      *,
      cliente:clientes(nombre_fiscal, nombre_comercial, cif),
      empresa:empresas(nombre_comercial)
    `, { count: 'exact' })

    if (orderByCliente) {
        query = query.order('nombre_fiscal', { referencedTable: 'clientes', ascending: orderAsc, nullsFirst: false })
    } else if (orderByNumero) {
        query = query.order('serie', { ascending: orderAsc }).order('numero_orden', { ascending: orderAsc, nullsFirst: false })
    } else {
        query = query.order(orderField, { ascending: orderAsc })
    }

    if (empresaId) query = query.eq('empresa_id', empresaId)

    // Aplicar filtros de búsqueda (cliente, CIF/NIF, número, serie, importe)
    const q = sanitizeSearchInput(params.q)
    if (q) {
        // Para CIF/NIF: búsqueda con y sin espacios/guiones (ej. "B 12345678" vs "B12345678")
        const qNorm = q.replace(/[\s\-.]/g, '')
        const cifPatterns = qNorm !== q ? [`cif.ilike.%${q}%`, `cif.ilike.%${qNorm}%`] : [`cif.ilike.%${q}%`]
        const orCif = cifPatterns.join(',')
        const { data: clientesMatch } = await adminClient
            .from('clientes')
            .select('id')
            .or(`nombre_fiscal.ilike.%${q}%,nombre_comercial.ilike.%${q}%,${orCif}`)

        const clienteIds = clientesMatch?.map((c) => c.id) ?? []
        const orParts: string[] = [
            `numero.ilike.%${q}%`,
            `serie.ilike.%${q}%`,
        ]
        if (clienteIds.length > 0) {
            orParts.push(`cliente_id.in.(${clienteIds.join(',')})`)
        }
        // Búsqueda por importe (ej. "1210" o "1.210")
        const importeNum = parseFloat(q.replace(/\./g, '').replace(',', '.'))
        if (!Number.isNaN(importeNum)) {
            orParts.push(`total.eq.${importeNum}`)
        }
        query = query.or(orParts.join(','))
    }

    if (params.estado && params.estado !== 'todas') {
        if (params.estado === 'externa-emitida') {
            // Externas: todas las facturas con es_externa=true (emitida, pagada, borrador, etc.)
            query = query.eq('es_externa', true)
        } else if (params.estado === 'enviada') {
            // Facturas que tienen al menos un email enviado correctamente
            const { data: facturasEnviadas } = await adminClient
                .from('emails_factura')
                .select('factura_id')
                .eq('estado', 'enviado')
            const idsEnviadas = [...new Set((facturasEnviadas || []).map((e: { factura_id: string }) => e.factura_id))]
            if (idsEnviadas.length > 0) {
                query = query.in('id', idsEnviadas)
            } else {
                // Ninguna factura enviada, devolver resultado vacío
                query = query.eq('id', '00000000-0000-0000-0000-000000000000')
            }
        } else if (params.estado === 'emitida') {
            // Solo estado emitida: excluir las que ya fueron enviadas por email
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
            query = query.eq('estado', params.estado)
        }
    }

    if (params.clienteId) query = query.eq('cliente_id', params.clienteId)
    if (params.serie) query = query.eq('serie_id', params.serie)

    if (params.mes || params.anio) {
        const anio = params.anio ? parseInt(params.anio, 10) : new Date().getFullYear()
        const mes = params.mes ? parseInt(params.mes, 10) : null
        if (mes) {
            const desde = `${anio}-${String(mes).padStart(2, '0')}-01`
            const hasta = `${anio}-${String(mes).padStart(2, '0')}-${String(new Date(anio, mes, 0).getDate()).padStart(2, '0')}`
            query = query.gte('fecha_emision', desde).lte('fecha_emision', hasta)
        } else if (params.anio) query = query.gte('fecha_emision', `${anio}-01-01`).lte('fecha_emision', `${anio}-12-31`)
    } else {
        if (params.desde) query = query.gte('fecha_emision', params.desde)
        if (params.hasta) query = query.lte('fecha_emision', params.hasta)
    }

    const page = parseInt(params.page || '1')
    const pageSize = Math.min(50, Math.max(10, parseInt(params.pageSize || '10', 10) || 10))
    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1)

    const { data: facturas, error, count } = await query
    if (error) {
        console.error('Error al obtener facturas:', error)
        throw new Error('Error al cargar facturas')
    }

    // IDs de facturas enviadas por email (para mostrar badge "Enviada" en la tabla)
    let enviadaIds: string[] = []
    if (facturas && facturas.length > 0) {
        const ids = facturas.map((f: { id: string }) => f.id)
        const { data: emails } = await adminClient
            .from('emails_factura')
            .select('factura_id')
            .in('factura_id', ids)
            .eq('estado', 'enviado')
        if (emails) {
            enviadaIds = [...new Set(emails.map((e: { factura_id: string }) => e.factura_id))]
        }
    }

    // Stats filtrados (mismos filtros que la tabla)
    let statsQuery = adminClient.from('facturas').select('total, estado, fecha_emision')
    if (empresaId) {
        statsQuery = statsQuery.eq('empresa_id', empresaId)
    }

    // Aplicar mismos filtros que la query principal (sin paginación)
    if (params.q?.trim()) {
        const q = String(params.q).trim()
        const qNorm = q.replace(/[\s\-.]/g, '')
        const cifPatterns = qNorm !== q ? [`cif.ilike.%${q}%`, `cif.ilike.%${qNorm}%`] : [`cif.ilike.%${q}%`]
        const { data: clientesMatch } = await adminClient.from('clientes').select('id').or(`nombre_fiscal.ilike.%${q}%,nombre_comercial.ilike.%${q}%,${cifPatterns.join(',')}`)
        const clienteIds = clientesMatch?.map((c: { id: string }) => c.id) ?? []
        const orParts: string[] = [`numero.ilike.%${q}%`, `serie.ilike.%${q}%`]
        if (clienteIds.length > 0) orParts.push(`cliente_id.in.(${clienteIds.join(',')})`)
        const importeNum = parseFloat(q.replace(/\./g, '').replace(',', '.'))
        if (!Number.isNaN(importeNum)) orParts.push(`total.eq.${importeNum}`)
        statsQuery = statsQuery.or(orParts.join(','))
    }
    if (params.estado && params.estado !== 'todas') {
        if (params.estado === 'externa-emitida') statsQuery = statsQuery.eq('es_externa', true)
        else if (params.estado === 'enviada') {
            const { data: fe } = await adminClient.from('emails_factura').select('factura_id').eq('estado', 'enviado')
            const ids = [...new Set((fe || []).map((e: { factura_id: string }) => e.factura_id))]
            statsQuery = ids.length > 0 ? statsQuery.in('id', ids) : statsQuery.eq('id', '00000000-0000-0000-0000-000000000000')
        } else if (params.estado === 'emitida') {
            const { data: fe } = await adminClient.from('emails_factura').select('factura_id').eq('estado', 'enviado')
            const idsEnviadas = new Set((fe || []).map((e: { factura_id: string }) => e.factura_id))
            statsQuery = statsQuery.eq('estado', 'emitida')
            if (idsEnviadas.size > 0) {
                const idsStr = Array.from(idsEnviadas).map((id) => `"${id}"`).join(',')
                statsQuery = statsQuery.not('id', 'in', `(${idsStr})`)
            }
        } else statsQuery = statsQuery.eq('estado', params.estado)
    }
    if (params.clienteId) statsQuery = statsQuery.eq('cliente_id', params.clienteId)
    if (params.serie) statsQuery = statsQuery.eq('serie_id', params.serie)
    if (params.mes || params.anio) {
        const anio = params.anio ? parseInt(params.anio, 10) : new Date().getFullYear()
        const mes = params.mes ? parseInt(params.mes, 10) : null
        if (mes) {
            const desde = `${anio}-${String(mes).padStart(2, '0')}-01`
            const ultimoDia = new Date(anio, mes, 0).getDate()
            const hasta = `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
            statsQuery = statsQuery.gte('fecha_emision', desde).lte('fecha_emision', hasta)
        } else if (params.anio) {
            statsQuery = statsQuery.gte('fecha_emision', `${anio}-01-01`).lte('fecha_emision', `${anio}-12-31`)
        }
    } else {
        if (params.desde) statsQuery = statsQuery.gte('fecha_emision', params.desde)
        if (params.hasta) statsQuery = statsQuery.lte('fecha_emision', params.hasta)
    }

    const { data: statsData } = await statsQuery

    const stats = {
        totalFacturado: statsData?.reduce((sum, f) => sum + (Number(f.total) || 0), 0) || 0,
        pendienteCobro: statsData?.filter((f) => f.estado === 'emitida').reduce((sum, f) => sum + (Number(f.total) || 0), 0) || 0,
        vencidas: statsData?.filter((f) => f.estado === 'vencida').reduce((sum, f) => sum + (Number(f.total) || 0), 0) || 0,
        esteMes: statsData?.filter((f) => {
            const fecha = new Date(f.fecha_emision)
            const hoy = new Date()
            return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
        }).reduce((sum, f) => sum + (Number(f.total) || 0), 0) || 0,
    }

    return (
        <div data-testid="page-facturas" className="space-y-6 p-2 md:p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/ventas" className="hover:text-slate-700 transition-colors">Ventas</Link>
                <span>›</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">Facturas</span>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">Facturas</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 text-lg">Gestiona y consulta todas tus facturas de venta</p>
                </div>
                <Button asChild size="lg" className="sm:w-auto w-full min-h-[44px] bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
                    <Link href="/ventas/facturas/nueva">
                        <Plus className="h-5 w-5 mr-2" />
                        Nueva Factura
                    </Link>
                </Button>
            </div>
            <FacturasStats stats={stats} />
            <div className="space-y-4">
                {/* Filtros */}
                <FacturasFilters
                    series={series || []}
                    pageSize={pageSize}
                />

                {/* Tabla */}
                <FacturasTable
                    facturas={(facturas || []) as unknown as FacturaWithCliente[]}
                    totalCount={count || 0}
                    currentPage={page}
                    pageSize={pageSize}
                    searchQuery={params.q?.trim() || undefined}
                    enviadaIds={enviadaIds}
                />
            </div>
        </div>
    )
}
