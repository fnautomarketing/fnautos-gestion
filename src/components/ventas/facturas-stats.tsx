'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TrendingUp, Clock, AlertTriangle, Calendar, Info } from 'lucide-react'

interface FacturasStatsProps {
    stats: {
        totalFacturado: number
        pendienteCobro: number
        vencidas: number
        esteMes: number
    }
}

function KpiInfoButton({ title, description }: { title: string; description: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full h-5 w-5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition-colors ml-1"
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

export function FacturasStats({ stats }: FacturasStatsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount)
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Facturado */}
            <Card className="border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 shadow-lg hover:translate-y-[-2px] transition-all duration-300">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center">
                                Total Facturado
                                <KpiInfoButton
                                    title="Total Facturado"
                                    description="Suma del importe total de todas las facturas emitidas y pagadas de tu empresa. Incluye facturas en estado emitida, pagada y vencida. No incluye borradores ni facturas anuladas."
                                />
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                                {formatCurrency(stats.totalFacturado)}
                            </p>
                        </div>
                        <div className="rounded-full bg-primary/10 p-2 dark:bg-primary/20">
                            <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pendiente de Cobro */}
            <Card className="border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 shadow-lg hover:translate-y-[-2px] transition-all duration-300">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center">
                                Pendiente de Cobro
                                <KpiInfoButton
                                    title="Pendiente de Cobro"
                                    description="Importe total de facturas emitidas que aún no han sido cobradas. Son facturas en estado 'emitida' cuya fecha de vencimiento puede estar por llegar o ya pasada. Cuando registres un pago, este importe disminuirá."
                                />
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                                {formatCurrency(stats.pendienteCobro)}
                            </p>
                        </div>
                        <div className="rounded-full bg-amber-500/10 p-2 dark:bg-amber-500/20">
                            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Vencidas */}
            <Card className="border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 shadow-lg hover:translate-y-[-2px] transition-all duration-300">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center">
                                Vencidas
                                <KpiInfoButton
                                    title="Facturas Vencidas"
                                    description="Importe total de facturas cuya fecha de vencimiento ya ha pasado y siguen sin cobrar. Son facturas en estado 'vencida'. Conviene priorizar el cobro de estas facturas para mejorar la liquidez."
                                />
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                                {formatCurrency(stats.vencidas)}
                            </p>
                        </div>
                        <div className="rounded-full bg-destructive/10 p-2 dark:bg-destructive/20">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Este Mes */}
            <Card className="border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 shadow-lg hover:translate-y-[-2px] transition-all duration-300">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center">
                                Este Mes
                                <KpiInfoButton
                                    title="Facturado Este Mes"
                                    description="Importe total facturado en el mes actual (emisión entre el día 1 y el último día del mes). Útil para ver la actividad de ventas del mes en curso y comparar con meses anteriores."
                                />
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                                {formatCurrency(stats.esteMes)}
                            </p>
                        </div>
                        <div className="rounded-full bg-emerald-500/10 p-2 dark:bg-emerald-500/20">
                            <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
