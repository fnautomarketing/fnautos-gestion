'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import {
    FileX, XCircle, Split, AlertTriangle, ExternalLink, Info, CheckCircle2
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    crearFacturaRectificativaAction,
    getFacturaParaRectificarAction
} from '@/app/actions/facturas-rectificativas'

import { FacturaCompleta } from '@/types/ventas'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    facturaId: string
}

export function ModalCrearRectificativa({ open, onOpenChange, facturaId }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [loadingFactura, setLoadingFactura] = useState(true)
    const [factura, setFactura] = useState<FacturaCompleta | null>(null)

    const [tipoRectificativa, setTipoRectificativa] = useState<'total' | 'parcial' | 'error'>('parcial')
    const [motivo, setMotivo] = useState('')
    const [lineasSeleccionadas, setLineasSeleccionadas] = useState<string[]>([])
    const [generarAbono, setGenerarAbono] = useState(false)

    useEffect(() => {
        const loadFactura = async () => {
            setLoadingFactura(true)
            const result = await getFacturaParaRectificarAction(facturaId)

            if (result.success && result.data) {
                // Forzamos el tipo FacturaCompleta ya que cumple con lo mínimo necesario para el modal
                setFactura(result.data as unknown as FacturaCompleta)
                // Pre-seleccionar todas las líneas por defecto
                setLineasSeleccionadas(result.data.lineas.map((l: { id: string }) => l.id))
            } else {
                toast.error(result.error || 'Error al cargar la factura')
                onOpenChange(false)
            }

            setLoadingFactura(false)
        }

        if (open && facturaId) {
            loadFactura()
        }
    }, [open, facturaId, onOpenChange])

    const handleToggleLinea = (lineaId: string) => {
        setLineasSeleccionadas(prev =>
            prev.includes(lineaId)
                ? prev.filter(id => id !== lineaId)
                : [...prev, lineaId]
        )
    }

    const calcularImporteRectificar = () => {
        if (!factura) return 0

        if (tipoRectificativa === 'total' || tipoRectificativa === 'error') {
            return factura.total
        }

        return factura.lineas
            .filter((l) => lineasSeleccionadas.includes(l.id))
            .reduce((sum: number, l) => {
                const subtotal = Number(l.subtotal) || 0
                const ivaAmount = subtotal * (Number(l.iva_porcentaje) || 0) / 100
                return sum + subtotal + ivaAmount
            }, 0)
    }

    const calcularPorcentaje = () => {
        if (!factura) return 0
        const importe = calcularImporteRectificar()
        return ((importe / factura.total) * 100).toFixed(1)
    }

    const handleSubmit = async () => {
        if (!motivo || motivo.trim().length < 20) {
            toast.error('El motivo debe tener al menos 20 caracteres')
            return
        }

        if (tipoRectificativa === 'parcial' && lineasSeleccionadas.length === 0) {
            toast.error('Debe seleccionar al menos una línea')
            return
        }

        setLoading(true)

        const result = await crearFacturaRectificativaAction({
            factura_original_id: facturaId,
            tipo_rectificativa: tipoRectificativa,
            motivo: motivo.trim(),
            lineas_a_rectificar: tipoRectificativa === 'parcial' ? lineasSeleccionadas : undefined,
            generar_abono: generarAbono,
        })

        setLoading(false)

        if (result.success && result.data) {
            toast.success('Factura rectificativa creada correctamente')
            onOpenChange(false)
            router.push(`/ventas/facturas/${result.data.id}`)
            router.refresh()
        } else {
            toast.error(result.error || 'Error al crear rectificativa')
        }
    }

    if (loadingFactura) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl">
                    <DialogTitle className="sr-only">Cargando factura...</DialogTitle>
                    <div className="flex items-center justify-center py-12">
                        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (!factura) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                            <FileX className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="flex items-center gap-2 text-2xl">
                                Crear Factura Rectificativa
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                            aria-label="¿Qué es una factura rectificativa?"
                                        >
                                            <Info className="h-3.5 w-3.5" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-4" align="start">
                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">¿Qué es una factura rectificativa?</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                            Es un documento fiscal que anula o corrige una factura ya emitida. Se usa para devoluciones, errores o cambios que no pueden hacerse en la factura original.
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            La rectificativa tendrá importe negativo y se vinculará automáticamente a la factura original.
                                        </p>
                                    </PopoverContent>
                                </Popover>
                            </DialogTitle>
                            <DialogDescription className="flex items-center gap-2">
                                Factura original:
                                <a
                                    href={`/ventas/facturas/${facturaId}`}
                                    target="_blank"
                                    className="text-primary hover:underline flex items-center gap-1"
                                >
                                    {factura.serie}-{factura.numero}
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Información de la factura original */}
                    <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                                <div className="text-slate-500 text-xs uppercase mb-1">Cliente</div>
                                <div className="font-medium">{factura.cliente?.nombre_fiscal}</div>
                            </div>
                            <div>
                                <div className="text-slate-500 text-xs uppercase mb-1">Fecha</div>
                                <div className="font-medium">
                                    {new Date(factura.fecha_emision).toLocaleDateString('es-ES')}
                                </div>
                            </div>
                            <div>
                                <div className="text-slate-500 text-xs uppercase mb-1">Total</div>
                                <div className="font-medium text-lg">{factura.total.toFixed(2)}€</div>
                            </div>
                            <div>
                                <div className="text-slate-500 text-xs uppercase mb-1">Estado</div>
                                <Badge variant={factura.estado === 'pagada' ? 'default' : 'secondary'}>
                                    {factura.estado}
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    {/* Tipo de Rectificación */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Label className="text-base font-semibold">Tipo de Rectificación</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                        aria-label="¿Qué tipo de rectificación elegir?"
                                    >
                                        <Info className="h-3 w-3" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72 p-3" align="start">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        <strong>Devolución total:</strong> Anula la factura completa. La factura original pasará a estado "Anulada".<br /><br />
                                        <strong>Devolución parcial:</strong> Rectifica solo algunas líneas. La factura original quedará "Rectificada parcialmente".<br /><br />
                                        <strong>Error en datos:</strong> Corrige datos fiscales (CIF, nombre, etc.) sin cambiar importes. La factura original pasará a "Anulada".
                                    </p>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <RadioGroup value={tipoRectificativa} onValueChange={(value: any) => setTipoRectificativa(value)}>
                            <div className="grid grid-cols-3 gap-4">
                                {/* Total */}
                                <label
                                    className={`
                    relative cursor-pointer rounded-lg border-2 p-4 hover:bg-slate-50 dark:hover:bg-slate-900
                    ${tipoRectificativa === 'total'
                                            ? 'border-red-500 bg-red-50 dark:bg-red-950'
                                            : 'border-slate-200 dark:border-slate-700'
                                        }
                  `}
                                >
                                    <RadioGroupItem value="total" className="sr-only" />
                                    {tipoRectificativa === 'total' && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center text-center space-y-2">
                                        <XCircle className="h-8 w-8 text-red-600" />
                                        <div className="font-semibold">Devolución Total</div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                            Anula la factura completa
                                        </div>
                                    </div>
                                </label>

                                {/* Parcial */}
                                <label
                                    className={`
                    relative cursor-pointer rounded-lg border-2 p-4 hover:bg-slate-50 dark:hover:bg-slate-900
                    ${tipoRectificativa === 'parcial'
                                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                                            : 'border-slate-200 dark:border-slate-700'
                                        }
                  `}
                                >
                                    <RadioGroupItem value="parcial" className="sr-only" />
                                    {tipoRectificativa === 'parcial' && (
                                        <div className="absolute top-2 right-2 bg-yellow-500 text-white rounded-full p-1">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center text-center space-y-2">
                                        <Split className="h-8 w-8 text-yellow-600" />
                                        <div className="font-semibold">Devolución Parcial</div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                            Devuelve parte del importe
                                        </div>
                                    </div>
                                </label>

                                {/* Error */}
                                <label
                                    className={`
                    relative cursor-pointer rounded-lg border-2 p-4 hover:bg-slate-50 dark:hover:bg-slate-900
                    ${tipoRectificativa === 'error'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                            : 'border-slate-200 dark:border-slate-700'
                                        }
                  `}
                                >
                                    <RadioGroupItem value="error" className="sr-only" />
                                    {tipoRectificativa === 'error' && (
                                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center text-center space-y-2">
                                        <AlertTriangle className="h-8 w-8 text-blue-600" />
                                        <div className="font-semibold">Error en Datos</div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                            Corrige información fiscal
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Conceptos a rectificar (solo si es parcial) */}
                    {tipoRectificativa === 'parcial' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Conceptos a rectificar</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        if (lineasSeleccionadas.length === factura.lineas.length) {
                                            setLineasSeleccionadas([])
                                        } else {
                                            setLineasSeleccionadas(factura.lineas.map((l) => l.id))
                                        }
                                    }}
                                >
                                    {lineasSeleccionadas.length === factura.lineas.length ? 'Deseleccionar' : 'Seleccionar'} todos
                                </Button>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                                {factura.lineas.map((linea) => (
                                    <label
                                        key={linea.id}
                                        className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                      hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors
                      ${lineasSeleccionadas.includes(linea.id)
                                                ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                                                : 'border-slate-200 dark:border-slate-700'
                                            }
                    `}
                                    >
                                        <Checkbox
                                            checked={lineasSeleccionadas.includes(linea.id)}
                                            onCheckedChange={() => handleToggleLinea(linea.id)}
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">{linea.descripcion || linea.concepto || 'Sin descripción'}</div>
                                            <div className="text-sm text-slate-500">
                                                Cantidad: {linea.cantidad} × {linea.precio_unitario.toFixed(2)}€
                                            </div>
                                        </div>
                                        <div className="text-right font-semibold">
                                            {((Number(linea.subtotal) || 0) + ((Number(linea.subtotal) || 0) * (Number(linea.iva_porcentaje) || 0) / 100)).toFixed(2)}€
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                            Importe a rectificar:
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            ({calcularPorcentaje()}% del total)
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-red-600">
                                        {calcularImporteRectificar().toFixed(2)}€
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Motivo */}
                    <div className="space-y-2">
                        <Label htmlFor="motivo" className="text-base font-semibold">
                            Motivo de la Rectificación *
                        </Label>
                        <Textarea
                            id="motivo"
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Ej: Devolución de mercancía defectuosa, error en cantidad facturada, cliente no conforme con el servicio..."
                            rows={4}
                            className="resize-none"
                        />
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">
                                Este motivo aparecerá en la factura rectificativa
                            </span>
                            <span className={motivo.length < 20 ? 'text-red-500' : 'text-green-600'}>
                                {motivo.length}/20 mínimo
                            </span>
                        </div>
                    </div>

                    {/* Configuración adicional */}
                    <Card className="p-4 bg-slate-50 dark:bg-slate-900">
                        <div className="space-y-3">
                            <div className="font-semibold text-sm">Configuración adicional</div>

                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <Label htmlFor="generar-abono" className="font-normal">
                                        Generar abono automático
                                    </Label>
                                    <p className="text-xs text-slate-500">
                                        {factura.estado === 'pagada'
                                            ? 'Se creará un registro de devolución en los pagos'
                                            : 'Solo disponible si la factura está pagada'
                                        }
                                    </p>
                                </div>
                                <Switch
                                    id="generar-abono"
                                    checked={generarAbono}
                                    onCheckedChange={setGenerarAbono}
                                    disabled={factura.estado !== 'pagada'}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Preview/Resumen */}
                    <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1 text-sm">
                                <div className="font-semibold mb-1">Se generará:</div>
                                <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                                    <li>• Factura Rectificativa con serie RECT</li>
                                    <li>• Importe: -{calcularImporteRectificar().toFixed(2)}€ (negativo)</li>
                                    <li>
                                        • Estado de {factura.serie}-{factura.numero}:{' '}
                                        {tipoRectificativa === 'total' || tipoRectificativa === 'error'
                                            ? '"Anulada"'
                                            : '"Rectificada parcialmente"'
                                        }
                                    </li>
                                    {generarAbono && factura.estado === 'pagada' && (
                                        <li>• Registro de abono/devolución en pagos</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={loading || motivo.length < 20}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creando...
                            </>
                        ) : (
                            <>
                                <FileX className="h-4 w-4 mr-2" />
                                Generar Factura Rectificativa
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
