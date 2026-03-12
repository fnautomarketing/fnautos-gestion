'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { crearSerieAction, actualizarSerieAction } from '@/app/actions/series'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Serie } from '@/types/ventas'

interface SerieFormProps {
    serieId?: string
    defaultValues?: Partial<Serie>
}

/**
 * Formulario para creación y edición de series de facturación.
 * Incluye previsualización en tiempo real y validaciones de negocio.
 */
export function SerieForm({ serieId, defaultValues }: SerieFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [preview, setPreview] = useState('')

    // Real-time preview effect
    useEffect(() => {
        const generatePreview = () => {
            const form = document.getElementById('serie-form') as HTMLFormElement
            if (!form) return

            const prefijo = (form.elements.namedItem('prefijo') as HTMLInputElement).value || ''
            const digitosValue = (form.elements.namedItem('digitos_hidden') as HTMLInputElement)?.value || '3'
            const digitos = Number(digitosValue) || 3
            const sufijo = (form.elements.namedItem('sufijo') as HTMLInputElement).value || ''
            const numero = '1'.padStart(digitos, '0')
            setPreview(`${prefijo}${numero}${sufijo}`)
        }

        generatePreview()
        const timer = setInterval(generatePreview, 1000) // Polling preview because Select changes are hard to track directly without full state
        return () => clearInterval(timer)
    }, [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)

        const result = serieId
            ? await actualizarSerieAction(serieId, formData)
            : await crearSerieAction(formData)

        setIsSubmitting(false)

        if (result.success) {
            toast.success(serieId ? 'Serie actualizada' : 'Serie creada correctamente')
            router.push('/ventas/configuracion/series')
            router.refresh()
        } else {
            toast.error(result.error || 'Error al procesar la solicitud')
        }
    }

    return (
        <form id="serie-form" onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-white/5 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden border-white/10">
                <CardContent className="p-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Campo: Código */}
                        <div className="space-y-2">
                            <Label htmlFor="codigo" className="text-slate-300 font-bold">Código de Serie *</Label>
                            <Input
                                id="codigo"
                                name="codigo"
                                defaultValue={defaultValues?.codigo}
                                placeholder="Ej: FAC-2026"
                                required
                                className="bg-white/5 border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 h-12 uppercase font-mono tracking-widest"
                            />
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Identificador único (letras, números y guiones)</p>
                        </div>

                        {/* Campo: Icono */}
                        <div className="space-y-2">
                            <Label className="text-slate-300 font-bold">Icono Visual</Label>
                            <Select name="icono" defaultValue={defaultValues?.icono || '📄'}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-slate-900 dark:text-white h-12">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a2332] border-white/10 text-slate-200">
                                    <SelectItem value="📄">📄 Factura General</SelectItem>
                                    <SelectItem value="🔄">🔄 Rectificativa</SelectItem>
                                    <SelectItem value="🌍">🌍 Exportación</SelectItem>
                                    <SelectItem value="📦">📦 Proforma</SelectItem>
                                    <SelectItem value="💼">💼 Otros</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Campo: Nombre */}
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="nombre" className="text-slate-300 font-bold">Nombre descriptivo *</Label>
                            <Input
                                id="nombre"
                                name="nombre"
                                defaultValue={defaultValues?.nombre}
                                placeholder="Ej: Serie Principal - Mercado Nacional"
                                required
                                className="bg-white/5 border-white/10 text-slate-900 dark:text-white h-12"
                            />
                        </div>

                        {/* Formato de Numeración */}
                        <div className="md:col-span-2">
                            <h3 className="text-primary font-black uppercase tracking-[0.2em] text-xs mb-6 flex items-center gap-2">
                                <span className="h-px w-8 bg-primary/30" />
                                Reglas de Numeración
                                <span className="h-px flex-1 bg-primary/30" />
                            </h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="prefijo" className="text-slate-400 text-xs uppercase font-bold">Prefijo</Label>
                                    <Input
                                        id="prefijo"
                                        name="prefijo"
                                        defaultValue={defaultValues?.prefijo || ''}
                                        placeholder="FAC26-"
                                        className="bg-white/5 border-white/10 text-slate-900 dark:text-white h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sufijo" className="text-slate-400 text-xs uppercase font-bold">Sufijo</Label>
                                    <Input
                                        id="sufijo"
                                        name="sufijo"
                                        defaultValue={defaultValues?.sufijo || ''}
                                        placeholder="/A"
                                        className="bg-white/5 border-white/10 text-slate-900 dark:text-white h-11"
                                    />
                                </div>
                                <div className="space-y-2 text-center md:text-left">
                                    <Label className="text-slate-400 text-xs uppercase font-bold">Ceros a la izquierda</Label>
                                    {/* Shadow input for select value to work with vanilla preview logic */}
                                    <input type="hidden" name="digitos_hidden" id="digitos_hidden" value={defaultValues?.digitos || 3} />
                                    <Select name="digitos" defaultValue={String(defaultValues?.digitos || 3)} onValueChange={(v) => {
                                        const hidden = document.getElementById('digitos_hidden') as HTMLInputElement
                                        if (hidden) hidden.value = v
                                    }}>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-slate-900 dark:text-white h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1a2332] border-white/10 text-slate-200">
                                            <SelectItem value="3">001 (3)</SelectItem>
                                            <SelectItem value="4">0001 (4)</SelectItem>
                                            <SelectItem value="5">00001 (5)</SelectItem>
                                            <SelectItem value="1">1 (Sin ceros)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Preview Section */}
                        <div className="md:col-span-2">
                            <div className={cn(
                                "p-6 rounded-2xl border transition-all duration-500",
                                preview ? "bg-primary/10 border-primary/20 scale-[1.02]" : "bg-white/5 border-white/10 grayscale"
                            )}>
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-[10px] text-primary uppercase font-black tracking-widest">Ejemplo de Formato</p>
                                    <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">Previsualización en tiempo real</Badge>
                                </div>
                                <p className="text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tighter shadow-sm">{preview || '---'}</p>
                            </div>
                        </div>

                        {/* Config Adicional */}
                        <div className="space-y-2">
                            <Label htmlFor="tipo" className="text-slate-300 font-bold">Tipo de Serie</Label>
                            <Select name="tipo" defaultValue={defaultValues?.tipo || 'general'}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-slate-900 dark:text-white h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a2332] border-white/10 text-slate-200">
                                    <SelectItem value="general">General</SelectItem>
                                    <SelectItem value="rectificativa">Rectificativa</SelectItem>
                                    <SelectItem value="exportacion">Exportación</SelectItem>
                                    <SelectItem value="proforma">Proforma</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reseteo" className="text-slate-300 font-bold">Frecuencia de Reseteo</Label>
                            <Select name="reseteo" defaultValue={defaultValues?.reseteo || 'anual'}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-slate-900 dark:text-white h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a2332] border-white/10 text-slate-200">
                                    <SelectItem value="nunca">Nunca (Consecutivo eterno)</SelectItem>
                                    <SelectItem value="anual">Anual (Cada 1 de Enero)</SelectItem>
                                    <SelectItem value="manual">Manual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="numero_inicial" className="text-slate-300 font-bold">Contador Inicial</Label>
                            <Input
                                type="number"
                                id="numero_inicial"
                                name="numero_inicial"
                                defaultValue={defaultValues?.numero_inicial || 1}
                                min="1"
                                required
                                className="bg-white/5 border-white/10 text-slate-900 dark:text-white h-11"
                            />
                            <p className="text-xs text-slate-500 mt-1">Número desde el que se resetea (ej. 1 = 001)</p>
                        </div>

                        {serieId && (
                            <div>
                                <Label htmlFor="numero_actual" className="text-slate-300 font-bold">Próximo número (edición manual)</Label>
                                <Input
                                    type="number"
                                    id="numero_actual"
                                    name="numero_actual"
                                    defaultValue={defaultValues?.numero_actual ?? defaultValues?.numero_inicial ?? 1}
                                    min="1"
                                    className="bg-white/5 border-white/10 text-slate-900 dark:text-white h-11"
                                />
                                <p className="text-xs text-slate-500 mt-1">No puede ser menor al último número ya emitido (Verifactu)</p>
                            </div>
                        )}

                        <div className="flex flex-col gap-4 pt-4 border-t border-white/5 md:col-span-2">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="space-y-1">
                                    <Label htmlFor="activa" className="text-slate-900 dark:text-white font-bold cursor-pointer">Serie Activa</Label>
                                    <p className="text-xs text-slate-500">Permite usar esta serie en nuevas facturas</p>
                                </div>
                                <Switch id="activa" name="activa" defaultChecked={defaultValues?.activa !== false} className="data-[state=checked]:bg-primary" />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="space-y-1">
                                    <Label htmlFor="predeterminada" className="text-slate-900 dark:text-white font-bold cursor-pointer">Serie Predeterminada</Label>
                                    <p className="text-xs text-slate-500">Se seleccionará automáticamente al crear documentos</p>
                                </div>
                                <Switch id="predeterminada" name="predeterminada" defaultChecked={defaultValues?.predeterminada} className="data-[state=checked]:bg-amber-500" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4 pb-10">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                    className="text-slate-400 hover:text-slate-900 dark:text-white"
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 px-10 bg-linear-to-r from-primary to-amber-600 hover:scale-105 active:scale-95 transition-all duration-300 font-bold rounded-xl shadow-xl shadow-primary/20"
                >
                    {isSubmitting ? 'Procesando...' : serieId ? 'Actualizar Serie' : 'Crear Nueva Serie'}
                </Button>
            </div>
        </form>
    )
}
