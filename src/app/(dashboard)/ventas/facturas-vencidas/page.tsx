import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sanitizeSearchInput } from '@/lib/security/sanitize-search'
import { VencidasStats } from '@/components/vencidas/vencidas-stats'
import { VencidasTabla } from '@/components/vencidas/vencidas-tabla'

export default async function FacturasVencidasPage({
    searchParams,
}: {
    searchParams: { nivel?: string; search?: string }
}) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

    if (!perfil) throw new Error('Usuario sin empresa')

    // Cargar facturas vencidas
    let query = supabase
        .from('vista_facturas_vencidas' as any)
        .select('*')
        .eq('empresa_id', perfil.empresa_id)

    // Filtro por nivel de criticidad
    const nivel = searchParams.nivel || 'todas'
    if (nivel !== 'todas') {
        query = query.eq('nivel_criticidad', nivel)
    }

    // Filtro de búsqueda
    const searchSanitized = sanitizeSearchInput(searchParams.search)
    if (searchSanitized) {
        query = query.or(`cliente_nombre.ilike.%${searchSanitized}%,serie.ilike.%${searchSanitized}%`)
    }

    query = query.order('dias_vencido', { ascending: false })

    const { data: facturas } = await query

    // Cargar estadísticas
    // Importante: server action para stats
    const { getEstadisticasVencidasAction } = await import('@/app/actions/recordatorios')
    const statsResult = await getEstadisticasVencidasAction()
    const stats = statsResult.success ? statsResult.data : {}

    return (
        <div className="space-y-6">
            <div className="text-sm text-slate-500">Ventas › Facturas Vencidas</div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-serif font-bold">Facturas Vencidas</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                        Control de impagos y gestión de recordatorios de cobro
                    </p>
                </div>
            </div>

            <VencidasStats stats={stats} />

            <VencidasTabla facturas={(facturas as any) || []} nivel={nivel} />
        </div>
    )
}
