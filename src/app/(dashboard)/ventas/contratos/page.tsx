import { createAdminClient } from '@/lib/supabase/admin'
import { ContratosTable } from '@/components/contratos/contratos-table'
import { ContratosStats } from '@/components/contratos/contratos-stats'
import { ContratosFilters } from '@/components/contratos/contratos-filters'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import type { Contrato } from '@/types/contratos'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { sanitizeSearchInput } from '@/lib/security/sanitize-search'

export const dynamic = 'force-dynamic'

interface SearchParams {
    q?: string
    estado?: string
    tipo?: string
    desde?: string
    hasta?: string
    mes?: string
    anio?: string
    page?: string
    pageSize?: string
    orden?: string
}

export default async function ContratosPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    const params = await searchParams
    const adminClient = createAdminClient()
    const { empresaId } = await getUserContext()

    // Base query para contratos
    let query = adminClient
        .from('contratos')
        .select('*', { count: 'exact' })

    if (empresaId) {
        query = query.eq('empresa_id', empresaId)
    }

    // Resolver ordenación
    type OrderField = 'created_at' | 'total_con_iva' | 'estado' | 'numero_contrato'
    let orderField: OrderField = 'created_at'
    let orderAsc = false

    switch (params.orden) {
        case 'fecha_asc':
            orderField = 'created_at'; orderAsc = true; break
        case 'fecha_desc':
            orderField = 'created_at'; orderAsc = false; break
        case 'total_desc':
            orderField = 'total_con_iva'; orderAsc = false; break
        case 'total_asc':
            orderField = 'total_con_iva'; orderAsc = true; break
        case 'numero_asc':
            orderField = 'numero_contrato'; orderAsc = true; break
        case 'numero_desc':
            orderField = 'numero_contrato'; orderAsc = false; break
        case 'estado_asc':
            orderField = 'estado'; orderAsc = true; break
        case 'estado_desc':
            orderField = 'estado'; orderAsc = false; break
        default:
            orderField = 'created_at'; orderAsc = false; break
    }

    query = query.order(orderField, { ascending: orderAsc })

    // Búsqueda general
    const q = sanitizeSearchInput(params.q)
    if (q) {
        const orParts: string[] = [
            `numero_contrato.ilike.%${q}%`,
            `comprador_nombre.ilike.%${q}%`,
            `vendedor_nombre.ilike.%${q}%`,
            `vehiculo_matricula.ilike.%${q}%`,
            `vehiculo_marca.ilike.%${q}%`,
        ]
        
        // Búsqueda por importe
        const importeNum = parseFloat(q.replace(/\./g, '').replace(',', '.'))
        if (!Number.isNaN(importeNum)) {
            orParts.push(`total_con_iva.eq.${importeNum}`)
            orParts.push(`precio_venta.eq.${importeNum}`)
        }
        
        query = query.or(orParts.join(','))
    }

    // Filtro por estado
    if (params.estado && params.estado !== 'todos') {
        query = query.eq('estado', params.estado)
    }

    // Filtro por tipo de operación
    if (params.tipo && params.tipo !== 'todos') {
        query = query.eq('tipo_operacion', params.tipo)
    }

    // Filtros de fecha
    if (params.mes || params.anio) {
        const anio = params.anio ? parseInt(params.anio, 10) : new Date().getFullYear()
        const mes = params.mes ? parseInt(params.mes, 10) : null
        
        if (mes) {
            const desde = `${anio}-${String(mes).padStart(2, '0')}-01T00:00:00.000Z`
            const hasta = `${anio}-${String(mes).padStart(2, '0')}-${String(new Date(anio, mes, 0).getDate()).padStart(2, '0')}T23:59:59.999Z`
            query = query.gte('created_at', desde).lte('created_at', hasta)
        } else if (params.anio) {
            query = query.gte('created_at', `${anio}-01-01T00:00:00.000Z`).lte('created_at', `${anio}-12-31T23:59:59.999Z`)
        }
    } else {
        if (params.desde) query = query.gte('created_at', `${params.desde}T00:00:00.000Z`)
        if (params.hasta) query = query.lte('created_at', `${params.hasta}T23:59:59.999Z`)
    }

    // Paginación
    const page = parseInt(params.page || '1')
    const pageSize = Math.min(50, Math.max(10, parseInt(params.pageSize || '10', 10) || 10))
    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1)

    const { data: contratos, error, count } = await query

    if (error) {
        console.error('Error al obtener contratos:', error)
        throw new Error('Error al cargar contratos')
    }

    // Stats
    let statsQuery = adminClient.from('contratos').select('total_con_iva, estado, tipo_operacion, created_at')
    if (empresaId) statsQuery = statsQuery.eq('empresa_id', empresaId)

    const { data: allStatsData } = await statsQuery

    const stats = {
        totalVentas: allStatsData?.filter(c => c.tipo_operacion === 'venta').reduce((sum, c) => sum + (Number(c.total_con_iva) || 0), 0) || 0,
        totalCompras: allStatsData?.filter(c => c.tipo_operacion === 'compra').reduce((sum, c) => sum + (Number(c.total_con_iva) || 0), 0) || 0,
        firmados: allStatsData?.filter(c => c.estado === 'firmado').length || 0,
        pendientesFirma: allStatsData?.filter(c => c.estado === 'pendiente_firma').length || 0,
    }

    return (
        <div data-testid="page-contratos" className="space-y-6 p-2 md:p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/ventas" className="hover:text-slate-700 transition-colors">Ventas</Link>
                <span>›</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">Contratos</span>
            </div>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">Contratos de Vehículos</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 text-lg">Gestiona compraventas y firmas digitales</p>
                </div>
                <Button asChild size="lg" className="sm:w-auto w-full min-h-[44px] bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
                    <Link href="/ventas/contratos/nuevo">
                        <Plus className="h-5 w-5 mr-2" />
                        Nuevo Contrato
                    </Link>
                </Button>
            </div>

            <ContratosStats stats={stats} />

            <div className="space-y-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
                <ContratosFilters pageSize={pageSize} />
                <ContratosTable
                    contratos={(contratos || []) as typeof contratos}
                    totalCount={count || 0}
                    currentPage={page}
                    pageSize={pageSize}
                    searchQuery={params.q?.trim() || undefined}
                />
            </div>
        </div>
    )
}
