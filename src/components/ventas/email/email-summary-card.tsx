import { FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import type { FacturaWithCliente } from '@/types/ventas'

interface EmailSummaryCardProps {
    factura: FacturaWithCliente
}

export function EmailSummaryCard({ factura }: EmailSummaryCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-slate-500 font-bold">Resumen del documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase">Cliente</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{factura.cliente?.nombre_fiscal || 'Sin cliente'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-semibold uppercase">Factura</p>
                        <p className="font-medium text-slate-700 dark:text-slate-200">{factura.serie}-{factura.numero}</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-xs text-slate-400 font-semibold uppercase">Fecha</p>
                        <p className="font-medium text-slate-700 dark:text-slate-200">{format(new Date(factura.fecha_emision), 'dd/MM/yyyy')}</p>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Importe Total</p>
                            <p className="text-3xl font-bold">{formatCurrency(factura.total)}</p>
                        </div>
                        <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-0">
                            Pendiente de envío
                        </Badge>
                    </div>
                    <FileText className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 rotate-12" />
                </div>
            </CardContent>
        </Card>
    )
}
