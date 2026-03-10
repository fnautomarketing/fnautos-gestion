'use client'

import {
    TrendingUp,
    Wallet,
    Receipt,
    CalendarClock,
    Info,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'
import type { KPIsData } from '@/app/actions/informes'
import type { EvolucionData } from '@/app/actions/informes'

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)

const formatTrend = (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`

function KpiInfoButton({ title, description }: { title: string; description: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full h-9 w-9 min-h-[44px] min-w-[44px] sm:h-5 sm:w-5 sm:min-h-0 sm:min-w-0 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 hover:scale-110 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none ml-1 shrink-0 motion-reduce:transition-none motion-reduce:hover:scale-100"
                    aria-label={`Información sobre ${title}`}
                >
                    <Info className="h-3 w-3" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4 max-w-[90vw]" align="start">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
            </PopoverContent>
        </Popover>
    )
}

interface DashboardKpiCardsProps {
    kpis: KPIsData
    evolution: EvolucionData[]
    vista: 'semana' | 'mes'
}

function MiniSparkline({
    data,
    dataKey,
    color = 'hsl(var(--primary))',
    format = (v: number) => String(v),
}: {
    data: { periodo: string; value: number }[]
    dataKey: string
    color?: string
    format?: (v: number) => string
}) {
    if (!data.length) return null
    return (
        <div className="h-8 min-h-[32px] w-full min-w-[60px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={60} minHeight={24}>
                <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <XAxis dataKey="periodo" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip formatter={(v: number) => [format(v), '']} contentStyle={{ fontSize: 10 }} />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

export function DashboardKpiCards({ kpis, evolution, vista }: DashboardKpiCardsProps) {
    const sparklineDataFact = evolution.map((e) => ({
        periodo: e.periodo,
        value: e.facturacion,
    }))
    const sparklineDataCount = evolution.map((e) => ({
        periodo: e.periodo,
        value: e.num_facturas,
    }))
    const sparklineDataTicket = evolution.map((e) => ({
        periodo: e.periodo,
        value: e.num_facturas ? e.facturacion / e.num_facturas : 0,
    }))

    const trendLabel = vista === 'semana' ? 'vs 7d ant.' : 'vs período ant.'

    const kpiIds = ['facturacion', 'num-facturas', 'ticket-medio', 'dias-cobro'] as const
    const items = [
        {
            id: kpiIds[0],
            label: 'Facturación del período',
            description: 'Suma total facturada en el período seleccionado (según el selector de fechas). Incluye facturas emitidas y pagadas; no incluye borradores ni anuladas.',
            value: formatCurrency(kpis.actual.facturacion_total),
            trend: formatTrend(kpis.variaciones.facturacion),
            trendUp: kpis.variaciones.facturacion >= 0,
            icon: TrendingUp,
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-100 dark:bg-green-900/30',
            sparkline: <MiniSparkline data={sparklineDataFact} dataKey="value" color="#10b981" format={(v) => formatCurrency(v)} />,
        },
        {
            id: kpiIds[1],
            label: 'Nº Facturas',
            description: 'Número total de facturas emitidas en el período. Cada factura cuenta una vez, independientemente del importe.',
            value: kpis.actual.num_facturas.toString(),
            trend: formatTrend(kpis.variaciones.facturas),
            trendUp: kpis.variaciones.facturas >= 0,
            icon: Receipt,
            color: 'text-primary',
            bg: 'bg-primary/20',
            sparkline: <MiniSparkline data={sparklineDataCount} dataKey="value" color="#3b82f6" />,
        },
        {
            id: kpiIds[2],
            label: 'Ticket Medio',
            description: 'Importe medio por factura en el período (Facturación total ÷ Nº de facturas). Útil para ver el tamaño medio de tus ventas.',
            value: formatCurrency(kpis.actual.ticket_medio),
            trend: formatTrend(kpis.variaciones.ticket_medio),
            trendUp: kpis.variaciones.ticket_medio >= 0,
            icon: Wallet,
            color: 'text-primary',
            bg: 'bg-primary/20',
            sparkline: <MiniSparkline data={sparklineDataTicket} dataKey="value" color="hsl(var(--primary))" format={(v) => formatCurrency(v)} />,
        },
        {
            id: kpiIds[3],
            label: 'Días Cobro (Promedio)',
            description: 'Número medio de días entre la fecha de emisión y la fecha en que se registró el pago. Un valor más bajo indica cobros más rápidos.',
            value: kpis.actual.dias_cobro_promedio.toFixed(0),
            trend: formatTrend(kpis.variaciones.dias_cobro),
            trendUp: kpis.variaciones.dias_cobro <= 0,
            icon: CalendarClock,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            sparkline: null,
        },
    ]

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((kpi, idx) => (
                <Card
                    key={idx}
                    data-testid={`dashboard-kpi-card-${kpi.id}`}
                    className="group relative overflow-hidden border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/20 transition-all duration-200 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:ring-0 focus-within:ring-2 focus-within:ring-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both motion-reduce:animate-none"
                    style={{ animationDelay: `${idx * 75}ms` } as React.CSSProperties}
                >
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/40 to-transparent opacity-80" />
                    <CardContent className="p-4 sm:p-5 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <div className={`rounded-lg p-2.5 transition-transform duration-200 group-hover:scale-105 ${kpi.bg}`}>
                                <kpi.icon className={`h-5 w-5 ${kpi.color}`} aria-hidden />
                            </div>
                            <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                    kpi.trendUp ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                                }`}
                            >
                                {kpi.trend} {trendLabel}
                            </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center flex-wrap gap-0.5">
                            {kpi.label}
                            <KpiInfoButton title={kpi.label} description={kpi.description} />
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight break-all">
                            {kpi.value}
                        </p>
                        {kpi.sparkline && (
                            <div className="mt-3 opacity-80">{kpi.sparkline}</div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
