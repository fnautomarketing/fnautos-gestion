import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Suspense } from 'react'
import {
    TrendingUp, Receipt, AlertCircle,
    CheckCircle2, Clock, FileText, AlertTriangle, ExternalLink, ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getKPIsAction } from '@/app/actions/informes'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import Link from 'next/link'
import { DashboardPeriodSelector } from '@/components/dashboard/dashboard-period-selector'
import { DashboardVistaSelector } from '@/components/dashboard/dashboard-vista-selector'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { DashboardKpiCards } from '@/components/dashboard/dashboard-kpi-cards'
import { parseDashboardPeriod, type PeriodoValue, type VistaValue } from '@/lib/dashboard-period'
import { getEvolucionFacturacionAction } from '@/app/actions/informes'

export const dynamic = 'force-dynamic'

interface FacturaReciente {
    id: string
    numero: string
    serie: string | null
    total: number
    estado: string
    fecha_emision: string
    fecha_vencimiento?: string
    divisa: string | null
    cliente: { nombre_fiscal: string | null, nombre_comercial: string | null } | null
    empresa: { nombre_comercial: string | null, razon_social: string | null } | null
}

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const params = await searchParams
    const supabase = await createServerClient()
    await supabase.auth.getUser()

    const userContext = await getUserContext().catch(() => null)
    let companyName = 'Dashboard'
    let welcomeText = 'Resumen de ventas'
    let empresaId: string | null = null
    let isGlobal = false
    const adminClient = createAdminClient()

    const now = new Date()
    const hours = now.getHours()
    let greeting = 'Buenos días'
    if (hours >= 12 && hours < 20) greeting = 'Buenas tardes'
    if (hours >= 20 || hours < 6) greeting = 'Buenas noches'

    const { periodo, vista, desde, hasta } = parseDashboardPeriod(params)
    // Garantizar que son string para evitar lints
    const fechaDesde = `${desde}T00:00:00.000Z`
    const fechaHasta = `${hasta}T23:59:59.999Z`

    const { data: { user } } = await supabase.auth.getUser()
    const userName = (user?.user_metadata?.nombre as string) || (user?.user_metadata?.full_name as string)?.split(' ')[0] || 'Usuario'

    if (userContext) {
        empresaId = userContext.empresaId
        isGlobal = !userContext.empresaId && !!userContext.isAdmin
        
        if (isGlobal) {
            companyName = 'Visión Global'
            welcomeText = `${greeting}, ${userName}. Resumen consolidado de todas las empresas.`
        } else if (userContext.empresaId) {
            const active = userContext.empresas.find((e: { empresa_id: string }) => e.empresa_id === userContext.empresaId) as { empresa?: { nombre_comercial?: string | null, razon_social?: string | null } } | undefined
            companyName = active?.empresa?.nombre_comercial || active?.empresa?.razon_social || 'Tu Empresa'
            welcomeText = `${greeting}, ${userName}. Bienvenido al panel de control de ${companyName}.`
        }
    }

    // ── KPIs principales ──────────────────────────────────────────────────────
    const kpisResult = await getKPIsAction(fechaDesde, fechaHasta)
    const kpis = kpisResult.success && kpisResult.data ? kpisResult.data : {
        actual: { facturacion_total: 0, num_facturas: 0, ticket_medio: 0, dias_cobro_promedio: 0 },
        anterior: { facturacion_total: 0, num_facturas: 0, ticket_medio: 0, dias_cobro_promedio: 0 },
        variaciones: { facturacion: 0, facturas: 0, ticket_medio: 0, dias_cobro: 0 }
    }

    // ── Evolución (para sparklines y gráficos) ──────────────────────────────────
    const evolucionRes = await getEvolucionFacturacionAction(fechaDesde, fechaHasta, empresaId ?? undefined)
    const evolution = evolucionRes.success && evolucionRes.data ? evolucionRes.data : []

    // ── Facturas recientes del período ─────────────────────────────────────────
    let facturasQuery = adminClient
        .from('facturas')
        .select('id, numero, serie, total, estado, fecha_emision, divisa, cliente:clientes(nombre_fiscal, nombre_comercial), empresa:empresas(nombre_comercial, razon_social)')
        .gte('fecha_emision', desde)
        .lte('fecha_emision', hasta)
        .neq('estado', 'anulada')
        .order('fecha_emision', { ascending: false })
        .limit(6)
    if (empresaId) facturasQuery = facturasQuery.eq('empresa_id', empresaId)
    const { data: facturasRecientes } = await facturasQuery

    // ── Estados del período ────────────────────────────────────────────────────
    let estadosQuery = adminClient
        .from('facturas')
        .select('estado')
        .gte('fecha_emision', desde)
        .lte('fecha_emision', hasta)
    if (empresaId) estadosQuery = estadosQuery.eq('empresa_id', empresaId)
    const { data: estadosRaw } = await estadosQuery
    const estadosCount: Record<string, number> = {}
    for (const f of estadosRaw || []) {
        estadosCount[f.estado] = (estadosCount[f.estado] || 0) + 1
    }

    // ── Alertas: vencimientos próximos (7 días) ────────────────────────────────
    const nowLocal = new Date()
    const hoy = nowLocal.toISOString().slice(0, 10)
    const en7dias = new Date(nowLocal.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    let vencimientosQuery = adminClient
        .from('facturas')
        .select('id, numero, serie, total, fecha_vencimiento, cliente:clientes(nombre_fiscal, nombre_comercial)')
        .gte('fecha_vencimiento', hoy)
        .lte('fecha_vencimiento', en7dias)
        .not('estado', 'in', '("pagada","anulada")')
        .order('fecha_vencimiento', { ascending: true })
        .limit(5)
    if (empresaId) vencimientosQuery = vencimientosQuery.eq('empresa_id', empresaId)
    const { data: vencimientosProximos } = await vencimientosQuery

    // ── Desglose por empresa (solo visión global) ──────────────────────────────
    let desgloseEmpresas: Array<{ nombre: string; facturacion: number; num_facturas: number; ticket_medio: number; id: string }> = []
    if (isGlobal && userContext) {
        const empresasDisp = (userContext.empresas as Array<{ empresa_id: string, empresa?: { nombre_comercial?: string | null, razon_social?: string | null } }>)
            .filter((e) => e.empresa_id)
            .slice(0, 10)
        const resultados = await Promise.all(
            empresasDisp.map(async (e) => {
                const res = await getKPIsAction(fechaDesde, fechaHasta, e.empresa_id)
                return {
                    id: e.empresa_id,
                    nombre: e.empresa?.nombre_comercial || e.empresa?.razon_social || e.empresa_id,
                    facturacion: res.success ? (res.data?.actual.facturacion_total ?? 0) : 0,
                    num_facturas: res.success ? (res.data?.actual.num_facturas ?? 0) : 0,
                    ticket_medio: res.success ? (res.data?.actual.ticket_medio ?? 0) : 0,
                }
            })
        )
        desgloseEmpresas = resultados.sort((a, b) => b.facturacion - a.facturacion)
    }

    // ── Helpers de formato ─────────────────────────────────────────────────────
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)

    const formatPeriodoLabel = () => {
        const d = new Date(`${desde}T12:00:00`)
        const h = new Date(`${hasta}T12:00:00`)
        const fmt = (x: Date) => x.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
        return `${fmt(d)} – ${fmt(h)}`
    }

    const estadoBadge = (estado: string) => {
        switch (estado) {
            case 'pagada': return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 text-[10px]">Pagada</Badge>
            case 'emitida': return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 text-[10px]">Emitida</Badge>
            case 'borrador': return <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-0 text-[10px]">Borrador</Badge>
            default: return <Badge variant="secondary" className="text-[10px]">{estado}</Badge>
        }
    }

    const verFacturasUrl = `/ventas/facturas?desde=${desde}&hasta=${hasta}`

    return (
        <div className="space-y-8 pb-8">
            {/* ── Cabecera ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                    <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400" data-testid="dashboard-breadcrumb" aria-label="Breadcrumb">
                        <span>Dashboard</span>
                        <span aria-hidden>›</span>
                        <span className="text-slate-700 dark:text-slate-200 font-medium">Inicio</span>
                    </nav>
                    <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight">
                        {companyName}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">{welcomeText}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Badge
                            variant="outline"
                            className="bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 text-xs font-semibold px-3 py-1 shadow-sm"
                            data-testid="dashboard-datos-periodo"
                        >
                            Datos: {formatPeriodoLabel()}
                        </Badge>
                        {vista === 'semana' && (
                            <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-400 dark:border-amber-600">
                                Vista 7 días
                            </Badge>
                        )}
                    </div>
                </div>
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <DashboardVistaSelector vista={vista as VistaValue} />
                    <Suspense fallback={<div className="h-10 w-full sm:w-[200px] rounded-md border bg-slate-100 animate-pulse" />}>
                        <DashboardPeriodSelector periodo={periodo as PeriodoValue} desde={desde} hasta={hasta} vista={vista as VistaValue} />
                    </Suspense>
                    <Link href="/ventas/facturas/nueva" className="w-full sm:w-auto">
                        <Button variant="premium" size="lg" className="w-full sm:w-auto min-h-[44px] hover:shadow-lg transition-shadow duration-200">+ Nueva Factura</Button>
                    </Link>
                </div>
            </div>

            {/* ── KPIs con sparklines ── */}
            <DashboardKpiCards kpis={kpis} evolution={evolution} vista={vista as VistaValue} />

            {/* ── Gráficos: Evolución + Estados ── */}
            <DashboardCharts
                fechaDesde={fechaDesde}
                fechaHasta={fechaHasta}
                empresaId={empresaId}
            />

            {/* ── Fila: Estados + Alertas ── */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Estados del período */}
                <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/95 shadow-md" data-testid="dashboard-card-estados">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Estados del período
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {Object.entries({ pagada: 'Pagadas', emitida: 'Emitidas', borrador: 'Borradores' }).map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between py-1">
                                <div className="flex items-center gap-2">
                                    {key === 'pagada' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                    {key === 'emitida' && <Clock className="h-4 w-4 text-blue-500" />}
                                    {key === 'borrador' && <FileText className="h-4 w-4 text-slate-400" />}
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white text-sm">{estadosCount[key] ?? 0}</span>
                            </div>
                        ))}
                        {Object.keys(estadosCount).length === 0 && (
                            <div className="flex flex-col items-center justify-center py-6 px-4 text-center" data-testid="dashboard-empty-estados">
                                <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" aria-hidden />
                                <p className="text-sm text-slate-500 dark:text-slate-400">Sin facturas en este período</p>
                                <Link href="/ventas/facturas/nueva" className="mt-3 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                                    Crear factura
                                </Link>
                            </div>
                        )}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Link href={verFacturasUrl} className="group text-xs text-primary hover:underline hover:text-primary/80 transition-colors duration-150 flex items-center gap-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0">
                                Ver todas las facturas del período <ArrowRight className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Alertas: vencimientos próximos */}
                <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/95 shadow-md" data-testid="dashboard-card-vencimientos">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" /> Vencimientos próximos (7 días)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!vencimientosProximos || vencimientosProximos.length === 0 ? (
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 py-6 px-4 text-emerald-600 dark:text-emerald-400" data-testid="dashboard-empty-vencimientos">
                                <CheckCircle2 className="h-10 w-10 sm:h-6 sm:w-6 shrink-0" aria-hidden />
                                <span className="text-sm font-medium text-center sm:text-left">Sin vencimientos pendientes en los próximos 7 días</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {vencimientosProximos.map((f) => (
                                    <Link key={f.id} href={`/ventas/facturas/${f.id}`} className="flex flex-wrap items-center justify-between gap-2 p-2 sm:p-3 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors duration-150 group min-h-[44px] sm:min-h-0">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-mono font-semibold shrink-0">
                                                {f.serie ? `${f.serie}-${f.numero}` : f.numero}
                                            </div>
                                            <span className="text-sm text-slate-700 dark:text-slate-300 truncate min-w-0">
                                                {f.cliente?.nombre_comercial || f.cliente?.nombre_fiscal || '—'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                            <span className="text-xs text-slate-500" suppressHydrationWarning>{new Date(`${f.fecha_vencimiento}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(f.total)}</span>
                                            <ExternalLink className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150" aria-hidden />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Desglose por empresa (solo visión global) ── */}
            {isGlobal && desgloseEmpresas.length > 0 && (
                <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/95 shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Desglose por empresa
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {desgloseEmpresas.map((emp) => (
                                <div key={emp.id} className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 bg-white/80 dark:bg-slate-900/80 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
                                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-3 truncate">{emp.nombre}</p>
                                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                                        <div className="flex justify-between">
                                            <span>Facturación</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(emp.facturacion)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Facturas</span>
                                            <span className="font-semibold">{emp.num_facturas}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Ticket medio</span>
                                            <span className="font-semibold">{formatCurrency(emp.ticket_medio)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Facturas recientes del período ── */}
            {facturasRecientes && facturasRecientes.length > 0 && (
                <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/95 shadow-md" data-testid="dashboard-card-facturas">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <Receipt className="h-4 w-4" /> Facturas del período
                        </CardTitle>
                        <Link href={verFacturasUrl} className="group text-xs text-primary hover:underline hover:text-primary/80 transition-colors duration-150 flex items-center gap-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0">
                            Ver todas <ArrowRight className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {facturasRecientes.map((f: FacturaReciente) => (
                                <Link key={f.id} href={`/ventas/facturas/${f.id}`}
                                    className="flex flex-wrap items-center justify-between gap-2 p-2 sm:p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 group min-h-[44px] sm:min-h-0">
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                                            {f.serie ? `${f.serie}-${f.numero}` : f.numero}
                                        </span>
                                        <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                            {f.cliente?.nombre_comercial || f.cliente?.nombre_fiscal || '—'}
                                        </span>
                                        {isGlobal && (
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded shrink-0">
                                                {f.empresa?.nombre_comercial || f.empresa?.razon_social}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-0 sm:ml-3">
                                        {estadoBadge(f.estado)}
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(f.total)}</span>
                                        <span className="text-xs text-slate-400 hidden sm:inline" suppressHydrationWarning>{new Date(`${f.fecha_emision}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                        <ExternalLink className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150 hidden sm:block" aria-hidden />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Error KPIs ── */}
            {!kpisResult.success && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Error cargando KPIs: {kpisResult.error}</span>
                </div>
            )}
        </div>
    )
}
