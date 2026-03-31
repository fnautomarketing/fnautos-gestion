import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { sanitizeSearchInput } from '@/lib/security/sanitize-search'
import { PagosStats } from '@/components/pagos/pagos-stats'
import { PagosTabla } from '@/components/pagos/pagos-tabla'
import { getUserContext } from '@/app/actions/usuarios-empresas'

export const dynamic = 'force-dynamic'

export default async function PagosPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string; search?: string; metodo?: string; estado?: string }>
}) {
    const { supabase, empresaId, rol } = await getUserContext()

    // En Next.js 16, searchParams es una Promise y hay que resolverla
    const resolvedSearchParams = await searchParams

    const isGlobalAdmin = !empresaId && rol === 'admin'
    if (!empresaId && !isGlobalAdmin) {
        throw new Error('Usuario sin empresa activa para pagos')
    }

    const tab = resolvedSearchParams.tab || 'todos'
    const search = resolvedSearchParams.search || ''
    const metodo = resolvedSearchParams.metodo || 'todos'
    const today = new Date().toISOString().split('T')[0]

    let pagos: (any & { esFacturaRow: boolean })[] = [] // Still partially generic due to view structure but typed with row indicator

    // IMPORTANTE: Las pestañas "Pendientes" y "Vencidos" deben mostrar FACTURAS pendientes de cobro,
    // no solo registros de pago. vista_pagos_dashboard solo tiene filas por cada PAGO registrado,
    // así que una factura emitida SIN ningún pago nunca aparecería. Los KPIs sí consultan facturas.
    if (tab === 'pendientes' || tab === 'vencidos') {
        let facturasQuery = supabase
            .from('facturas')
            .select(`
                id,
                serie,
                numero,
                total,
                pagado,
                estado,
                fecha_vencimiento,
                empresa_id,
                cliente:clientes(nombre_fiscal)
            `)
            .in('estado', ['emitida', 'parcial'])

        if (tab === 'vencidos') {
            facturasQuery = facturasQuery.lt('fecha_vencimiento', today)
        }

        if (!isGlobalAdmin && empresaId) {
            facturasQuery = facturasQuery.eq('empresa_id', empresaId)
        }

        const q = sanitizeSearchInput(search)
        if (q) {
            const orParts = [`serie.ilike.%${q}%`, `numero.ilike.%${q}%`]
            const { data: clientesMatch } = await supabase
                .from('clientes')
                .select('id')
                .or(`nombre_fiscal.ilike.%${q}%,nombre_comercial.ilike.%${q}%`)
            const clienteIds = (clientesMatch as { id: string }[] | null)?.map((c) => c.id) ?? []
            if (clienteIds.length > 0) {
                orParts.push(`cliente_id.in.(${clienteIds.join(',')})`)
            }
            facturasQuery = facturasQuery.or(orParts.join(','))
        }

        facturasQuery = facturasQuery.order('fecha_vencimiento', { ascending: true })

        const { data: facturas } = await facturasQuery

        // Mapear facturas al formato que espera PagosTabla (una fila por factura pendiente)
        pagos = (facturas || []).map((f) => {
            const totalPagado = Number(f.pagado) || 0
            const pendiente = Math.max(0, Number(f.total) - totalPagado)
            const clienteNombre = f.cliente?.nombre_fiscal || '-'
            return {
                id: `factura-${f.id}`,
                factura_id: f.id,
                serie: f.serie || '',
                numero: f.numero,
                cliente_nombre: clienteNombre,
                fecha_vencimiento: f.fecha_vencimiento,
                factura_total: Number(f.total),
                pendiente,
                metodo_pago: null,
                factura_estado: f.estado,
                conciliado: false,
                esFacturaRow: true,
            }
        })

        // Filtro por método no aplica a facturas pendientes sin pago (todas tienen metodo null)
        // Se ignora para no vaciar la lista; el usuario puede filtrar por método en Cobrados/Parciales
    } else {
        // Cobrados, Parciales, Todos: usamos la tabla pagos con un JOIN a facturas y clientes en lugar de una vista SQL
        let query = supabase.from('pagos').select(`
            id,
            factura_id,
            importe,
            metodo_pago,
            fecha_pago,
            referencia,
            conciliado,
            empresa_id,
            factura:facturas!inner (
                serie,
                numero,
                total,
                pagado,
                estado,
                fecha_vencimiento,
                cliente:clientes (nombre_fiscal, nombre_comercial)
            )
        `)

        if (!isGlobalAdmin && empresaId) {
            query = query.eq('empresa_id', empresaId)
        }

        if (tab === 'cobrados') {
            query = query.eq('factura.estado', 'pagada')
        } else if (tab === 'parciales') {
            query = query.eq('factura.estado', 'parcial')
        }

        if (metodo !== 'todos') {
            query = query.eq('metodo_pago', metodo)
        }

        query = query.order('fecha_pago', { ascending: false })

        const { data } = await query

        // El filtrado de texto lo hacemos en memoria para abarcar campos anidados y la referencia
        const searchSanitized = sanitizeSearchInput(search).toLowerCase()

        // Mapear al modelo que espera la tabla
        pagos = (data || [])
            .map((p: any) => {
                const f = p.factura || {}
                const c = f.cliente || {}
                const clienteNombre = c.nombre_fiscal || c.nombre_comercial || '-'
                
                return {
                    id: p.id,
                    factura_id: p.factura_id || '',
                    serie: f.serie || '',
                    numero: f.numero || '',
                    cliente_nombre: clienteNombre,
                    fecha_vencimiento: f.fecha_vencimiento || p.fecha_pago,
                    factura_total: Number(f.total) || 0,
                    pendiente: Math.max(0, Number(f.total) - Number(f.pagado)),
                    metodo_pago: p.metodo_pago,
                    factura_estado: f.estado,
                    conciliado: Boolean(p.conciliado),
                    referencia: p.referencia || '',
                    esFacturaRow: false,
                }
            })
            .filter((p) => {
                 if (!searchSanitized) return true
                 const str = `${p.serie}-${p.numero} ${p.cliente_nombre} ${p.referencia}`.toLowerCase()
                 return str.includes(searchSanitized)
            })
    }

    // Cargar estadísticas
    // Using rpc if defined, or reusing server action logic. The migration didn't include 'get_estadisticas_pagos' RPC function.
    // The server action 'getEstadisticasPagosAction' was defined in 'src/app/actions/pagos.ts'.
    // However, the prompt's page code calls `supabase.rpc('get_estadisticas_pagos', ...)` which implies referencing a stored procedure.
    // The migration SQL provided in step 1/2 did NOT include `get_estadisticas_pagos` function.
    // BUT, the prompt's `getEstadisticasPagosAction` is a SERVER ACTION that calculates it in JS/Node.
    // In `PagosPage`, the prompt calls `supabase.rpc`. This is a discrepancy in the user prompt.
    // Prompt says: "Cargar estadísticas: const { data: stats } = await supabase.rpc('get_estadisticas_pagos'..."
    // But also provided `getEstadisticasPagosAction` in `src/app/actions/pagos.ts` which does logic in JS.
    // I should probably use the Server Action `getEstadisticasPagosAction` directly in the page component instead of RPC, 
    // OR create the RPC function.
    // Given I deployed the migration provided which didn't have the RPC, calling RPC checks against the DB will fail.
    // I will use `getEstadisticasPagosAction` from locally imported actions. This is safer and matches the backend logic provided.

    // Import the action
    const { getEstadisticasPagosAction } = await import('@/app/actions/pagos')
    const statsResult = await getEstadisticasPagosAction()
    const stats = statsResult.success ? statsResult.data : ({} as any)

    return (
        <div className="space-y-6">
            <div className="text-sm text-slate-500">Ventas › Pagos</div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-serif font-bold">Gestión de Pagos</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                        Controla los cobros de tus facturas y concilia pagos
                    </p>
                </div>
                <Link href="/ventas/pagos/registrar" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto min-h-[44px] bg-linear-to-r from-primary to-primary/80 hover:scale-105 active:scale-95 transition-all duration-300">
                        + Registrar Pago
                    </Button>
                </Link>
            </div>

            {/* Explicit cast or use generic component */}
            <PagosStats stats={stats} />

            <PagosTabla
                pagos={pagos}
                tab={tab}
                search={resolvedSearchParams.search || ''}
                metodo={resolvedSearchParams.metodo || 'todos'}
            />
        </div>
    )
}
