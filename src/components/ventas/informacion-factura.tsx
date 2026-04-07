import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatFacturaDisplayNumero } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface InformacionFacturaProps {
    factura: {
        serie?: string | null
        numero: string
        fecha_emision: string
        estado: string
        forma_pago?: string | null
        cliente?: { forma_pago_predeterminada?: string | null }
    }
}

const InfoRow = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0 first:pt-0">
        <dt className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            {label}
        </dt>
        <dd className="text-slate-900 dark:text-slate-100 font-medium text-sm text-right break-words">
            {children}
        </dd>
    </div>
)

export function InformacionFactura({ factura }: InformacionFacturaProps) {
    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), 'dd MMM, yyyy', { locale: es })
    }

    const getEstadoBadge = (estado: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            pagada: {
                label: 'Pagada',
                className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
            },
            parcial: {
                label: 'Parcial',
                className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
            },
            emitida: {
                label: 'Emitida',
                className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
            },
            borrador: {
                label: 'Borrador',
                className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            },
        }

        const variant = variants[estado] || variants.borrador
        return <Badge className={variant.className}>{variant.label}</Badge>
    }

    const rawFormaPago = factura.forma_pago
        || factura.cliente?.forma_pago_predeterminada
        || 'transferencia'
    const rawFormaPagoStr = typeof rawFormaPago === 'string' ? rawFormaPago : 'transferencia'
    const formaPago = rawFormaPagoStr
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    const formaPagoDisplay = formaPago

    return (
        <Card className="shadow-sm border-slate-200 dark:border-slate-700">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 pb-3">
                <CardTitle className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-base font-semibold">
                    <span className="text-slate-400 shrink-0">📄</span>
                    Información de la Factura
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-4 px-5">
                <dl className="space-y-0">
                    <InfoRow label="Número de factura">
                        <span className="font-mono font-semibold">{formatFacturaDisplayNumero(factura.serie, factura.numero)}</span>
                    </InfoRow>
                    <InfoRow label="Emisión">{formatDate(factura.fecha_emision)}</InfoRow>
                    <InfoRow label="Forma de pago">{formaPagoDisplay}</InfoRow>
                    <InfoRow label="Estado">{getEstadoBadge(factura.estado)}</InfoRow>
                </dl>
            </CardContent>
        </Card>
    )
}
