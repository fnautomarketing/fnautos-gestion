import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Banknote, CreditCard, Building2, CheckCircle2 } from 'lucide-react'

import { PagoFactura } from '@/types/ventas'

interface HistorialPagosCardProps {
    pagos: PagoFactura[]
}

export function HistorialPagosCard({ pagos }: HistorialPagosCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)
    }

    const getIcon = (metodo: string) => {
        switch (metodo.toLowerCase()) {
            case 'transferencia': return <Building2 className="w-4 h-4" />
            case 'tarjeta': return <CreditCard className="w-4 h-4" />
            default: return <Banknote className="w-4 h-4" />
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-slate-500 font-bold">Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
                {pagos.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-sm">
                        No hay pagos registrados para esta factura.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pagos.map((pago, index) => (
                            <div key={pago.id} className="flex gap-3 items-start relative pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                <div className="mt-1 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                    {getIcon(pago.metodo_pago)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between">
                                        <p className="font-semibold text-slate-900">{formatCurrency(pago.importe)}</p>
                                        <span className="text-xs text-slate-500">{format(new Date(pago.fecha_pago), 'dd MMM yyyy', { locale: es })}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 capitalize flex items-center gap-1">
                                        {pago.metodo_pago}
                                        {index === 0 && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-bold">NUEVO</span>}
                                    </p>
                                    {pago.referencia && (
                                        <p className="text-[10px] text-slate-400">Ref: {pago.referencia}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
