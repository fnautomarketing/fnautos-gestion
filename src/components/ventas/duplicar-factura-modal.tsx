'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Copy, Info } from 'lucide-react'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { duplicarFacturaAction } from '@/app/actions/ventas'

import { Factura, LineaFactura } from '@/types/ventas'

interface DuplicarFacturaModalProps {
    factura: Factura & {
        cliente: { nombre_fiscal?: string | null } | null
        lineas?: LineaFactura[]
    }
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DuplicarFacturaModal({ factura, open, onOpenChange }: DuplicarFacturaModalProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Opciones
    const [mantenerCliente, setMantenerCliente] = useState(true)
    const [copiarLineas, setCopiarLineas] = useState(true)
    const [copiarNotas, setCopiarNotas] = useState(false)

    // Fechas
    const [tipoFechaEmision, setTipoFechaEmision] = useState<'hoy' | 'personalizada'>('hoy')
    const [fechaEmisionPersonalizada, setFechaEmisionPersonalizada] = useState<Date>(new Date())

    // Serie
    const [serieSeleccionada, setSerieSeleccionada] = useState(factura.serie || '')

    const getFechaEmision = () => {
        return tipoFechaEmision === 'hoy' ? new Date() : fechaEmisionPersonalizada
    }

    const handleDuplicar = async () => {
        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('factura_id_original', factura.id)
            formData.append('mantener_cliente', mantenerCliente.toString())
            formData.append('copiar_lineas', copiarLineas.toString())
            formData.append('copiar_notas', copiarNotas.toString())
            formData.append('fecha_emision', format(getFechaEmision(), 'yyyy-MM-dd'))
            formData.append('serie', serieSeleccionada)

            const result = await duplicarFacturaAction(formData)

            if (result.success && result.data?.id) {
                toast.success('Factura duplicada correctamente')
                onOpenChange(false)
                router.push(`/ventas/facturas/${result.data.id}/editar`)
            } else {
                toast.error(result.error || 'Error al duplicar factura')
            }
        } catch (error: unknown) {
            console.error('[handleDuplicar]', error)
            const message = error instanceof Error ? error.message : 'Error al duplicar factura'
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px]">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                            <Copy className="h-6 w-6 text-primary dark:text-primary" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-2xl font-serif">Duplicar Factura</DialogTitle>
                            <DialogDescription className="text-base mt-1">
                                Crear nueva factura basada en {factura.serie || ''}-{factura.numero}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Información de la factura original */}
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
                        <p className="text-xs uppercase text-slate-500 mb-3">Factura Original</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500 text-xs mb-1">Número</p>
                                <p className="font-semibold">
                                    {factura.serie || ''}-{factura.numero}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs mb-1">Cliente</p>
                                <p className="font-semibold">{factura.cliente?.nombre_fiscal || 'Sin Cliente'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs mb-1">Fecha Original</p>
                                <p className="font-semibold">
                                    {format(new Date(factura.fecha_emision), 'dd MMM yyyy', { locale: es })}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs mb-1">Importe Total</p>
                                <p className="font-semibold text-primary">{formatCurrency(factura.total)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Banner informativo */}
                    <Alert className="bg-blue-50 border-l-4 border-blue-500 dark:bg-blue-900/20">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                            La nueva factura se creará automáticamente en estado de{' '}
                            <strong>Borrador</strong> para que puedas revisarla antes de emitirla.
                        </AlertDescription>
                    </Alert>

                    {/* Opciones de duplicación */}
                    <div className="space-y-4">
                        <p className="text-sm font-medium uppercase text-slate-500">Opciones de Duplicación</p>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="mantener-cliente" className="text-base">
                                Mantener el mismo cliente
                            </Label>
                            <Switch
                                id="mantener-cliente"
                                checked={mantenerCliente}
                                onCheckedChange={setMantenerCliente}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="copiar-lineas" className="text-base">
                                Copiar todas las líneas de la factura
                            </Label>
                            <Switch
                                id="copiar-lineas"
                                checked={copiarLineas}
                                onCheckedChange={setCopiarLineas}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="copiar-notas" className="text-base">
                                Copiar notas internas
                            </Label>
                            <Switch
                                id="copiar-notas"
                                checked={copiarNotas}
                                onCheckedChange={setCopiarNotas}
                            />
                        </div>
                    </div>

                    {/* Fechas */}
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <Label className="text-sm font-medium uppercase text-slate-500">
                                Fecha de Emisión
                            </Label>
                            <RadioGroup value={tipoFechaEmision} onValueChange={(v: 'hoy' | 'personalizada') => setTipoFechaEmision(v)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="hoy" id="fecha-hoy" />
                                    <Label htmlFor="fecha-hoy" className="font-normal cursor-pointer">
                                        Hoy ({format(new Date(), 'dd MMM yyyy', { locale: es })})
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="personalizada" id="fecha-personalizada" />
                                    <Label htmlFor="fecha-personalizada" className="font-normal cursor-pointer">
                                        Personalizada
                                    </Label>
                                </div>
                            </RadioGroup>

                            {tipoFechaEmision === 'personalizada' && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left">
                                            {format(fechaEmisionPersonalizada, 'dd/MM/yyyy', { locale: es })}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={fechaEmisionPersonalizada}
                                            onSelect={(date) => date && setFechaEmisionPersonalizada(date)}
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </div>

                    {/* Serie de facturación */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium uppercase text-slate-500">
                            Serie de Facturación
                        </Label>
                        <Select value={serieSeleccionada} onValueChange={setSerieSeleccionada}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FAC-2024">Serie General (FAC)</SelectItem>
                                <SelectItem value="RECT-2024">Rectificativa (RECT)</SelectItem>
                                <SelectItem value="EXP-2024">Exportación (EXP)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">El número se generará automáticamente</p>
                    </div>

                    {/* Vista previa */}
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                        <p className="text-xs uppercase text-green-700 dark:text-green-400 mb-2 font-semibold">
                            Vista Previa
                        </p>
                        <div className="space-y-1 text-sm">
                            <p>
                                <span className="text-slate-500">Nueva factura:</span>{' '}
                                <strong>{serieSeleccionada}-XXX</strong> (en borrador)
                            </p>
                            {mantenerCliente && (
                                <p>
                                    <span className="text-slate-500">Cliente:</span>{' '}
                                    <strong>{factura.cliente?.nombre_fiscal || 'Sin Cliente'}</strong>
                                </p>
                            )}
                            <p>
                                <span className="text-slate-500">Fecha emisión:</span>{' '}
                                <strong>{format(getFechaEmision(), 'dd MMM yyyy', { locale: es })}</strong>
                            </p>
                            {copiarLineas && (
                                <p>
                                    <span className="text-slate-500">Líneas:</span>{' '}
                                    <strong>{factura.lineas?.length || 0} copiadas</strong>
                                </p>
                            )}
                            <p>
                                <span className="text-slate-500">Total estimado:</span>{' '}
                                <strong className="text-green-600">{formatCurrency(factura.total)}</strong>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer con botones */}
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button onClick={handleDuplicar} disabled={isSubmitting}>
                        {isSubmitting ? 'Duplicando...' : 'Duplicar y Editar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
