'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getKPIsAction, KPIsData } from '@/app/actions/informes'
import { TrendingUp, TrendingDown, DollarSign, FileText, ShoppingCart, Clock, Info } from 'lucide-react'

function SectionInfoButton({ title, description }: { title: string; description: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full h-5 w-5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition-colors ml-1 shrink-0"
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
                setFetchError(msg.includes('fetch') || msg.includes('Failed to fetch') ? 'Error de conexión. Comprueba tu conexión e intenta de nuevo.' : msg)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [fechaDesde, fechaHasta, empresaId, clienteId])

    if (fetchError) {
        return (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="py-6 px-4 text-center">
                    <p className="text-amber-800 dark:text-amber-200 font-medium">{fetchError}</p>
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-4 w-24 bg-slate-200 rounded"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-16 bg-slate-200 rounded mb-2"></div>
                            <div className="h-4 w-32 bg-slate-200 rounded"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (!data) return null

    const getVariacionColor = (valor: number, inverso = false) => {
        if (valor === 0) return 'text-slate-500'
        if (inverso) return valor < 0 ? 'text-green-500' : 'text-red-500'
        return valor > 0 ? 'text-green-500' : 'text-red-500'
    }

    const getVariacionIcon = (valor: number, inverso = false) => {
        if (valor === 0) return null
        if (inverso) return valor < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />
        return valor > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
    }

    return (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 min-w-0">
            {/* Facturación */}
            <Card className="min-w-0 overflow-hidden shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 sm:pt-6 px-4 sm:px-6 gap-2">
                    <CardTitle className="text-sm sm:text-base font-semibold flex items-center min-w-0 text-slate-900 dark:text-slate-100">
                        Facturación Total
                        <SectionInfoButton title="Facturación Total" description="Suma total facturada en el período seleccionado. Incluye facturas emitidas y pagadas; no incluye borradores ni anuladas. La variación % se compara con el período anterior de la misma duración." />
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent className="min-w-0 px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{data.actual.facturacion_total.toFixed(2)}€</div>
                    <div className={`text-xs sm:text-sm flex items-center gap-1 mt-1 ${getVariacionColor(data.variaciones.facturacion)}`}>
                        {getVariacionIcon(data.variaciones.facturacion)}
                        {Math.abs(data.variaciones.facturacion)}% vs periodo anterior
                    </div>
                </CardContent>
            </Card>

            {/* Número de Facturas */}
            <Card className="min-w-0 overflow-hidden shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 sm:pt-6 px-4 sm:px-6 gap-2">
                    <CardTitle className="text-sm sm:text-base font-semibold flex items-center min-w-0 text-slate-900 dark:text-slate-100">
                        Facturas Emitidas
                        <SectionInfoButton title="Facturas Emitidas" description="Número total de facturas emitidas en el período. Cada factura cuenta una vez, independientemente del importe. La variación se compara con el período anterior." />
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent className="min-w-0 px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{data.actual.num_facturas}</div>
                    <div className={`text-xs sm:text-sm flex items-center gap-1 mt-1 ${getVariacionColor(data.variaciones.facturas)}`}>
                        {getVariacionIcon(data.variaciones.facturas)}
                        {data.variaciones.facturas > 0 ? '+' : ''}{data.variaciones.facturas} vs anterior
                    </div>
                </CardContent>
            </Card>

            {/* Ticket Medio */}
            <Card className="min-w-0 overflow-hidden shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 sm:pt-6 px-4 sm:px-6 gap-2">
                    <CardTitle className="text-sm sm:text-base font-semibold flex items-center min-w-0 text-slate-900 dark:text-slate-100">
                        Ticket Medio
                        <SectionInfoButton title="Ticket Medio" description="Importe medio por factura en el período (Facturación total ÷ Nº de facturas). Útil para ver el tamaño medio de tus ventas. La variación % se compara con el período anterior." />
                    </CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent className="min-w-0 px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{data.actual.ticket_medio.toFixed(2)}€</div>
                    <div className={`text-xs sm:text-sm flex items-center gap-1 mt-1 ${getVariacionColor(data.variaciones.ticket_medio)}`}>
                        {getVariacionIcon(data.variaciones.ticket_medio)}
                        {Math.abs(data.variaciones.ticket_medio)}% vs anterior
                    </div>
                </CardContent>
            </Card>

            {/* Días Cobro Promedio */}
            <Card className="min-w-0 overflow-hidden shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 sm:pt-6 px-4 sm:px-6 gap-2">
                    <CardTitle className="text-sm sm:text-base font-semibold flex items-center min-w-0 text-slate-900 dark:text-slate-100">
                        Días Cobro Promedio
                        <SectionInfoButton title="Días Cobro Promedio" description="Número medio de días entre la fecha de emisión de la factura y la fecha en que se registró el pago. Un valor más bajo indica cobros más rápidos. La variación se compara con el período anterior." />
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent className="min-w-0 px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{Math.round(data.actual.dias_cobro_promedio)} días</div>
                    <div className={`text-xs sm:text-sm flex items-center gap-1 mt-1 ${getVariacionColor(data.variaciones.dias_cobro, true)}`}>
                        {getVariacionIcon(data.variaciones.dias_cobro, true)}
                        {data.variaciones.dias_cobro > 0 ? '+' : ''}{data.variaciones.dias_cobro} días vs anterior
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
