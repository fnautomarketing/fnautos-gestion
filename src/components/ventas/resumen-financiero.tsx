import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface ResumenFinancieroProps {
    factura: {
        subtotal: number
        descuento?: number | null
        descuento_valor?: number | null
        descuento_tipo?: string | null
        importe_descuento?: number | null
        recargo_equivalencia?: boolean | null
        recargo_porcentaje?: number | null
        importe_recargo?: number | null
        retencion_porcentaje?: number | null
        importe_retencion?: number | null
        base_imponible: number
        iva: number
        total: number
        estado?: string | null
    }
    totalPagado: number
    pendiente: number
    /** Total efectivo (base + IVA - retención + recargo) para coherencia con el desglose */
    totalEfectivo?: number
}

export function ResumenFinanciero({ factura, totalPagado, pendiente, totalEfectivo }: ResumenFinancieroProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount)
    }

    // Determine discount amount to show
    const descuentoTotal = factura.importe_descuento || factura.descuento || 0

    return (
        <Card className="shadow-lg shadow-slate-200/50 border-slate-200">
            <CardHeader className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                    <span className="text-slate-400">📊</span>
                    Resumen Financiero
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                    <span className="font-medium text-slate-900">{formatCurrency(factura.subtotal)}</span>
                </div>

                {descuentoTotal > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span className="text-slate-600 dark:text-slate-400">
                            Descuento Global {factura.descuento_tipo === 'porcentaje' ? `(${factura.descuento_valor}%)` : ''}
                        </span>
                        <span className="font-medium">-{formatCurrency(descuentoTotal)}</span>
                    </div>
                )}

                <div className="flex justify-between text-sm pt-2 border-t border-dashed">
                    <span className="font-medium text-slate-700">Base Imponible</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(factura.base_imponible)}</span>
                </div>

                <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">IVA (21%)</span>
                    <span className="font-medium text-slate-900">{formatCurrency(factura.iva)}</span>
                </div>

                {factura.recargo_equivalencia && (factura.importe_recargo || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Recargo Eq. ({factura.recargo_porcentaje}%)</span>
                        <span className="font-medium text-slate-900">{formatCurrency(factura.importe_recargo || 0)}</span>
                    </div>
                )}

                {(factura.retencion_porcentaje || 0) !== 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                        <span className="text-slate-600 dark:text-slate-400">Retención IRPF ({factura.retencion_porcentaje}%)</span>
                        <span className="font-medium">
                            {(factura.retencion_porcentaje || 0) < 0 ? '-' : '+'}{formatCurrency(Math.abs(factura.importe_retencion ?? (factura.base_imponible * Math.abs(factura.retencion_porcentaje || 0) / 100)))}
                        </span>
                    </div>
                )}

                <Separator className="my-2 bg-slate-100" />

                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg -mx-4 border-y border-slate-100">
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200">TOTAL</span>
                    <span className="text-2xl font-bold text-primary">
                        {formatCurrency(totalEfectivo ?? factura.total)}
                    </span>
                </div>

                <div className="pt-2 space-y-3">
                    <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-slate-600 dark:text-slate-400 font-medium">
                                {factura.estado === 'pagada' && pendiente <= 0 ? 'Pagada (totalidad)' : 'Pagado'}
                            </span>
                        </div>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(totalPagado)}
                        </span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${pendiente > 0 ? 'bg-red-500' : 'bg-slate-300'}`}></span>
                            <span className={`font-medium ${pendiente > 0 ? 'text-slate-700' : 'text-slate-500'}`}>
                                Pendiente
                            </span>
                        </div>
                        <span className={`font-semibold ${pendiente > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>
                            {formatCurrency(pendiente)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
