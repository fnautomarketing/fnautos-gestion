import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ClientesTabla } from '@/components/clientes/clientes-tabla'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { Cliente } from '@/types/ventas'
import { Plus } from 'lucide-react'
import { sanitizeSearchInput } from '@/lib/security/sanitize-search'
import { ClientesStats } from '@/components/clientes/clientes-stats'

export const dynamic = 'force-dynamic'

type OrdenValue = 'nombre_asc' | 'nombre_desc' | 'cif_asc' | 'cif_desc' | 'facturacion_asc' | 'facturacion_desc' | 'estado_asc' | 'estado_desc'

export default async function ClientesPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; estado?: string; orden?: string }>
}) {
    const { supabase, empresaId } = await getUserContext()
    const params = await searchParams

    // Ordenación
    const orden = (params.orden || 'nombre_asc') as OrdenValue
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

    // Cargar clientes con filtros
    let query = supabase.from('clientes').select('*')

    if (empresaId) {
        const { data: ces } = await supabase
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

    if (params.search?.trim()) {
        const s = sanitizeSearchInput(params.search)
        if (s) query = query.or(`nombre_fiscal.ilike.%${s}%,cif.ilike.%${s}%,nombre_comercial.ilike.%${s}%`)
    }

    if (params.estado === 'activos') query = query.eq('activo', true)
    if (params.estado === 'inactivos') query = query.eq('activo', false)

    query = query.order(orderField, { ascending: orderAsc, nullsFirst: false })

    const { data: clientesRaw, error } = await query

    let clientes = clientesRaw as unknown as Cliente[]

    if (error) {
        console.error('Error loading clients:', error)
        return <div>Error al cargar clientes</div>
    }

    // Cuando hay empresa seleccionada: facturación solo de esa empresa (no global)
    let totalFacturadoPorCliente: Record<string, number> = {}
    if (empresaId && clientes && clientes.length > 0) {
        const clienteIds = clientes.map((c) => c.id)
        const { data: facturas } = await supabase
            .from('facturas')
            .select('cliente_id, total')
            .eq('empresa_id', empresaId)
            .in('cliente_id', clienteIds)
            .in('estado', ['emitida', 'vencida', 'parcial', 'pagada'])
        for (const f of facturas || []) {
            totalFacturadoPorCliente[f.cliente_id] = (totalFacturadoPorCliente[f.cliente_id] || 0) + Number(f.total ?? 0)
        }
        clientes = clientes.map((c) => ({
            ...c,
            total_facturado: totalFacturadoPorCliente[c.id] ?? 0,
        }))
        if (orden === 'facturacion_asc' || orden === 'facturacion_desc') {
            const asc = orden === 'facturacion_asc'
            clientes = [...clientes].sort((a, b) => {
                const ta = a.total_facturado ?? 0
                const tb = b.total_facturado ?? 0
                return asc ? ta - tb : tb - ta
            })
        }
    }

    // Stats
    const stats = {
        totalClientes: clientes?.length || 0,
        activos: clientes?.filter(c => c.activo).length || 0,
        inactivos: (clientes?.length || 0) - (clientes?.filter(c => c.activo).length || 0),
        facturacionTotal: clientes?.reduce((sum, c) => sum + (c.total_facturado || 0), 0) || 0
    }

    return (
        <div className="space-y-6 p-2 md:p-4 animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="page-clientes">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-slate-500" data-testid="clientes-breadcrumb" aria-label="Breadcrumb">
                <Link href="/ventas" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Ventas</Link>
                <span aria-hidden>›</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">Clientes</span>
            </nav>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        Clientes
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 text-lg">
                        Gestiona la base de datos de tus clientes
                    </p>
                </div>
                <Button asChild size="lg" className="sm:w-auto w-full min-h-[44px] bg-primary hover:bg-primary/90 hover:shadow-lg text-white shadow-lg shadow-primary/20 transition-all duration-300">
                    <Link href="/ventas/clientes/nuevo">
                        <Plus className="h-5 w-5 mr-2" aria-hidden />
                        Nuevo Cliente
                    </Link>
                </Button>
            </div>

            {/* Stats */}
            <ClientesStats stats={stats} />

            {/* Tabla */}
            <div className="space-y-4">
                <ClientesTabla clientes={clientes || []} searchParams={{ search: params.search, estado: params.estado, orden: params.orden }} />
            </div>
        </div>
    )
}