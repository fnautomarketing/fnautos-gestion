'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { Lock as LockIcon, Info as InfoIcon, Percent, Euro, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

import { editarFacturaAction } from '@/app/actions/ventas'
import { PlantillaSelector } from '@/components/plantilla-selector'
import { HistorialCambiosCard } from './historial-cambios-card'

import type { Factura, Cliente, LineaFactura, Cambio, Serie } from '@/types/ventas'

interface FacturaWithRelations extends Factura {
    cliente: Cliente
    lineas: LineaFactura[]
    serie_id: string | null
}

interface LineaForm {
    concepto: string
    descripcion: string
    cantidad: number
    precio_unitario: number
    descuento_porcentaje: number
    iva_porcentaje: number
}

interface EditarFacturaFormProps {
    factura: FacturaWithRelations
    empresaId: string
    cambios: Cambio[]
    clientes?: Array<{ id: string; nombre_fiscal: string; cif?: string }>
}

export function EditarFacturaForm({ factura, empresaId, cambios, clientes = [] }: EditarFacturaFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [series, setSeries] = useState<Serie[]>([])
    const [serieSeleccionada, setSerieSeleccionada] = useState<string>(factura.serie_id || '')
    const [selectedPlantillaId, setSelectedPlantillaId] = useState<string>(factura.plantilla_pdf_id || '')

    const [loadingSeries, setLoadingSeries] = useState(true)
    const [archivo, setArchivo] = useState<File | null>(null)
    const [archivoUrl, setArchivoUrl] = useState<string | null>(factura.archivo_url || null)

    // Cargar series al iniciar
    useEffect(() => {
        const fetchSeries = async () => {
            const { data } = await createClient()
                .from('series_facturacion')
                .select('*')
                .eq('empresa_id', empresaId)
                .eq('activa', true)
                .order('predeterminada', { ascending: false })

            if (data) {
                setSeries(data)
                if (!serieSeleccionada && data.length > 0) {
                    const defaultSerie = data.find(s => s.predeterminada) || data[0]
                    setSerieSeleccionada(defaultSerie.id)
                }
            }
            setLoadingSeries(false)
        }
        fetchSeries()
    }, [empresaId, serieSeleccionada])

    // Determinar qué se puede editar según estado
    type Permisos = {
        todo?: boolean
        notas?: boolean
        mensaje: string
    }

    const estadoEditable: Record<string, Permisos> = {
        borrador: {
            todo: true,
            mensaje: 'Esta factura está en borrador. Puedes modificar todos los campos libremente.',
        },
        emitida: factura.es_externa
            ? {
                todo: true,
                mensaje: 'Factura externa emitida. Puedes editar todos los campos para completar los datos cuando la empresa externa envíe el PDF.',
            }
            : {
                notas: true,
                mensaje:
                    'Esta factura está emitida. Solo puedes modificar las notas internas. Para cambios mayores, considera crear una nota de crédito.',
            },
        pagada: {
            notas: true,
            mensaje:
                'Esta factura está pagada. Solo puedes modificar las notas internas. Para cambios mayores, crea una nota de crédito.',
        },
    }

    const permisos = estadoEditable[factura.estado] || {
        mensaje: 'Esta factura no puede ser editada.',
    }

    const [clienteId, setClienteId] = useState<string>(factura.cliente_id || factura.cliente?.id || '')
    const [fechaEmision, setFechaEmision] = useState<string>(
        factura.fecha_emision ? format(new Date(factura.fecha_emision), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    )
    const [notas, setNotas] = useState<string>(factura.notas || '')
    // Normalizar líneas para edición (concepto, cantidad, precio_unitario, iva_porcentaje, descuento_porcentaje, descripcion)
    const lineasIniciales = (factura.lineas || []).map((l: LineaFactura) => ({
        concepto: l.concepto || '',
        descripcion: l.descripcion || '',
        cantidad: Number(l.cantidad) || 1,
        precio_unitario: Number(l.precio_unitario) || 0,
        descuento_porcentaje: Number(l.descuento_porcentaje) || 0,
        iva_porcentaje: Number(l.iva_porcentaje) || 21,
    }))
    const [lineas, setLineas] = useState<LineaForm[]>(lineasIniciales.length > 0 ? lineasIniciales : [
        { concepto: '', descripcion: '', cantidad: 1, precio_unitario: 0, descuento_porcentaje: 0, iva_porcentaje: 21 }
    ])

    const updateLinea = (index: number, field: keyof LineaForm, value: string | number) => {
        const newLineas = [...lineas]
        const linea = newLineas[index]
        if (field === 'concepto' || field === 'descripcion') {
            linea[field] = value as string
        } else {
            linea[field] = value as number
        }
        setLineas(newLineas)
    }
    const addLinea = () => {
        setLineas([...lineas, { concepto: '', descripcion: '', cantidad: 1, precio_unitario: 0, descuento_porcentaje: 0, iva_porcentaje: 21 }])
    }
    const removeLinea = (index: number) => {
        if (lineas.length > 1) setLineas(lineas.filter((_, i) => i !== index))
    }

    // Estados para nuevos campos
    const [descuentoTipo, setDescuentoTipo] = useState<'porcentaje' | 'fijo'>(factura.descuento_tipo || 'porcentaje')
    const [descuentoValor, setDescuentoValor] = useState<number>(factura.descuento_valor || 0)
    const [recargoEquivalencia, setRecargoEquivalencia] = useState<boolean>(factura.recargo_equivalencia || false)
    const [recargoPorcentaje, setRecargoPorcentaje] = useState<number>(factura.recargo_porcentaje || 5.2)
    const [retencionPorcentaje, setRetencionPorcentaje] = useState<number>(factura.retencion_porcentaje || 0)
    const [divisa, setDivisa] = useState<string>(factura.divisa || 'EUR')
    const [tipoCambio, setTipoCambio] = useState<number>(factura.tipo_cambio || 1.0)



    // Totales (Memoized)
    const totales = useMemo(() => {
        // Calcular subtotal de líneas (por si acaso cambió cantidad/precio en futuro)
        // Por ahora usamos las líneas tal cual.
        // Nota: Si linea.subtotal viene de base, confiamos en él, pero para recalcular descuentos globales necesitamos iterar.

        let subtotal = 0
        const lineasCalculadas = lineas.map(linea => {
            // Re-calcular subtotal de línea para asegurar consistencia
            const st = linea.cantidad * linea.precio_unitario * (1 - (linea.descuento_porcentaje || 0) / 100)
            subtotal += st
            return { ...linea, subtotalCalculado: st }
        })

        let descuentoGlobalMonto = 0
        if (descuentoTipo === 'porcentaje') {
            descuentoGlobalMonto = (subtotal * descuentoValor) / 100
        } else {
            descuentoGlobalMonto = descuentoValor
        }
        if (descuentoGlobalMonto > subtotal) descuentoGlobalMonto = subtotal

        const baseImponible = subtotal - descuentoGlobalMonto

        // Agrupar IVA
        const ivasPorPorcentaje: Record<number, number> = {}
        let totalIva = 0

        lineasCalculadas.forEach(linea => {
            // Prorrateo del descuento global
            const ratioDescuento = subtotal > 0 ? descuentoGlobalMonto / subtotal : 0
            const baseLinea = linea.subtotalCalculado * (1 - ratioDescuento)
            const ivaLinea = baseLinea * (linea.iva_porcentaje / 100)

            if (!ivasPorPorcentaje[linea.iva_porcentaje]) {
                ivasPorPorcentaje[linea.iva_porcentaje] = 0
            }
            ivasPorPorcentaje[linea.iva_porcentaje] += ivaLinea
            totalIva += ivaLinea
        })

        // Recargo
        let importeRecargo = 0
        if (recargoEquivalencia) {
            importeRecargo = (baseImponible * recargoPorcentaje) / 100
        }

        // Retención: efectoRetencion respeta el signo del porcentaje
        // porcentaje negativo (-1%) = resta del total; porcentaje positivo = suma
        const efectoRetencion = (baseImponible * retencionPorcentaje) / 100
        const importeRetencion = Math.abs(efectoRetencion)

        const total = baseImponible + totalIva + importeRecargo + efectoRetencion

        return {
            subtotal,
            descuentoGlobalMonto,
            baseImponible,
            ivasPorPorcentaje,
            totalIva,
            importeRecargo,
            importeRetencion,
            total
        }
    }, [lineas, descuentoTipo, descuentoValor, recargoEquivalencia, recargoPorcentaje, retencionPorcentaje])

    // Normalizar líneas originales para comparación
    const lineasOriginales = (factura.lineas || []).map((l: LineaFactura) => ({
        concepto: l.concepto || '',
        descripcion: l.descripcion || '',
        cantidad: Number(l.cantidad) || 1,
        precio_unitario: Number(l.precio_unitario) || 0,
        descuento_porcentaje: Number(l.descuento_porcentaje) || 0,
        iva_porcentaje: Number(l.iva_porcentaje) || 21,
    }))
    const lineasChanged = JSON.stringify(lineas.map(l => ({ ...l }))) !== JSON.stringify(lineasOriginales)

    // Detectar cambios
    const hayCambios =
        !!archivo ||
        clienteId !== (factura.cliente_id || factura.cliente?.id || '') ||
        fechaEmision !== (factura.fecha_emision ? format(new Date(factura.fecha_emision), 'yyyy-MM-dd') : '') ||
        notas !== (factura.notas || '') ||
        serieSeleccionada !== (factura.serie_id || '') ||
        selectedPlantillaId !== (factura.plantilla_pdf_id || '') ||
        descuentoTipo !== (factura.descuento_tipo || 'porcentaje') ||
        descuentoValor !== (factura.descuento_valor || 0) ||
        recargoEquivalencia !== (factura.recargo_equivalencia || false) ||
        recargoPorcentaje !== (factura.recargo_porcentaje || 5.2) ||
        retencionPorcentaje !== (factura.retencion_porcentaje || 0) ||
        divisa !== (factura.divisa || 'EUR') ||
        tipoCambio !== (factura.tipo_cambio || 1.0) ||
        (permisos.todo && lineasChanged)


    const uploadFile = async () => {
        if (!archivo) return null

        const supabase = createClient()
        const fileExt = archivo.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `facturas/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('facturas-externas')
            .upload(filePath, archivo)

        if (uploadError) {
            throw new Error('Error al subir el archivo')
        }

        const { data: { publicUrl } } = supabase.storage
            .from('facturas-externas')
            .getPublicUrl(filePath)

        return publicUrl
    }

    const handleGuardar = async () => {
        if (!hayCambios && !archivo) {
            toast.info('No hay cambios para guardar')
            return
        }

        setIsSubmitting(true)

        try {
            let finalArchivoUrl = archivoUrl
            if (archivo) {
                finalArchivoUrl = await uploadFile()
            }

            const formData = new FormData()
            formData.append('factura_id', factura.id)
            formData.append('empresa_id', empresaId)

            if (finalArchivoUrl) {
                formData.append('archivo_url', finalArchivoUrl)
            }
            formData.append('notas', notas)

            // Siempre enviar plantilla si cambió
            if (selectedPlantillaId !== (factura.plantilla_pdf_id || '')) {
                formData.append('plantilla_pdf_id', selectedPlantillaId)
            }

            // Si es borrador, enviar también cliente, fecha emisión, líneas y config financiera
            if (permisos.todo) {
                const lineasValidas = lineas.filter(l => l.concepto?.trim())
                if (lineasValidas.length === 0) {
                    toast.error('Debe haber al menos una línea con concepto')
                    setIsSubmitting(false)
                    return
                }
                if (lineasValidas.some(l => l.cantidad <= 0 || l.precio_unitario < 0)) {
                    toast.error('Cantidad debe ser mayor a 0 y precio no puede ser negativo')
                    setIsSubmitting(false)
                    return
                }
                formData.append('cliente_id', clienteId)
                formData.append('fecha_emision', fechaEmision || format(new Date(), 'yyyy-MM-dd'))
                formData.append('serie', serieSeleccionada)
                formData.append('descuento_tipo', descuentoTipo)
                formData.append('descuento_valor', descuentoValor.toString())
                formData.append('recargo_equivalencia', recargoEquivalencia.toString())
                formData.append('recargo_porcentaje', recargoPorcentaje.toString())
                formData.append('retencion_porcentaje', retencionPorcentaje.toString())
                formData.append('divisa', divisa)
                formData.append('tipo_cambio', tipoCambio.toString())
                const lineasForSchema = lineasValidas.map(l => ({
                    concepto: l.concepto,
                    descripcion: l.descripcion || '',
                    cantidad: l.cantidad,
                    precio_unitario: l.precio_unitario,
                    descuento_porcentaje: l.descuento_porcentaje || 0,
                    iva_porcentaje: l.iva_porcentaje || 21,
                }))
                formData.append('lineas', JSON.stringify(lineasForSchema))
            }

            const result = await editarFacturaAction(formData)

            setIsSubmitting(false)

            if (!result) {
                toast.error('Error desconocido al actualizar factura')
                return
            }

            if (result.success) {
                toast.success('Factura actualizada correctamente')
                router.refresh()
                // Reset file input
                setArchivo(null)
                if (finalArchivoUrl) setArchivoUrl(finalArchivoUrl)
            } else {
                toast.error(result.error || 'Error al actualizar factura')
            }
        } catch (error: unknown) {
            console.error(error)
            const message = error instanceof Error ? error.message : 'Error al guardar cambios'
            toast.error(message)
            setIsSubmitting(false)
        }
    }

    const getEstadoBadge = (estado: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            borrador: { label: 'Borrador', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
            emitida: { label: 'Emitida', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
            pagada: { label: 'Pagada', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
            anulada: { label: 'Anulada', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
        }
        const variant = variants[estado] || variants.borrador
        return <Badge className={variant.className}>{variant.label}</Badge>
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: divisa,
        }).format(amount)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-slate-100">
                            Editar Factura
                        </h1>
                        {getEstadoBadge(factura.estado)}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                        {factura.serie}-{factura.numero} · {factura.cliente.nombre_fiscal}
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/ventas/facturas/${factura.id}`)}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button onClick={handleGuardar} disabled={isSubmitting || !hayCambios}>
                        {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>

            {/* Alert de restricciones */}
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <InfoIcon className="h-4 w-4 text-blue-600 shrink-0" />
                <AlertDescription className="text-blue-900 dark:text-blue-100 flex items-start gap-2">
                    <span>{permisos.mensaje}</span>
                    {(factura.estado === 'emitida' || factura.estado === 'pagada') && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-300 dark:hover:bg-blue-700 transition-colors"
                                    aria-label="¿Qué es una nota de crédito?"
                                >
                                    <InfoIcon className="h-3 w-3" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" align="start">
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                    ¿Qué es una nota de crédito?
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                    Es un documento fiscal que anula o rectifica una factura ya emitida. Se usa cuando necesitas corregir errores, devoluciones o cambios que no puedes hacer directamente en la factura original.
                                </p>
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 text-sm">
                                    ¿Qué puedes hacer con ella?
                                </h4>
                                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                                    <li>Rectificar importes o conceptos erróneos</li>
                                    <li>Anular facturas emitidas por error</li>
                                    <li>Registrar devoluciones de productos</li>
                                    <li>Realizar descuentos posteriores</li>
                                </ul>
                            </PopoverContent>
                        </Popover>
                    )}
                </AlertDescription>
            </Alert>

            {/* Contenido en 2 columnas */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Columna Principal (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Datos de la Factura */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-slate-400">📄</span>
                                Datos de la Factura
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {permisos.todo ? (
                                    <Select value={serieSeleccionada} onValueChange={setSerieSeleccionada} disabled={loadingSeries}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={loadingSeries ? "Cargando..." : "Seleccionar serie"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {series.map(s => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.nombre} ({s.codigo})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="space-y-2">
                                        <Label>Serie</Label>
                                        <div className="flex items-center gap-2 p-2 bg-slate-50 border rounded-md">
                                            <LockIcon className="h-3 w-3 text-slate-400" />
                                            <span className="text-sm font-medium">
                                                {series.find(s => s.id === serieSeleccionada)?.codigo || factura.serie}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        Número
                                        <LockIcon className="h-3 w-3 text-slate-400" />
                                    </Label>
                                    <Input value={factura.numero} disabled className="bg-slate-50" />
                                </div>

                                <div className="space-y-2">
                                    <Label className={cn("flex items-center gap-2", !permisos.todo && "text-slate-500")}>
                                        Fecha Emisión
                                        {!permisos.todo && <LockIcon className="h-3 w-3 text-slate-400" />}
                                    </Label>
                                    {permisos.todo ? (
                                        <Input
                                            type="date"
                                            value={fechaEmision}
                                            onChange={(e) => setFechaEmision(e.target.value)}
                                            className="bg-white"
                                        />
                                    ) : (
                                        <Input
                                            value={format(new Date(factura.fecha_emision), 'dd/MM/yyyy', { locale: es })}
                                            disabled
                                            className="bg-slate-50"
                                        />
                                    )}
                                </div>

                                {factura.es_externa && (
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>PDF de Factura Externa</Label>
                                        <div className="flex items-center gap-4">
                                            <Input
                                                type="file"
                                                accept=".pdf"
                                                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                                                className="bg-white"
                                            />
                                            {archivoUrl && (
                                                <Button type="button" variant="outline" size="sm" asChild>
                                                    <a href={archivoUrl} target="_blank" rel="noopener noreferrer">
                                                        Ver PDF actual
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}


                                {/* Selección de Plantilla PDF */}
                                <div className="space-y-2">
                                    <Label>Plantilla PDF</Label>
                                    <PlantillaSelector
                                        empresaId={empresaId}
                                        value={selectedPlantillaId}
                                        onChange={setSelectedPlantillaId}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* RFC-029: Divisa y Tipo de Cambio */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-slate-400">💱</span>
                                Divisa y Cambio
                                {!permisos.todo && <LockIcon className="h-3 w-3 text-slate-400" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Divisa de la Factura</Label>
                                <Select
                                    value={divisa}
                                    onValueChange={setDivisa}
                                    disabled={!permisos.todo}
                                >
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
                                <div className="space-y-2 animate-in slide-in-from-left-2">
                                    <Label>Tipo de Cambio (1 EUR = ? {divisa})</Label>
                                    <Input
                                        type="number"
                                        step="0.0001"
                                        value={tipoCambio}
                                        onChange={(e) => setTipoCambio(parseFloat(e.target.value))}
                                        disabled={!permisos.todo}
                                        className="bg-white"
                                    />
                                    <p className="text-[10px] text-slate-500 italic">
                                        Solo para referencia contable interna.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Cliente */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-slate-400">👤</span>
                                Cliente
                                {!permisos.todo && <LockIcon className="h-3 w-3 text-slate-400" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {permisos.todo && clientes.length > 0 ? (
                                <Select value={clienteId} onValueChange={setClienteId}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Seleccionar cliente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clientes.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.nombre_fiscal}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-semibold">
                                            {factura.cliente?.nombre_fiscal?.substring(0, 2).toUpperCase() || '--'}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{factura.cliente?.nombre_fiscal || '-'}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                CIF: {factura.cliente?.cif || '-'} · {factura.cliente?.direccion || 'Sin dirección'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Líneas de Factura */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <span className="text-slate-400">📋</span>
                                    Líneas de Factura
                                </span>
                                {permisos.todo ? (
                                    <Button type="button" variant="outline" size="sm" onClick={addLinea}>
                                        <Plus className="h-4 w-4 mr-1" /> Añadir línea
                                    </Button>
                                ) : (
                                    <span className="text-xs text-slate-500 font-normal">
                                        No puedes modificar líneas de una factura emitida
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2 text-sm font-medium">Concepto</th>
                                            <th className="text-center p-2 text-sm font-medium w-20">Cantidad</th>
                                            <th className="text-right p-2 text-sm font-medium w-28">Precio</th>
                                            <th className="text-center p-2 text-sm font-medium w-20">IVA %</th>
                                            <th className="text-right p-2 text-sm font-medium w-28">Total</th>
                                            {permisos.todo && <th className="w-10 p-2" />}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lineas.map((linea, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="p-2">
                                                    {permisos.todo ? (
                                                        <Input
                                                            value={linea.concepto}
                                                            onChange={(e) => updateLinea(index, 'concepto', e.target.value)}
                                                            placeholder="Concepto"
                                                            className="bg-white"
                                                        />
                                                    ) : (
                                                        <div>
                                                            <p className="font-medium">{linea.concepto}</p>
                                                            {linea.descripcion && (
                                                                <p className="text-xs text-slate-500">{linea.descripcion}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    {permisos.todo ? (
                                                        <Input
                                                            type="number"
                                                            min={0.01}
                                                            step={0.01}
                                                            value={linea.cantidad}
                                                            onChange={(e) => updateLinea(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                                            className="bg-white text-center"
                                                        />
                                                    ) : (
                                                        <span className="block text-center">{linea.cantidad}</span>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    {permisos.todo ? (
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            step={0.01}
                                                            value={linea.precio_unitario}
                                                            onChange={(e) => updateLinea(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                                                            className="bg-white text-right"
                                                        />
                                                    ) : (
                                                        <span className="block text-right">{formatCurrency(linea.precio_unitario)}</span>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    {permisos.todo ? (
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            step={0.01}
                                                            value={linea.iva_porcentaje}
                                                            onChange={(e) => updateLinea(index, 'iva_porcentaje', parseFloat(e.target.value) || 21)}
                                                            className="bg-white text-center"
                                                        />
                                                    ) : (
                                                        <span className="block text-center">{linea.iva_porcentaje}%</span>
                                                    )}
                                                </td>
                                                <td className="p-2 text-right font-semibold">
                                                    {formatCurrency(linea.cantidad * linea.precio_unitario * (1 - (linea.descuento_porcentaje || 0) / 100))}
                                                </td>
                                                {permisos.todo && (
                                                    <td className="p-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => removeLinea(index)}
                                                            disabled={lineas.length <= 1}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Columna Lateral (1/3) */}
                <div className="space-y-6">
                    {/* Resumen Económico */}
                    <Card className="bg-slate-50 dark:bg-slate-800">
                        <CardHeader>
                            <CardTitle className="text-sm">Resumen Económico</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                                <span className="font-medium">{formatCurrency(totales.subtotal)}</span>
                            </div>

                            {/* Descuento Global */}
                            <div className="space-y-3 pt-2 border-t">
                                <div className="flex items-center justify-between text-sm">
                                    <Label className="text-slate-600 font-normal">Descuento Global</Label>
                                    {permisos.todo ? (
                                        <div className="flex gap-2">
                                            <div className="flex items-center rounded-md border border-slate-200 bg-white">
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
                                                    <Euro className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={descuentoValor}
                                                onChange={(e) => setDescuentoValor(parseFloat(e.target.value) || 0)}
                                                className="w-20 h-8 text-right bg-white"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-sm font-medium text-slate-700">
                                            {totales.descuentoGlobalMonto > 0 ? `-${formatCurrency(totales.descuentoGlobalMonto)}` : '-'}
                                        </span>
                                    )}
                                </div>
                                {permisos.todo && totales.descuentoGlobalMonto > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Descuento aplicado</span>
                                        <span>-{formatCurrency(totales.descuentoGlobalMonto)}</span>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Base Imponible</span>
                                <span className="font-medium">{formatCurrency(totales.baseImponible)}</span>
                            </div>

                            {Object.entries(totales.ivasPorPorcentaje).map(([porcentaje, monto]) => (
                                <div key={porcentaje} className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">IVA ({porcentaje}%)</span>
                                    <span>{formatCurrency(monto)}</span>
                                </div>
                            ))}

                            {/* Recargo */}
                            <div className="space-y-3 pt-2 border-t">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="recargo" className="text-slate-600 font-normal">Recargo Eq.</Label>
                                        {permisos.todo ? (
                                            <Switch id="recargo" checked={recargoEquivalencia} onCheckedChange={setRecargoEquivalencia} />
                                        ) : recargoEquivalencia ? <Badge variant="outline">Sí</Badge> : null}
                                    </div>
                                    {recargoEquivalencia && (
                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                            {permisos.todo ? (
                                                <Input
                                                    type="number"
                                                    value={recargoPorcentaje}
                                                    onChange={(e) => setRecargoPorcentaje(parseFloat(e.target.value) || 0)}
                                                    className="w-16 h-7 text-right"
                                                />
                                            ) : (
                                                <span>{recargoPorcentaje}%</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {recargoEquivalencia && totales.importeRecargo > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Recargo ({recargoPorcentaje}%)</span>
                                        <span>{formatCurrency(totales.importeRecargo)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Retención */}
                            <div className="space-y-3 pt-2 border-t">
                                <div className="flex items-center justify-between text-sm">
                                    <Label className="text-slate-600 font-normal">Retención IRPF (%)</Label>
                                    {permisos.todo ? (
                                        <Input
                                            type="number"
                                            min="-100"
                                            max="100"
                                            value={retencionPorcentaje}
                                            onChange={(e) => setRetencionPorcentaje(parseFloat(e.target.value) || 0)}
                                            className="w-20 h-8 text-right bg-white"
                                        />
                                    ) : (
                                        <span className="font-medium">{retencionPorcentaje}%</span>
                                    )}
                                </div>
                                {retencionPorcentaje !== 0 && totales.importeRetencion > 0 && (
                                    <div className="flex justify-between text-sm text-orange-600">
                                        <span>Retención IRPF ({retencionPorcentaje}%)</span>
                                        <span>{retencionPorcentaje < 0 ? '-' : '+'}{formatCurrency(totales.importeRetencion)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t mt-4">
                                <span className="font-semibold">Total</span>
                                <span className="text-2xl font-bold text-primary">
                                    {formatCurrency(totales.total)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notas Internas */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <span className="text-slate-400">📝</span>
                                Notas Internas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                placeholder="Añadir nota privada sobre esta factura..."
                                rows={4}
                                disabled={!permisos.notas && !permisos.todo}
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                Solo visible para personal administrativo
                            </p>
                        </CardContent>
                    </Card>

                    {/* Historial de Cambios */}
                    <HistorialCambiosCard cambios={cambios} />
                </div>
            </div>
        </div>
    )
}
