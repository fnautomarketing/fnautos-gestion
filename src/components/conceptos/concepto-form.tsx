'use client'

import { useState, useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Save, Calculator } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { conceptoSchema, type ConceptoFormData } from '@/lib/validations/concepto-schema'
import { crearConceptoAction, actualizarConceptoAction } from '@/app/actions/conceptos'
import { ConceptoCatalogo } from '@/types/ventas'

interface ConceptoFormProps {
    initialData?: Partial<ConceptoCatalogo> & { id?: string }
    isEditing?: boolean
}

export function ConceptoForm({ initialData, isEditing = false }: ConceptoFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // Default values
    const defaultValues: Partial<ConceptoFormData> = {
        codigo: initialData?.codigo || '',
        nombre: initialData?.nombre || '',
        descripcion: initialData?.descripcion || '',
        categoria: (initialData?.categoria as any) || 'otros',
        tipo: (initialData?.tipo as any) || 'servicio',
        precio_base: initialData?.precio_base || 0,
        iva_porcentaje: initialData?.iva_porcentaje || 21,
        unidad_medida: (initialData?.unidad_medida as any) || 'servicio',
        codigo_interno: initialData?.codigo_interno || '',
        proveedor: initialData?.proveedor || '',
        coste_interno: initialData?.coste_interno || 0,
        activo: initialData?.activo ?? true,
        destacado: initialData?.destacado ?? false,
        notas_internas: initialData?.notas_internas || '',
    }

    const form = useForm<ConceptoFormData>({
        resolver: zodResolver(conceptoSchema) as any,
        defaultValues,
    })

    // Watch values for live calculations
    // Watch values for live calculations
    const precioBase = useWatch({ control: form.control, name: 'precio_base' })
    const ivaPorcentaje = useWatch({ control: form.control, name: 'iva_porcentaje' })
    const precioTotal = (precioBase || 0) * (1 + (ivaPorcentaje || 0) / 100)

    async function onSubmit(data: ConceptoFormData) {
        startTransition(async () => {
            const formData = new FormData()

            // Append all fields
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, value.toString())
                }
            })

            try {
                if (isEditing && initialData?.id) {
                    const result = await actualizarConceptoAction(initialData.id, formData)
                    if (result.success) {
                        toast.success('Concepto actualizado correctamente')
                        router.push('/ventas/configuracion/conceptos')
                        router.refresh()
                    } else {
                        toast.error(result.error || 'Error al actualizar concepto')
                    }
                } else {
                    const result = await crearConceptoAction(formData)
                    if (result.success) {
                        toast.success('Concepto creado correctamente')
                        router.push('/ventas/configuracion/conceptos')
                        router.refresh()
                    } else {
                        toast.error(result.error || 'Error al crear concepto')
                    }
                }
            } catch (error) {
                toast.error('Ocurrió un error inesperado')
                console.error(error)
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div>
                        <Button
                            type="button"
                            variant="ghost"
                            className="mb-2 pl-0 hover:pl-2 transition-all"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver al listado
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {isEditing ? `Editar Concepto: ${initialData?.codigo}` : 'Nuevo Concepto'}
                        </h1>
                        <p className="text-muted-foreground">
                            {isEditing
                                ? 'Modifica los detalles del servicio o producto.'
                                : 'Añade un nuevo servicio o producto al catálogo.'}
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isPending}
                            className="flex-1 sm:flex-none"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg flex-1 sm:flex-none"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Concepto
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información Principal</CardTitle>
                                <CardDescription>Detalles básicos del concepto para su identificación.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="codigo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Código</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Automático si se deja vacío" {...field} value={field.value || ''} disabled={isEditing} />
                                                </FormControl>
                                                <FormDescription>Identificador único (ej. SRV-001)</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="nombre"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre del Concepto</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej. Consultoría Informática" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="descripcion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descripción</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Detalles adicionales que aparecerán en la factura..."
                                                    className="resize-none min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="categoria"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Categoría</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecciona categoría" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="transporte">Transporte</SelectItem>
                                                        <SelectItem value="almacenaje">Almacenaje</SelectItem>
                                                        <SelectItem value="logistica">Logística</SelectItem>
                                                        <SelectItem value="material">Material</SelectItem>
                                                        <SelectItem value="otros">Otros</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="tipo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Tipo" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="servicio">Servicio</SelectItem>
                                                        <SelectItem value="producto">Producto</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="unidad_medida"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Unidad</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Unidad" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="servicio">Servicio</SelectItem>
                                                        <SelectItem value="hora">Hora</SelectItem>
                                                        <SelectItem value="dia">Día</SelectItem>
                                                        <SelectItem value="unidad">Unidad</SelectItem>
                                                        <SelectItem value="kg">Kg</SelectItem>
                                                        <SelectItem value="m2">m²</SelectItem>
                                                        <SelectItem value="m3">m³</SelectItem>
                                                        <SelectItem value="km">Km</SelectItem>
                                                        <SelectItem value="otro">Otro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Datos Internos (Opcional)</CardTitle>
                                <CardDescription>Información para gestión interna, no visible en factura.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="codigo_interno"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cód. Interno</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="REF-INT-001" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="proveedor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Proveedor</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nombre del proveedor" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="coste_interno"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Coste Interno (€)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        {...field}
                                                        onChange={e => field.onChange(parseFloat(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="notas_internas"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Notas Internas</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Apuntes para el equipo..."
                                                    className="resize-none h-20"
                                                    {...field}
                                                    value={field.value || ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Pricing & Status */}
                    <div className="space-y-6">
                        <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calculator className="h-5 w-5 text-primary" />
                                    Precio y Valuación
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="precio_base"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Precio Base (€)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    className="text-lg font-semibold"
                                                    {...field}
                                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="iva_porcentaje"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>IVA (%)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="100"
                                                    {...field}
                                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Separator className="my-2" />

                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm font-medium text-slate-500">Precio Final (Inc. IVA)</span>
                                    <span className="text-2xl font-bold text-primary">
                                        {precioTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 text-center">Este es el precio que verá el cliente</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Estado y Visibilidad</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="activo"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                    Activo
                                                </FormLabel>
                                                <FormDescription>
                                                    Visible en el selector de facturas.
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="destacado"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                    Destacado
                                                </FormLabel>
                                                <FormDescription>
                                                    Aparece al inicio de las listas.
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </Form>
    )
}
