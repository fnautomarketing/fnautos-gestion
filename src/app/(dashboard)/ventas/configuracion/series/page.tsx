import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import { SeriesGrid } from '@/components/series/series-grid'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { obtenerOCrearSerieAnualAction } from '@/app/actions/series'

export const dynamic = 'force-dynamic'

export default async function SeriesPage() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { empresaId, rol, empresas } = await getUserContext()
    const isGlobal = !empresaId && rol === 'admin'

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

    if (!perfil?.empresa_id && !isGlobal) throw new Error('Usuario sin empresa')

    const adminClient = createAdminClient()

    // Vision Global → todas las empresas; empresa seleccionada → solo esa
    let empresaIds: string[] = isGlobal
        ? (empresas as { empresa_id: string }[]).map((e) => e.empresa_id).filter(Boolean)
        : [empresaId || perfil!.empresa_id].filter(Boolean)

    // Fallback: si Vision Global o empresaIds vacío, obtener IDs desde BD
    if (empresaIds.length === 0 || isGlobal) {
        const { data: todas } = await adminClient.from('empresas').select('id')
        const idsBd = (todas || []).map((e) => e.id)
        empresaIds = isGlobal ? idsBd : (empresaIds.length > 0 ? empresaIds : idsBd)
    }

    // Asegurar que cada empresa tiene serie del año actual (V2026, Y2026, E2026)
    for (const eid of empresaIds) {
        await obtenerOCrearSerieAnualAction(eid)
    }

    const { data: seriesRaw, error: seriesError } = empresaIds.length > 0
        ? await adminClient
            .from('series_facturacion')
            .select('*')
            .in('empresa_id', empresaIds)
            .order('empresa_id', { ascending: true })
        : { data: [] as any[], error: null }

    if (seriesError) console.error('[SeriesPage] Error:', seriesError)

    // Enriquecer con datos de empresa (la relación FK puede no estar en el schema)
    let series = seriesRaw || []
    if (series.length > 0) {
        const empIds = [...new Set(series.map((s: any) => s.empresa_id))]
        const { data: empresasData } = await adminClient
            .from('empresas')
            .select('id, razon_social, nombre_comercial, tipo_empresa')
            .in('id', empIds)
        const empMap = new Map((empresasData || []).map((e: any) => [e.id, e]))
        series = series.map((s: any) => ({ ...s, empresa: empMap.get(s.empresa_id) || null }))
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <div className="text-sm text-slate-500">
                Ventas › Configuración › Series de Facturación
            </div>

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-serif font-bold">Series de Facturación</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                        Gestiona las series de numeración para tus facturas y documentos
                    </p>
                </div>
                <Link href="/ventas/configuracion/series/nueva" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto min-h-[44px] bg-gradient-to-r from-primary to-yellow-600 hover:scale-105 active:scale-95 transition-all duration-300">
                        + Nueva Serie
                    </Button>
                </Link>
            </div>

            {/* Alert Verifactu */}
            <Alert className="bg-emerald-50/50 border border-emerald-200 backdrop-blur-md dark:bg-emerald-900/20 dark:border-emerald-800">
                <Info className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                    <strong>Verifactu / RD 1007/2023:</strong> Numeración consecutiva por serie y emisor. Formato: Código-Año-Número (ej. F2026-001). Puedes editar el próximo número manualmente si necesitas ajustar la secuencia (no puede ser menor al último emitido).
                </AlertDescription>
            </Alert>

            {seriesError && (
                <p className="text-red-500 text-sm">Error al cargar: {seriesError.message}</p>
            )}
            {/* Grid de series */}
            <SeriesGrid series={series || []} />
        </div>
    )
}
