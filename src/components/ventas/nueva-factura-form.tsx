'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, Percent, Building2, FileText, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

import { guardarBorradorAction, crearFacturaAction, obtenerProximoNumeroPreviewAction } from '@/app/actions/ventas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PlantillaSelector } from '@/components/plantilla-selector'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SimpleCombobox } from '@/components/ui/simple-combobox'
import { Cliente, Serie } from '@/types/ventas'
import { Empresa } from '@/types/empresa'

interface LineaForm {
    concepto: string
    cantidad: number
    precio_unitario: number
    iva_porcentaje: number
    descuento_porcentaje: number
    subtotal: number
}

interface NuevaFacturaFormProps {
    clientes: Cliente[]
    clientesByEmpresa?: Record<string, Cliente[]>
    series: Serie[]
    empresaId: string
    empresaConfig: Partial<Empresa>
    empresasConfigs?: Record<string, { retencion_predeterminada?: number | null }>
    defaultEmpresaId?: string
    empresas?: Array<{ id: string; nombre: string }>
}

// Template IDs
const EMPRESA_VISION_GLOBAL_ID = 'ALL'

const EMPRESA_EDISON_ID = 'af15f25a-7ade-4de8-9241-a42e1b8407da'

export function NuevaFacturaForm({ clientes, clientesByEmpresa = {}, series, empresaId, empresaConfig, empresasConfigs = {}, defaultEmpresaId, empresas = [] }: NuevaFacturaFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [lineas, setLineas] = useState<LineaForm[]>([
        { concepto: '', cantidad: 1, precio_unitario: 0, iva_porcentaje: 21, descuento_porcentaje: 0, subtotal: 0 }
    ])

    // Multi-company state (RFC-025). Si empresaId es 'ALL', usar primera empresa disponible
    const [selectedEmpresaId, setSelectedEmpresaId] = useState(
        empresaId === EMPRESA_VISION_GLOBAL_ID ? (defaultEmpresaId || empresas[0]?.id || '') : empresaId
    )
    const [selectedPlantillaId, setSelectedPlantillaId] = useState('')
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)

    // Form state
    const [serieId, setSerieId] = useState('')
    const [proximoNumeroPreview, setProximoNumeroPreview] = useState<string | null>(null)
    const [retencionPorcentaje, setRetencionPorcentaje] = useState(0)
    const [clienteId, setClienteId] = useState('')
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0])
    const [notas, setNotas] = useState('')
    const [descuentoTipo, setDescuentoTipo] = useState<'porcentaje' | 'fijo'>('porcentaje')
    const [descuentoValor, setDescuentoValor] = useState(0)
    const [esExterna, setEsExterna] = useState(false)
    const [archivo, setArchivo] = useState<File | null>(null)
    const supabase = createClient()

    // Divisa (RFC-029)
    const [divisa, setDivisa] = useState('EUR')
    const [tipoCambio, setTipoCambio] = useState(1.0)

    const getSimboloDivisa = (cod: string) => {
        switch (cod) {
            case 'USD': return '$'
            case 'GBP': return '£'
            default: return '€'
        }
    }

    // Totales
    const [totales, setTotales] = useState({
        subtotal: 0,
        base_imponible: 0,
        iva: 0,
        total: 0,
        importe_descuento: 0
    })

    const seriesParaMostrar = empresaId === EMPRESA_VISION_GLOBAL_ID
        ? series.filter((s: Serie) => s.empresa_id === selectedEmpresaId)
        : series

    const clientesParaMostrar = (empresaId === EMPRESA_VISION_GLOBAL_ID && clientesByEmpresa[selectedEmpresaId])
        ? clientesByEmpresa[selectedEmpresaId]
        : clientes

    // Preview del próximo número al cambiar serie
    useEffect(() => {
        if (!serieId) {
            setProximoNumeroPreview(null)
            return
        }
        let cancelled = false
        obtenerProximoNumeroPreviewAction(serieId).then((num) => {
            if (!cancelled) setProximoNumeroPreview(num)
        })
        return () => { cancelled = true }
    }, [serieId])

    useEffect(() => {
        if (seriesParaMostrar.length > 0 && !serieId) {
            const empresaSerieId = empresaConfig?.serie_predeterminada_id
            const fromEmpresa = empresaSerieId && seriesParaMostrar.some((s: Serie) => s.id === empresaSerieId) ? empresaSerieId : null
            const fromPredeterminada = seriesParaMostrar.find((s: Serie) => s.predeterminada)?.id
            setSerieId(fromEmpresa || fromPredeterminada || seriesParaMostrar[0].id)
        }
    }, [seriesParaMostrar, serieId, empresaConfig, esExterna])

    // Effect: al cambiar empresa, resetear plantilla; PlantillaSelector asignará la predeterminada
    useEffect(() => {
        setSelectedPlantillaId('')
    }, [selectedEmpresaId])

    // Effect: retención por defecto según empresa (Edison: 1% IRPF por defecto)
    useEffect(() => {
        const config = empresasConfigs[selectedEmpresaId]
        const fromConfig = config?.retencion_predeterminada ?? empresaConfig?.retencion_predeterminada
        const defaultRetencion = fromConfig ?? (selectedEmpresaId === EMPRESA_EDISON_ID ? -1 : 0)
        setRetencionPorcentaje(Number(defaultRetencion) || 0)
    }, [selectedEmpresaId, empresasConfigs, empresaConfig])

    useEffect(() => {
        const subtotal = lineas.reduce((acc, linea) => acc + (linea.cantidad * linea.precio_unitario), 0)
        let importe_descuento = 0

        if (descuentoTipo === 'porcentaje') {
            importe_descuento = subtotal * (descuentoValor / 100)
        } else {
            importe_descuento = descuentoValor
        }

        const base_imponible = subtotal - importe_descuento
        const iva = lineas.reduce((acc, l) => acc + (l.cantidad * l.precio_unitario * (l.iva_porcentaje || 21) / 100), 0)
        // efectoRetencion: negativo cuando el porcentaje es negativo (resta), positivo cuando suma
        const efectoRetencion = base_imponible * (retencionPorcentaje / 100)
        const total = base_imponible + iva + efectoRetencion

        setTotales({
            subtotal,
            base_imponible,
            iva,
            total,
            importe_descuento
        })
    }, [lineas, descuentoTipo, descuentoValor, retencionPorcentaje])

    const addLinea = () => {
        setLineas([...lineas, { concepto: '', cantidad: 1, precio_unitario: 0, iva_porcentaje: 21, descuento_porcentaje: 0, subtotal: 0 }])
    }

    const removeLinea = (index: number) => {
        if (lineas.length > 1) {
            setLineas(lineas.filter((_, i) => i !== index))
        }
    }

    const updateLinea = (index: number, field: keyof LineaForm, value: string | number) => {
        const newLineas = [...lineas]
        const linea = newLineas[index]
        if (field === 'concepto') {
            linea[field] = value as string
        } else {
            linea[field] = value as number
        }
        setLineas(newLineas)
    }

    const buildFormData = () => {
        const lineasForSchema = lineas.map(l => ({
            concepto: l.concepto,
            descripcion: '',
            cantidad: l.cantidad,
            precio_unitario: l.precio_unitario,
            descuento_porcentaje: l.descuento_porcentaje || 0,
            iva_porcentaje: l.iva_porcentaje || 21,
        }))
        const fd = new FormData()
        fd.set('empresa_id', selectedEmpresaId)
        fd.set('serie', serieId)
        fd.set('cliente_id', clienteId)
        fd.set('fecha_emision', fechaEmision)
        fd.set('plantilla_pdf_id', selectedPlantillaId || '')
        fd.set('forma_pago', '')
        fd.set('descuento_tipo', descuentoTipo)
        fd.set('descuento_valor', String(descuentoValor))
        fd.set('recargo_equivalencia', 'false')
        fd.set('recargo_porcentaje', '5.2')
        fd.set('retencion_porcentaje', String(retencionPorcentaje))
        fd.set('importe_descuento', String(totales.importe_descuento || 0))
        fd.set('importe_retencion', String((totales.base_imponible * Math.abs(retencionPorcentaje)) / 100))
        fd.set('subtotal', String(totales.subtotal))
        fd.set('base_imponible', String(totales.base_imponible))
        fd.set('iva', String(totales.iva))
        fd.set('total', String(totales.total))
        fd.set('lineas', JSON.stringify(lineasForSchema))
        fd.set('notas', notas)
        fd.set('divisa', divisa)
        fd.set('divisa', divisa)
        fd.set('tipo_cambio', String(tipoCambio))
        fd.set('es_externa', String(esExterna))
        return fd
    }

    const uploadFile = async (): Promise<string | null> => {
        if (!archivo) return null
        try {
            const fileExt = archivo.name.split('.').pop()
            const fileName = `${empresaId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('facturas-externas')
                .upload(fileName, archivo)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('facturas-externas')
                .getPublicUrl(fileName)

            return publicUrl
        } catch (error: unknown) {
            console.error('Error uploading file:', error)
            const message = error instanceof Error ? error.message : 'Error desconocido'
            toast.error(`Error al subir el archivo: ${message}`)
            return null
        } finally {
            // No cleanup needed
        }
    }

    const validateAndShowConfirm = () => {
        if (!serieId || series.length === 0) {
            toast.error('Selecciona una serie de facturación validada')
            return
        }
        if (esExterna && !archivo) {
            toast.error('Debes subir el PDF de la factura externa para emitirla')
            return
        }
        if (!clienteId) {
            toast.error('Por favor, selecciona un cliente')
            return
        }
        if (lineas.some(l => !l.concepto || l.precio_unitario <= 0)) {
            toast.error('Completa todos los conceptos y precios')
            return
        }
        setShowConfirmDialog(true)
    }

    const handleGuardarBorrador = async () => {
        // Borrador no requiere serie obligatoria, pero si hay, mejor.
        // if (!esExterna && (!serieId || series.length === 0)) ...
        // External draft allows no PDF.
        if (!clienteId) {
            toast.error('Por favor, selecciona un cliente')
            return
        }
        if (lineas.some(l => !l.concepto || l.precio_unitario <= 0)) {
            toast.error('Completa todos los conceptos y precios')
            return
        }
        setIsSubmitting(true)
        try {
            let archivoUrl = null
            if (esExterna && archivo) {
                archivoUrl = await uploadFile()
                if (!archivoUrl) {
                    setIsSubmitting(false)
                    return
                }
            }
            const fd = buildFormData()
            if (archivoUrl) fd.set('archivo_url', archivoUrl)

            const result = await guardarBorradorAction(fd)
            if (result.success) {
                toast.success('Borrador guardado correctamente')
                router.push('/ventas/facturas')
                router.refresh()
            } else {
                toast.error(result.error || 'Error al guardar borrador')
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al guardar borrador'
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEmitir = async () => {
        setIsSubmitting(true)
        try {
            let archivoUrl = null
            if (esExterna && archivo) {
                archivoUrl = await uploadFile()
                if (!archivoUrl) {
                    setIsSubmitting(false)
                    return
                }
            }
            const fd = buildFormData()
            if (archivoUrl) fd.set('archivo_url', archivoUrl)

            const result = await crearFacturaAction(fd)
            if (result.success) {
                setShowConfirmDialog(false)
                const numeroCompleto = result.data?.numero
                const facturaId = result.data?.id
                toast.success(numeroCompleto ? `Factura emitida: ${numeroCompleto}` : 'Factura emitida correctamente', { duration: 5000 })
                // Redirigir al detalle para ver el número de factura de forma prominente
                if (facturaId) {
                    router.replace(`/ventas/facturas/${facturaId}`)
                } else {
                    router.replace('/ventas/facturas')
                }
            } else {
                toast.error(result.error || 'Error al emitir factura')
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al emitir factura'
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Formulario Principal (8/12) */}
            <div className="lg:col-span-8 space-y-6">
                <Card className="shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                            <span className="text-primary">📄</span> Datos de la Factura
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {/* RFC-025: Empresa Emisora y Plantilla */}
                        <div className={empresaId === EMPRESA_VISION_GLOBAL_ID ? "grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-linear-to-r from-primary/5 to-transparent rounded-lg border border-primary/10" : "p-4 bg-linear-to-r from-primary/5 to-transparent rounded-lg border border-primary/10"}>
                            {empresaId === EMPRESA_VISION_GLOBAL_ID && (
                                <div className="space-y-2 min-w-0">
                                    <Label className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-primary" />
                                        Empresa Emisora
                                    </Label>
                                    <Select
                                        value={selectedEmpresaId}
                                        onValueChange={(id) => {
                                            setSelectedEmpresaId(id)
                                            setSerieId('')
                                        }}
                                        disabled={empresaId !== EMPRESA_VISION_GLOBAL_ID}
                                    >
                                        <SelectTrigger data-testid="factura-empresa-select" className="w-full min-w-0">
                                            <SelectValue placeholder="Seleccionar empresa" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {empresas.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id}>
                                                    {emp.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-2 min-w-0">
                                <Label className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    Plantilla PDF
                                </Label>
                                <PlantillaSelector
                                    empresaId={selectedEmpresaId}
                                    value={selectedPlantillaId}
                                    onChange={setSelectedPlantillaId}
                                />
                            </div>
                        </div>



                        <div className="flex items-center space-x-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="externa-switch" className="font-semibold cursor-pointer">Factura Externa</Label>
                                <span
                                    data-testid="factura-externa-switch"
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${esExterna ? 'bg-primary' : 'bg-slate-200'}`}
                                    onClick={() => setEsExterna(!esExterna)}
                                >
                                    <span
                                        className={`${esExterna ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                    />
                                </span>
                            </div>
                            {esExterna && <span className="text-xs text-slate-500 ml-2">Se asignará número de serie automáticamente. Puedes subir el PDF ahora o más tarde.</span>}
                        </div>

                        <Separator className="bg-slate-100" />

                        {/* Serie y Cliente */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {seriesParaMostrar.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Serie de Facturación</Label>
                                    <Select value={serieId} onValueChange={setSerieId}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Seleccionar serie..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {seriesParaMostrar.map((s: Serie) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.nombre} ({s.codigo})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {proximoNumeroPreview && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                            <span className="font-mono font-semibold text-primary">{proximoNumeroPreview}</span>
                                            <span className="text-xs">(se asignará al emitir)</span>
                                        </p>
                                    )}
                                </div>
                            )}

                            {esExterna && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-right-2">
                                    <Label className="flex items-center gap-2">
                                        <Upload className="h-4 w-4 text-primary" />
                                        Documento PDF
                                    </Label>
                                    <Input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                                        className="bg-white file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    />
                                </div>
                            )}
                            <div className="space-y-2" data-testid="cliente-combobox-wrapper">
                                <Label htmlFor="cliente">Cliente</Label>
                                <SimpleCombobox
                                    data-testid="combobox-cliente"
                                    options={clientesParaMostrar.map(c => ({
                                        value: c.id,
                                        label: c.nombre_fiscal,
                                        subLabel: c.cif
                                    }))}
                                    value={clienteId}
                                    onChange={(val) => setClienteId(val)}
                                    placeholder="Seleccionar cliente..."
                                    searchPlaceholder="Buscar cliente por nombre o CIF..."
                                    emptyText="No se encontraron clientes."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Fecha de emisión</Label>
                                <Input
                                    type="date"
                                    value={fechaEmision}
                                    onChange={(e) => setFechaEmision(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                        </div>

                        {/* RFC-029: Divisa y Tipo de Cambio */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="space-y-2">
                                <Label>Divisa</Label>
                                <Select value={divisa} onValueChange={setDivisa}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EUR">Euro (€)</SelectItem>
                                        <SelectItem value="USD">Dólar ($)</SelectItem>
                                        <SelectItem value="GBP">Libra (£)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {divisa !== 'EUR' && (
                                <div className="space-y-2 md:col-span-2 animate-in slide-in-from-left-2">
                                    <Label>Tipo de Cambio (1 EUR = ? {divisa})</Label>
                                    <div className="flex gap-4 items-center">
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            value={Number.isNaN(tipoCambio) ? '' : tipoCambio}
                                            onChange={(e) => setTipoCambio(parseFloat(e.target.value) || 1)}
                                            className="bg-white"
                                        />
                                        <p className="text-xs text-slate-500 italic">
                                            Se utilizará para cálculos internos si fuera necesario.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator className="bg-slate-100" />

                        {/* Líneas de Factura */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Líneas de Concepto</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addLinea}
                                    className="h-8 text-primary border-primary/20 hover:bg-primary/5"
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Añadir Línea
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {lineas.map((linea, index) => (
                                    <div key={index} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex-1">
                                            <Input
                                                placeholder="Concepto / Servicio"
                                                value={linea.concepto}
                                                onChange={(e) => updateLinea(index, 'concepto', e.target.value)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="w-20">
                                            <Input
                                                type="number"
                                                placeholder="Cant"
                                                value={Number.isNaN(linea.cantidad) ? '' : linea.cantidad}
                                                onChange={(e) => updateLinea(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                                className="bg-white text-center"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    placeholder="Precio"
                                                    value={Number.isNaN(linea.precio_unitario) ? '' : linea.precio_unitario}
                                                    onChange={(e) => updateLinea(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                                                    className="bg-white pl-7"
                                                />
                                                <span className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 font-medium">{getSimboloDivisa(divisa)}</span>
                                            </div>
                                        </div>
                                        <div className="w-32">
                                            <div className="h-10 flex items-center px-3 bg-slate-50 rounded-md border border-slate-200 font-medium text-slate-700">
                                                {((Number(linea.cantidad) || 0) * (Number(linea.precio_unitario) || 0)).toFixed(2)}{getSimboloDivisa(divisa)}
                                            </div>
                                        </div>
                                        {lineas.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeLinea(index)}
                                                className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator className="bg-slate-100" />

                        {/* Notas */}
                        <div className="space-y-2">
                            <Label htmlFor="notas" className="flex items-center gap-2">
                                <span className="text-slate-400">📝</span> Notas / Clausulas Adicionales
                            </Label>
                            <Textarea
                                id="notas"
                                placeholder="Añadir notas internas o para el cliente..."
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                className="min-h-[100px] bg-white"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Resumen y Guardado (4/12) */}
            <div className="lg:col-span-4 space-y-6">
                <Card className="shadow-lg border-primary/10 overflow-hidden">
                    <CardHeader className="bg-primary text-primary-foreground py-4">
                        <CardTitle className="text-lg font-bold flex items-center justify-between">
                            Resumen Económico
                            <span className="text-xs font-normal opacity-80 uppercase">{divisa} ({getSimboloDivisa(divisa)})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Subtotal</span>
                            <span className="font-medium">{totales.subtotal.toFixed(2)}{getSimboloDivisa(divisa)}</span>
                        </div>

                        {/* Descuento Global Segment */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between text-sm">
                                <Label className="text-slate-500 font-normal">Descuento Global</Label>
                                <div className="flex items-center rounded-md border border-slate-200 bg-slate-50">
                                    <button
                                        type="button"
                                        onClick={() => setDescuentoTipo('porcentaje')}
                                        className={`px-2 py-1 text-xs rounded-l-md ${descuentoTipo === 'porcentaje' ? 'bg-primary text-primary-foreground' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        <Percent className="h-3 w-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDescuentoTipo('fijo')}
                                        className={`px-2 py-1 text-xs rounded-r-md ${descuentoTipo === 'fijo' ? 'bg-primary text-primary-foreground' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        <span className="font-bold text-[10px]">{getSimboloDivisa(divisa)}</span>
                                    </button>
                                </div>
                            </div>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={Number.isNaN(descuentoValor) ? '' : descuentoValor}
                                    onChange={(e) => setDescuentoValor(parseFloat(e.target.value) || 0)}
                                    className="bg-white h-9"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-slate-400">
                                    {descuentoTipo === 'porcentaje' ? '%' : getSimboloDivisa(divisa)}
                                </span>
                            </div>
                        </div>

                        <Separator className="bg-slate-100" />

                        <div className="flex justify-between text-sm font-medium">
                            <span>Base Imponible</span>
                            <span>{totales.base_imponible.toFixed(2)}{getSimboloDivisa(divisa)}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">
                                IVA (
                                {lineas.length > 0
                                    ? [...new Set(lineas.map((l) => l.iva_porcentaje ?? 21))].sort((a, b) => a - b).join('%, ') + '%'
                                    : '21%'}
                                )
                            </span>
                            <span>{totales.iva.toFixed(2)}{getSimboloDivisa(divisa)}</span>
                        </div>

                        {(retencionPorcentaje > 0 || retencionPorcentaje < 0) && (
                            <div className="flex justify-between text-sm text-amber-700 dark:text-amber-400">
                                <span>Retención IRPF ({retencionPorcentaje}%)</span>
                                <span>-{(totales.base_imponible * Math.abs(retencionPorcentaje) / 100).toFixed(2)}{getSimboloDivisa(divisa)}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-slate-500 font-normal text-xs">Retención IRPF % (solo Empresa/Autónomo)</Label>
                            <Input
                                data-testid="retencion-irpf-input"
                                type="number"
                                min={-1}
                                max={100}
                                step={0.5}
                                value={Number.isNaN(retencionPorcentaje) ? '' : retencionPorcentaje}
                                onChange={(e) => setRetencionPorcentaje(parseFloat(e.target.value) || 0)}
                                className="bg-white h-9"
                            />
                        </div>

                        <div className="bg-slate-50 -mx-6 p-6 space-y-2 border-y border-slate-200">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-slate-800 tracking-tight">TOTAL</span>
                                <span className="text-2xl font-black text-primary">
                                    {totales.total.toFixed(2)}{getSimboloDivisa(divisa)}
                                </span>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-linear-to-r from-primary to-primary/80 hover:scale-[1.02] transition-all text-white font-bold h-12 text-lg shadow-md shadow-primary/20"
                            onClick={validateAndShowConfirm}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...
                                </>
                            ) : (
                                'Emitir Factura'
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-10 border-slate-200"
                            onClick={handleGuardarBorrador}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Guardar Borrador
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-10 text-slate-500 border-slate-200"
                            onClick={() => router.back()}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                    </CardContent>
                </Card>

                {/* Confirmation Dialog */}
                <ConfirmDialog
                    open={showConfirmDialog}
                    onOpenChange={setShowConfirmDialog}
                    title="Confirmar emisión de factura"
                    description={`¿Estás seguro de emitir esta factura por ${totales.total.toFixed(2)}${getSimboloDivisa(divisa)}? Una vez emitida, no podrá ser eliminada, solo rectificada.`}
                    confirmText="Sí, emitir factura"
                    cancelText="Revisar datos"
                    onConfirm={handleEmitir}
                />

                {/* Info Card */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3 shadow-sm">
                    <span className="text-xl">💡</span>
                    <p className="text-xs text-amber-800 leading-relaxed">
                        Recuerda que una vez emitida, la factura tendrá un número correlativo asignado automáticamente y no podrá ser eliminada, solo rectificada.
                    </p>
                </div>
            </div>
        </div >
    )
}
