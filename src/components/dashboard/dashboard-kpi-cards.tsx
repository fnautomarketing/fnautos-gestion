'use client'

import { useEffect, useState, useMemo } from 'react'
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
    AreaChart,
    Area,
} from 'recharts'
import type { KPIsData } from '@/app/actions/informes'
import type { EvolucionData } from '@/app/actions/informes'
import { cn } from '@/lib/utils'

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)

const formatTrend = (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`

function AnimateNumber({ value, formatter = (v: number) => String(v), duration = 1000 }: { value: number, formatter?: (v: number) => string, duration?: number }) {
    const [displayValue, setDisplayValue] = useState(0)

    useEffect(() => {
        let startTimestamp: number | null = null
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp
            const progress = Math.min((timestamp - startTimestamp) / duration, 1)
            setDisplayValue(progress * value)
            if (progress < 1) {
                window.requestAnimationFrame(step)
            }
        }
        window.requestAnimationFrame(step)
    }, [value, duration])

    return <>{formatter(displayValue)}</>
}

function KpiInfoButton({ title, description }: { title: string; description: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full h-5 w-5 bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 hover:bg-primary/10 hover:text-primary transition-all duration-300 ml-1.5 shrink-0"
                    aria-label={`Información sobre ${title}`}
                >
                    <Info className="h-3 w-3" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-white/20 dark:border-white/10 shadow-2xl rounded-2xl" align="start">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
            </PopoverContent>
        </Popover>
    )
}

function MiniGlowSparkline({
    data,
    dataKey,
    color = 'hsl(var(--primary))',
    id,
}: {
    data: { periodo: string; value: number }[]
    dataKey: string
    color?: string
    id: string
}) {
    if (!data.length) return null
    return (
        <div className="h-12 w-full mt-4 -mb-2 overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#gradient-${id})`}
                        isAnimationActive={true}
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

interface DashboardKpiCardsProps {
    kpis: KPIsData
    evolution: EvolucionData[]
    vista: 'semana' | 'mes'
}

export function DashboardKpiCards({ kpis, evolution, vista }: DashboardKpiCardsProps) {
    const sparklineDataFact = useMemo(() => evolution.map((e) => ({
        periodo: e.periodo,
        value: e.facturacion,
    })), [evolution])

    const sparklineDataCount = useMemo(() => evolution.map((e) => ({
        periodo: e.periodo,
        value: e.num_facturas,
    })), [evolution])

    const sparklineDataTicket = useMemo(() => evolution.map((e) => ({
        periodo: e.periodo,
        value: e.num_facturas ? e.facturacion / e.num_facturas : 0,
    })), [evolution])

    const trendLabel = vista === 'semana' ? 'vs 7d ant.' : 'vs per. ant.'

    const items = [
        {
            id: 'facturacion',
            label: 'Facturación',
            description: 'Total facturado en el período seleccionado (sin borradores ni anuladas).',
            value: kpis.actual.facturacion_total,
            formatter: formatCurrency,
            trend: kpis.variaciones.facturacion,
            trendUp: kpis.variaciones.facturacion >= 0,
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            glow: 'from-emerald-500/20 to-transparent',
            sparkline: <MiniGlowSparkline data={sparklineDataFact} dataKey="value" color="#10b981" id="fact" />,
        },
        {
            id: 'facturas',
            label: 'Nº Facturas',
            description: 'Número total de facturas emitidas en el período.',
            value: kpis.actual.num_facturas,
            formatter: (v: number) => v.toFixed(0),
            trend: kpis.variaciones.facturas,
            trendUp: kpis.variaciones.facturas >= 0,
            icon: Receipt,
            color: 'text-primary',
            bg: 'bg-primary/10',
            glow: 'from-primary/20 to-transparent',
            sparkline: <MiniGlowSparkline data={sparklineDataCount} dataKey="value" color="hsl(var(--primary))" id="count" />,
        },
        {
            id: 'ticket',
            label: 'Ticket Medio',
            description: 'Importe medio por factura (Facturación ÷ Nº facturas).',
            value: kpis.actual.ticket_medio,
            formatter: formatCurrency,
            trend: kpis.variaciones.ticket_medio,
            trendUp: kpis.variaciones.ticket_medio >= 0,
            icon: Wallet,
            color: 'text-sky-500',
            bg: 'bg-sky-500/10',
            glow: 'from-sky-500/20 to-transparent',
            sparkline: <MiniGlowSparkline data={sparklineDataTicket} dataKey="value" color="#0ea5e9" id="ticket" />,
        },
        {
            id: 'cobro',
            label: 'Días Cobro',
            description: 'Media de días entre emisión y pago registrado.',
            value: kpis.actual.dias_cobro_promedio,
            formatter: (v: number) => `${v.toFixed(0)}d`,
            trend: kpis.variaciones.dias_cobro,
            trendUp: kpis.variaciones.dias_cobro <= 0,
            icon: CalendarClock,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            glow: 'from-amber-500/20 to-transparent',
            sparkline: null,
        },
    ]

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((kpi, idx) => (
                <Card
                    key={kpi.id}
                    className="group relative overflow-hidden border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-2xl hover:shadow-primary/5 transition-all duration-500 rounded-3xl animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${idx * 150}ms` }}
                >
                    {/* Aura Glow Effect */}
                    <div className={cn(
                        "absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-full",
                        kpi.glow
                    )} />

                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-start justify-between mb-6">
                            <div className={cn(
                                "p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner",
                                kpi.bg
                            )}>
                                <kpi.icon className={cn("h-6 w-6", kpi.color)} />
                            </div>
                            
                            <div className={cn(
                                "flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm transition-all duration-300",
                                kpi.trendUp 
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" 
                                    : "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400"
                            )}>
                                {kpi.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
                                {formatTrend(kpi.trend)}
                                <span className="opacity-50 font-medium">{trendLabel}</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">
                                {kpi.label}
                                <KpiInfoButton title={kpi.label} description={kpi.description} />
                            </div>
                            
                            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                <AnimateNumber value={kpi.value} formatter={kpi.formatter} />
                            </div>
                        </div>

                        {kpi.sparkline && (
                            <div className="group-hover:translate-x-1 transition-transform duration-700">
                                {kpi.sparkline}
                            </div>
                        )}
                        
                        {!kpi.sparkline && (
                            <div className="h-10 mt-6 flex items-center gap-2">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div 
                                        key={i} 
                                        className="w-1 bg-slate-200 dark:bg-slate-800 rounded-full transition-all duration-500 group-hover:bg-primary/20"
                                        style={{ 
                                            height: `${Math.random() * 60 + 20}%`,
                                            transitionDelay: `${i * 30}ms`
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
