import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { CheckCircle2 } from 'lucide-react'

interface ResumenFacturaPagoProps {
    factura: {
        serie: string | null
        numero: string
        cliente: { nombre_fiscal: string }
        fecha_emision: string
        total: number
        estado: string
    }
    pagadoHastaHoy: number
    importePagoActual: number
}

export function ResumenFacturaPago({ factura, pagadoHastaHoy, importePagoActual }: ResumenFacturaPagoProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)
    }

    const pendienteActual = Math.max(0, factura.total - pagadoHastaHoy)
    const pendienteFinal = Math.max(0, pendienteActual - importePagoActual)

    // Determine status badge color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pagada': return 'bg-green-100 text-green-700'
            case 'parcial': return 'bg-orange-100 text-orange-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm uppercase tracking-wider text-slate-500 font-bold">Resumen de la Factura</CardTitle>
                <Badge variant="secondary" className={`capitalize ${getStatusColor(factura.estado)} border-0`}>
                    {factura.estado}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase">Cliente</p>
                    <p className="font-medium text-slate-900 truncate">{factura.cliente.nombre_fiscal}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-semibold uppercase">Nº Factura</p>
                        <p className="font-medium text-slate-700">{factura.serie || ''}-{factura.numero}</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-xs text-slate-400 font-semibold uppercase">Emisión</p>
                        <p className="font-medium text-slate-700">{format(new Date(factura.fecha_emision), 'dd/MM/yyyy')}</p>
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Total Factura</span>
                        <span className="font-semibold">{formatCurrency(factura.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Pagado hasta hoy</span>
                        <span className="font-medium text-slate-700">{formatCurrency(pagadoHastaHoy)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Pendiente actual</span>
                        <span className="font-bold text-red-600">{formatCurrency(pendienteActual)}</span>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-xl p-4 text-white mt-4">
                    <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Después de este pago</p>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-xs text-slate-400">Importe pendiente</p>
                            <p className="text-2xl font-bold">{formatCurrency(pendienteFinal)}</p>
                        </div>
                        {pendienteFinal === 0 && (
                            <div className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-400/10 px-2 py-1 rounded">
                                <CheckCircle2 className="w-3 h-3" />
                                PAGADA
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
