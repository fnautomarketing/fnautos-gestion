'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getKPIsAction, type KPIsData } from '@/app/actions/informes'
import { TrendingUp, TrendingDown, DollarSign, FileText, ShoppingCart, Clock, Info } from 'lucide-react'
import { AnimateNumber } from '@/components/ui/animate-number'
import { cn } from '@/lib/utils'

function SectionInfoButton({ title, description }: { title: string; description: string }) {
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

interface InformesKPIsProps {
    fechaDesde?: string
    fechaHasta?: string
    empresaId?: string | null
    clienteId?: string | null
}

export function InformesKPIs({ fechaDesde, fechaHasta, empresaId, clienteId }: InformesKPIsProps) {
    const [data, setData] = useState<KPIsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState<string | null>(null)

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            setFetchError(null)
            try {
                const result = await getKPIsAction(fechaDesde, fechaHasta, empresaId, clienteId)
                if (result.success && result.data) {
                    setData(result.data)
                }
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                setFetchError(msg.includes('fetch') ? 'Error de conexión.' : msg)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [fechaDesde, fechaHasta, empresaId, clienteId])

    if (fetchError) {
        return (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 rounded-3xl p-6 text-center">
                <p className="text-amber-800 dark:text-amber-200 font-medium">{fetchError}</p>
            </Card>
        )
    }

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="h-32 border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl animate-pulse" />
                ))}
            </div>
        )
    }

    if (!data) return null

    const formatTrend = (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`

    const items = [
        {
            label: 'Facturación Total',
            description: "Suma total facturada en el período. Incluye facturas emitidas y pagadas.",
            value: data.actual.facturacion_total,
            formatter: (v: number) => `${v.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€`,
            trend: data.variaciones.facturacion,
            trendUp: data.variaciones.facturacion >= 0,
            icon: DollarSign,
            color: 'text-primary',
            bg: 'bg-primary/10',
            glow: 'from-primary/20 to-transparent'
        },
        {
            label: 'Facturas Emitidas',
            description: "Número total de facturas emitidas en el período.",
            value: data.actual.num_facturas,
            formatter: (v: number) => Math.round(v).toString(),
            trend: data.variaciones.facturas,
            trendUp: data.variaciones.facturas >= 0,
            icon: FileText,
            color: 'text-sky-500',
            bg: 'bg-sky-500/10',
            glow: 'from-sky-500/20 to-transparent'
        },
        {
            label: 'Ticket Medio',
            description: "Importe medio por factura (Facturación total ÷ Nº de facturas).",
            value: data.actual.ticket_medio,
            formatter: (v: number) => `${v.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€`,
            trend: data.variaciones.ticket_medio,
            trendUp: data.variaciones.ticket_medio >= 0,
            icon: ShoppingCart,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            glow: 'from-emerald-500/20 to-transparent'
        },
        {
            label: 'Días Cobro Promedio',
            description: "Número medio de días entre emisión y pago.",
            value: data.actual.dias_cobro_promedio,
            formatter: (v: number) => `${Math.round(v)} días`,
            trend: data.variaciones.dias_cobro,
            trendUp: data.variaciones.dias_cobro <= 0,
            icon: Clock,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            glow: 'from-amber-500/20 to-transparent'
        }
    ]

    return (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item, idx) => (
                <Card 
                    key={idx}
                    className="group relative overflow-hidden border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-2xl hover:shadow-primary/5 transition-all duration-500 rounded-3xl animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${idx * 100}ms` }}
                >
                    <div className={cn(
                        "absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-full",
                        item.glow
                    )} />

                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center">
                                    {item.label}
                                    <SectionInfoButton title={item.label} description={item.description} />
                                </p>
                                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                    <AnimateNumber value={item.value} formatter={item.formatter} />
                                </div>
                            </div>
                            <div className={cn(
                                "p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner",
                                item.bg
                            )}>
                                <item.icon className={cn("h-6 w-6", item.color)} />
                            </div>
                        </div>

                        <div className={cn(
                            "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm w-fit transition-all duration-300",
                            item.trendUp 
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" 
                                : "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400"
                        )}>
                            {item.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {formatTrend(Math.abs(item.trend))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
