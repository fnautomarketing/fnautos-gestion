'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { anularFacturaAction } from '@/app/actions/ventas'

import { Factura } from '@/types/ventas'

interface AnularFacturaModalProps {
    factura: Factura & {
        cliente: { nombre_fiscal?: string | null } | null
    }
    open: boolean
    onOpenChange: (open: boolean) => void
}

const MOTIVOS_ANULACION = [
    { value: 'error_cliente', label: 'Error en los datos del cliente' },
    { value: 'error_importes', label: 'Error en importes o cantidades' },
    { value: 'duplicada', label: 'Duplicada por error' },
    { value: 'cancelacion_servicio', label: 'Cancelación del servicio' },
    { value: 'solicitud_cliente', label: 'Solicitud del cliente' },
    { value: 'otro', label: 'Otro motivo' },
]

export function AnularFacturaModal({ factura, open, onOpenChange }: AnularFacturaModalProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [motivo, setMotivo] = useState<string>('')
    const [descripcion, setDescripcion] = useState<string>('')
    const [notificarCliente, setNotificarCliente] = useState(false)
    const [generarAsiento, setGenerarAsiento] = useState(true)

    const handleAnular = async () => {
        if (!motivo) {
            toast.error('Debes seleccionar un motivo de anulación')
            return
        }

        setIsSubmitting(true)

        const formData = new FormData()
        formData.append('factura_id', factura.id)
        formData.append('motivo', motivo)
        formData.append('descripcion', descripcion)
        formData.append('notificar_cliente', notificarCliente.toString())
        formData.append('generar_asiento', generarAsiento.toString())

        const result = await anularFacturaAction(formData)

        setIsSubmitting(false)

        if (result.success) {
            toast.success('Factura anulada correctamente')
            onOpenChange(false)
            router.refresh()
        } else {
            toast.error(result.error || 'Error al anular factura')
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount)
    }

    const getEstadoBadge = (estado: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            emitida: {
                label: 'Emitida',
                className: 'bg-blue-100 text-blue-700',
            },
            pagada: {
                label: 'Pagada',
                className: 'bg-green-100 text-green-700',
            },
            borrador: {
                label: 'Borrador',
                className: 'bg-slate-100 text-slate-700',
            },
        }

        const variant = variants[estado] || variants.borrador
        return <Badge className={variant.className}>{variant.label}</Badge>
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-2xl font-serif">Anular Factura</DialogTitle>
                            <DialogDescription className="text-base mt-1">
                                {factura.serie || ''}-{factura.numero} · {factura.cliente?.nombre_fiscal || 'Sin Cliente'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Información de la factura */}
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500 text-xs uppercase mb-1">Número</p>
                                <p className="font-semibold">
                                    {factura.serie || ''}-{factura.numero}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase mb-1">Estado</p>
                                {getEstadoBadge(factura.estado)}
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase mb-1">Importe Total</p>
                                <p className="font-semibold">{formatCurrency(factura.total)}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase mb-1">Fecha Emisión</p>
                                <p className="font-semibold">
                                    {new Date(factura.fecha_emision).toLocaleDateString('es-ES')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Alert de advertencia */}
                    <Alert className="bg-yellow-50 border-l-4 border-yellow-500 dark:bg-yellow-900/20">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                            <strong>Atención:</strong> Esta acción es irreversible. Al anular la factura, esta
                            dejará de ser válida legalmente y no podrá ser editada nuevamente.
                        </AlertDescription>
                    </Alert>

                    {/* Formulario */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="motivo">
                                Motivo de anulación <span className="text-red-500">*</span>
                            </Label>
                            <Select value={motivo} onValueChange={setMotivo}>
                                <SelectTrigger id="motivo">
                                    <SelectValue placeholder="Seleccione un motivo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {MOTIVOS_ANULACION.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="descripcion">Descripción detallada (opcional)</Label>
                            <Textarea
                                id="descripcion"
                                placeholder="Explica el motivo detallado de la anulación..."
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="notificar"
                                    checked={notificarCliente}
                                    onCheckedChange={(checked) => setNotificarCliente(checked as boolean)}
                                />
                                <label
                                    htmlFor="notificar"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Notificar automáticamente al cliente por email
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="asiento"
                                    checked={generarAsiento}
                                    onCheckedChange={(checked) => setGenerarAsiento(checked as boolean)}
                                />
                                <label
                                    htmlFor="asiento"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Generar asiento contable correctivo (Reversión)
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer con botones */}
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleAnular}
                        disabled={!motivo || isSubmitting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isSubmitting ? 'Anulando...' : 'Anular Factura'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
