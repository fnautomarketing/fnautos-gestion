'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Upload, Loader2 } from 'lucide-react'
import { crearPlantillaAction, actualizarPlantillaAction, subirLogoAction } from '@/app/actions/plantillas'
import { PlantillaPDF } from '@/types/ventas'

interface PlantillaEditorProps {
    plantillaId?: string
    defaultValues?: Partial<PlantillaPDF>
}

/**
 * Editor completo de plantillas PDF con sección de logo, colores, estructura y preview en tiempo real.
 * Aplica el skill premium_ui_design con glassmorphism y micro-interacciones.
 */
export function PlantillaEditor({ plantillaId, defaultValues }: PlantillaEditorProps) {
    const router = useRouter()
    const isEditing = !!plantillaId
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Estados del formulario
    const [logoUrl, setLogoUrl] = useState(defaultValues?.logo_url || '')
    const [logoPosicion, setLogoPosicion] = useState(defaultValues?.logo_posicion || 'izquierda')
    const [logoAncho, setLogoAncho] = useState(defaultValues?.logo_ancho || 120)
    const [logoAlto, setLogoAlto] = useState(defaultValues?.logo_alto || 60)
    const [isUploadingLogo, setIsUploadingLogo] = useState(false)

    // Colores
    const [colorPrimario, setColorPrimario] = useState(defaultValues?.color_primario || '#1a365d')
    const [colorSecundario, setColorSecundario] = useState(defaultValues?.color_secundario || '#718096')
    const [colorEncabezadoTabla, setColorEncabezadoTabla] = useState(defaultValues?.color_encabezado_tabla || '#2d3748')

    // Estructura
    const [alternarColorFilas, setAlternarColorFilas] = useState(defaultValues?.alternar_color_filas ?? true)
    const [mostrarDatosBancarios, setMostrarDatosBancarios] = useState(defaultValues?.mostrar_datos_bancarios ?? true)
    const [mostrarNotas, setMostrarNotas] = useState(defaultValues?.mostrar_notas ?? true)
    const [mostrarQrPago, setMostrarQrPago] = useState(defaultValues?.mostrar_qr_pago ?? false)
    const [mostrarFirma, setMostrarFirma] = useState(defaultValues?.mostrar_firma ?? false)
    const [mostrarSello, setMostrarSello] = useState(defaultValues?.mostrar_sello ?? false)

    // Estado
    const [activa, setActiva] = useState(defaultValues?.activa ?? true)
    const [predeterminada, setPredeterminada] = useState(defaultValues?.predeterminada ?? false)

    // Idiomas
    const [idiomas, setIdiomas] = useState<string[]>(defaultValues?.idiomas || ['es'])

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploadingLogo(true)
        const formData = new FormData()
        formData.append('logo', file)

        const result = await subirLogoAction(formData)
        setIsUploadingLogo(false)

        if (result.success) {
            setLogoUrl(result.data!.url)
            toast.success('Logo subido correctamente')
        } else {
            toast.error(result.error || 'Error al subir logo')
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)

        // Agregar campos controlados por estado
        formData.set('logo_url', logoUrl)
        formData.set('logo_posicion', logoPosicion)
        formData.set('logo_ancho', String(logoAncho))
        formData.set('logo_alto', String(logoAlto))
        formData.set('color_primario', colorPrimario)
        formData.set('color_secundario', colorSecundario)
        formData.set('color_encabezado_tabla', colorEncabezadoTabla)
        formData.set('idiomas', JSON.stringify(idiomas))
        formData.set('mostrar_numero_factura', 'true')
        formData.set('mostrar_fecha_emision', 'true')
        formData.set('mostrar_fecha_vencimiento', 'true')
        formData.set('mostrar_datos_bancarios', String(mostrarDatosBancarios))
        formData.set('mostrar_notas', String(mostrarNotas))
        formData.set('mostrar_qr_pago', String(mostrarQrPago))
        formData.set('alternar_color_filas', String(alternarColorFilas))
        formData.set('mostrar_firma', String(mostrarFirma))
        formData.set('mostrar_sello', String(mostrarSello))
        formData.set('activa', String(activa))
        formData.set('predeterminada', String(predeterminada))

        const result = isEditing
            ? await actualizarPlantillaAction(plantillaId!, formData)
            : await crearPlantillaAction(formData)

        setIsSubmitting(false)

        if (result.success) {
            toast.success(isEditing ? 'Plantilla actualizada' : 'Plantilla creada')
            router.push('/ventas/configuracion/plantillas')
            router.refresh()
        } else {
            toast.error(result.error || 'Error al guardar')
        }
    }

    const toggleIdioma = (idioma: string, checked: boolean) => {
        if (checked) {
            setIdiomas([...idiomas, idioma])
        } else {
            setIdiomas(idiomas.filter(i => i !== idioma))
        }
    }

    return (
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-8">
            {/* Columna Izquierda: Editor */}
            <div className="space-y-6">
                {/* Información básica */}
                <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        📝 Información General
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="nombre">Nombre de la Plantilla *</Label>
                            <Input
                                id="nombre"
                                name="nombre"
                                defaultValue={defaultValues?.nombre}
                                placeholder="Ej: Plantilla Corporativa"
                                required
                                className="mt-1 bg-white/5 border-white/10 focus:border-primary"
                            />
                        </div>

                        <div>
                            <Label htmlFor="descripcion">Descripción</Label>
                            <Textarea
                                id="descripcion"
                                name="descripcion"
                                defaultValue={defaultValues?.descripcion || ''}
                                placeholder="Descripción breve de la plantilla..."
                                className="mt-1 bg-white/5 border-white/10 focus:border-primary min-h-[80px]"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-3">
                                <Switch
                                    id="activa"
                                    checked={activa}
                                    onCheckedChange={setActiva}
                                />
                                <Label htmlFor="activa" className="cursor-pointer">Plantilla activa</Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <Switch
                                    id="predeterminada"
                                    checked={predeterminada}
                                    onCheckedChange={setPredeterminada}
                                />
                                <Label htmlFor="predeterminada" className="cursor-pointer">Predeterminada</Label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logo y Cabecera */}
                <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        🖼️ Logo y Cabecera
                    </h2>

                    <div className="space-y-5">
                        {/* Preview de logo */}
                        {logoUrl && (
                            <div className="p-4 bg-white rounded-xl border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={logoUrl}
                                    alt="Logo preview"
                                    style={{ width: `${logoAncho}px`, height: `${logoAlto}px` }}
                                    className={`object-contain ${logoPosicion === 'centro' ? 'mx-auto' :
                                        logoPosicion === 'derecha' ? 'ml-auto' : ''
                                        }`}
                                />
                            </div>
                        )}

                        {/* Subir logo */}
                        <div className="flex gap-3">
                            <label className="flex-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full bg-white/5 border-white/10 hover:bg-white/10"
                                    disabled={isUploadingLogo}
                                    asChild
                                >
                                    <span className="cursor-pointer">
                                        {isUploadingLogo ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Upload className="h-4 w-4 mr-2" />
                                        )}
                                        {isUploadingLogo ? 'Subiendo...' : 'Subir Logo'}
                                    </span>
                                </Button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                />
                            </label>
                            <Input
                                placeholder="O pega URL del logo"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                className="flex-1 bg-white/5 border-white/10"
                            />
                        </div>

                        {/* Posición del logo */}
                        <div>
                            <Label className="mb-2 block">Posición del Logo</Label>
                            <RadioGroup
                                value={logoPosicion}
                                onValueChange={(val: 'izquierda' | 'centro' | 'derecha') => setLogoPosicion(val)}
                                className="flex gap-6"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="izquierda" id="pos-izq" />
                                    <Label htmlFor="pos-izq" className="cursor-pointer">Izquierda</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="centro" id="pos-centro" />
                                    <Label htmlFor="pos-centro" className="cursor-pointer">Centro</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="derecha" id="pos-der" />
                                    <Label htmlFor="pos-der" className="cursor-pointer">Derecha</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Sliders de tamaño */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <Label className="mb-3 block">Ancho: <span className="text-primary font-bold">{logoAncho}px</span></Label>
                                <Slider
                                    value={[logoAncho]}
                                    onValueChange={(v) => setLogoAncho(v[0])}
                                    min={50}
                                    max={300}
                                    step={10}
                                />
                            </div>
                            <div>
                                <Label className="mb-3 block">Alto: <span className="text-primary font-bold">{logoAlto}px</span></Label>
                                <Slider
                                    value={[logoAlto]}
                                    onValueChange={(v) => setLogoAlto(v[0])}
                                    min={30}
                                    max={150}
                                    step={5}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Colores */}
                <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        🎨 Colores
                    </h2>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label className="mb-2 block text-sm">Color Primario</Label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={colorPrimario}
                                    onChange={(e) => setColorPrimario(e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/10"
                                />
                                <Input
                                    value={colorPrimario}
                                    onChange={(e) => setColorPrimario(e.target.value)}
                                    className="flex-1 bg-white/5 border-white/10 font-mono text-xs"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="mb-2 block text-sm">Color Secundario</Label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={colorSecundario}
                                    onChange={(e) => setColorSecundario(e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/10"
                                />
                                <Input
                                    value={colorSecundario}
                                    onChange={(e) => setColorSecundario(e.target.value)}
                                    className="flex-1 bg-white/5 border-white/10 font-mono text-xs"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="mb-2 block text-sm">Encabezado Tabla</Label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={colorEncabezadoTabla}
                                    onChange={(e) => setColorEncabezadoTabla(e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/10"
                                />
                                <Input
                                    value={colorEncabezadoTabla}
                                    onChange={(e) => setColorEncabezadoTabla(e.target.value)}
                                    className="flex-1 bg-white/5 border-white/10 font-mono text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Estructura */}
                <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        📐 Estructura del PDF
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <Checkbox id="alternar" checked={alternarColorFilas} onCheckedChange={(c) => setAlternarColorFilas(c === true)} />
                            <Label htmlFor="alternar" className="cursor-pointer text-sm">Alternar color de filas</Label>
                        </div>
                        <div className="flex items-center gap-3">
                            <Checkbox id="bancarios" checked={mostrarDatosBancarios} onCheckedChange={(c) => setMostrarDatosBancarios(c === true)} />
                            <Label htmlFor="bancarios" className="cursor-pointer text-sm">Mostrar datos bancarios</Label>
                        </div>
                        <div className="flex items-center gap-3">
                            <Checkbox id="notas" checked={mostrarNotas} onCheckedChange={(c) => setMostrarNotas(c === true)} />
                            <Label htmlFor="notas" className="cursor-pointer text-sm">Mostrar notas</Label>
                        </div>
                        <div className="flex items-center gap-3">
                            <Checkbox id="qr" checked={mostrarQrPago} onCheckedChange={(c) => setMostrarQrPago(c === true)} />
                            <Label htmlFor="qr" className="cursor-pointer text-sm">Mostrar QR de pago</Label>
                        </div>
                        <div className="flex items-center gap-3">
                            <Checkbox id="firma" checked={mostrarFirma} onCheckedChange={(c) => setMostrarFirma(c === true)} />
                            <Label htmlFor="firma" className="cursor-pointer text-sm">Mostrar firma</Label>
                        </div>
                        <div className="flex items-center gap-3">
                            <Checkbox id="sello" checked={mostrarSello} onCheckedChange={(c) => setMostrarSello(c === true)} />
                            <Label htmlFor="sello" className="cursor-pointer text-sm">Mostrar sello</Label>
                        </div>
                    </div>
                </div>

                {/* Idiomas */}
                <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        🌍 Idiomas
                    </h2>

                    <div className="flex flex-wrap gap-4">
                        {['es', 'en', 'fr', 'de', 'pt'].map((lang) => (
                            <div key={lang} className="flex items-center gap-2">
                                <Checkbox
                                    id={`lang-${lang}`}
                                    checked={idiomas.includes(lang)}
                                    onCheckedChange={(c) => toggleIdioma(lang, c === true)}
                                />
                                <Label htmlFor={`lang-${lang}`} className="cursor-pointer uppercase font-medium">
                                    {lang}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Columna Derecha: Preview */}
            <div className="lg:sticky lg:top-6 h-fit">
                <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        👁️ Vista Previa en Tiempo Real
                    </h2>

                    <div className="aspect-[210/297] bg-white rounded-xl shadow-2xl overflow-hidden border">
                        <div className="p-6 text-xs">
                            {/* Logo preview */}
                            {logoUrl ? (
                                <div className={`mb-4 ${logoPosicion === 'centro' ? 'text-center' :
                                    logoPosicion === 'derecha' ? 'text-right' : 'text-left'
                                    }`}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={logoUrl}
                                        alt="Logo"
                                        style={{ width: `${logoAncho * 0.6}px`, height: `${logoAlto * 0.6}px` }}
                                        className="inline-block object-contain"
                                    />
                                </div>
                            ) : (
                                <div className={`mb-4 ${logoPosicion === 'centro' ? 'text-center' :
                                    logoPosicion === 'derecha' ? 'text-right' : 'text-left'
                                    }`}>
                                    <div className="inline-flex items-center justify-center w-20 h-10 bg-slate-200 rounded text-slate-400 text-[10px]">
                                        TU LOGO
                                    </div>
                                </div>
                            )}

                            {/* Header de factura */}
                            <div className="flex justify-between items-start mb-4 border-b pb-3">
                                <div>
                                    <p className="text-slate-500 text-[10px]">Facturar a:</p>
                                    <p className="font-semibold text-slate-800">Cliente Example SL</p>
                                    <p className="text-slate-500 text-[9px]">CIF: B12345678</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-base" style={{ color: colorPrimario }}>FACTURA</p>
                                    <p className="text-slate-600 text-[10px]">Nº FAC-2024-001</p>
                                    <p className="text-slate-500 text-[9px]">Fecha: 07/02/2024</p>
                                </div>
                            </div>

                            {/* Tabla de conceptos */}
                            <table className="w-full text-[9px] mb-4">
                                <thead>
                                    <tr style={{ backgroundColor: colorEncabezadoTabla }} className="text-white">
                                        <th className="p-2 text-left rounded-tl-lg">Concepto</th>
                                        <th className="p-2 text-center">Cant.</th>
                                        <th className="p-2 text-right">Precio</th>
                                        <th className="p-2 text-right rounded-tr-lg">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-600">
                                    <tr className={alternarColorFilas ? 'bg-slate-50' : ''}>
                                        <td className="p-2">Servicio Logístico</td>
                                        <td className="p-2 text-center">1</td>
                                        <td className="p-2 text-right">850,00€</td>
                                        <td className="p-2 text-right font-medium">850,00€</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2">Transporte Especial</td>
                                        <td className="p-2 text-center">2</td>
                                        <td className="p-2 text-right">150,00€</td>
                                        <td className="p-2 text-right font-medium">300,00€</td>
                                    </tr>
                                    <tr className={alternarColorFilas ? 'bg-slate-50' : ''}>
                                        <td className="p-2">Embalaje Premium</td>
                                        <td className="p-2 text-center">5</td>
                                        <td className="p-2 text-right">10,00€</td>
                                        <td className="p-2 text-right font-medium">50,00€</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Totales */}
                            <div className="flex justify-end">
                                <div className="w-1/2 text-right text-[10px] space-y-1">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Subtotal:</span>
                                        <span>1.200,00€</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>IVA (21%):</span>
                                        <span>252,00€</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-black pt-2 border-t" style={{ color: colorPrimario }}>
                                        <span>TOTAL:</span>
                                        <span>1.452,00€</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notas y datos bancarios */}
                            {mostrarNotas && (
                                <div className="mt-4 pt-3 border-t text-[9px] text-slate-500">
                                    <p className="font-semibold mb-1">Notas:</p>
                                    <p>Gracias por confiar en nuestros servicios.</p>
                                </div>
                            )}

                            {mostrarDatosBancarios && (
                                <div className="mt-3 pt-2 border-t text-[9px] text-slate-500">
                                    <p className="font-semibold mb-1">Datos bancarios:</p>
                                    <p>IBAN: ES12 1234 5678 90 0123456789</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                        className="flex-1 bg-white/5 border-white/10 hover:bg-white/10"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-linear-to-r from-primary to-primary/80 hover:scale-105 active:scale-95 transition-all duration-300 font-bold"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            isEditing ? 'Guardar Cambios' : 'Crear Plantilla'
                        )}
                    </Button>
                </div>
            </div>
        </form>
    )
}
