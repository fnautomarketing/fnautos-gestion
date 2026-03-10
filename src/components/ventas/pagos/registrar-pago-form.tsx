'use client'

import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { registrarPagoAction } from '@/app/actions/pagos'

// Schema dinámico según pendiente
const createFormSchema = (pendienteActual: number) => z.object({
    importe: z.number()
        .min(0.01, 'El importe debe ser mayor a 0')
        .max(pendienteActual + 0.01, `El importe no puede exceder el pendiente (${pendienteActual.toFixed(2)}€)`),
    fecha_pago: z.date(),
    metodo_pago: z.string().min(1, 'Selecciona un método'),
    referencia: z.string().optional(),
    asignacion: z.enum(['total', 'parcial']),
    notas: z.string().optional(),
    marcar_como_pagada: z.boolean(),
})

type FormValues = z.infer<ReturnType<typeof createFormSchema>>

interface RegistrarPagoFormProps {
    facturaId: string
    empresaId: string
    pendienteActual: number
    onImporteChange: (val: number) => void
}

export function RegistrarPagoForm({ facturaId, empresaId, pendienteActual, onImporteChange }: RegistrarPagoFormProps) {
    const router = useRouter()
    const [sending, setSending] = useState(false)

    // Form setup (schema dinámico con pendiente actual)
    const form = useForm<FormValues>({
        resolver: zodResolver(createFormSchema(pendienteActual)),
        defaultValues: {
            importe: pendienteActual, // Default to full payment
            fecha_pago: new Date(),
            metodo_pago: 'Transferencia',
            referencia: '',
            asignacion: 'total',
            notas: '',
            marcar_como_pagada: true,
        }
    })

    // Watch values to update UI logic
    // Watch values to update UI logic
    const importe = useWatch({ control: form.control, name: 'importe' })
    const asignacion = useWatch({ control: form.control, name: 'asignacion' })
    const fechaPago = useWatch({ control: form.control, name: 'fecha_pago' })

    // Lift state up for the sidebar preview
    useEffect(() => {
        onImporteChange(importe || 0)
    }, [importe, onImporteChange])

    // Auto-switch assignment mode based on amount vs pending
    useEffect(() => {
        if (importe !== undefined) {
            // Tolerance for floating point
            if (importe >= pendienteActual - 0.01) {
                form.setValue('asignacion', 'total')
                form.setValue('marcar_como_pagada', true)
            } else {
                form.setValue('asignacion', 'parcial')
                form.setValue('marcar_como_pagada', false)
            }
        }
    }, [importe, pendienteActual, form])

    async function onSubmit(data: FormValues) {
        setSending(true)
        const formData = new FormData()
        formData.append('factura_id', facturaId)
        formData.append('importe', data.importe.toString())
        formData.append('fecha_pago', format(data.fecha_pago, 'yyyy-MM-dd'))
        formData.append('metodo_pago', data.metodo_pago)
        if (data.referencia) formData.append('referencia', data.referencia)
        if (data.notas) formData.append('notas', data.notas)
        formData.append('marcar_como_pagada', data.marcar_como_pagada.toString())

        const result = await registrarPagoAction(formData)

        if (result.success) {
            toast.success('Pago registrado correctamente')
            router.push(`/ventas/facturas/${facturaId}`)
        } else {
            toast.error(result.error)
            setSending(false)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Datos del Pago</CardTitle>
                    <CardDescription>Introduce los detalles del cobro recibido</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Importe */}
                        <div className="space-y-2">
                            <Label>Importe del Pago</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500 font-bold">€</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="pl-8 text-lg font-bold"
                                    {...form.register('importe', { valueAsNumber: true })}
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                Importe pendiente: <span className="font-medium">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(pendienteActual)}</span>
                            </p>
                            {form.formState.errors.importe && (
                                <p className="text-xs text-red-500">{form.formState.errors.importe.message}</p>
                            )}
                        </div>

                        {/* Fecha */}
                        <div className="space-y-2 flex flex-col">
                            <Label>Fecha de Pago</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !fechaPago && "text-muted-foreground"
                                        )}
                                    >
                                        {form.watch('fecha_pago') ? (
                                            format(form.watch('fecha_pago'), "dd/MM/yyyy")
                                        ) : (
                                            <span>Seleccionar fecha</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={form.watch('fecha_pago')}
                                        onSelect={(date) => date && form.setValue('fecha_pago', date)}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Metodo Pago */}
                    <div className="space-y-2">
                        <Label>Método de Pago</Label>
                        <Select
                            onValueChange={(val) => form.setValue('metodo_pago', val)}
                            defaultValue={form.watch('metodo_pago')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona método" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Transferencia">Transferencia Bancaria</SelectItem>
                                <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                                <SelectItem value="Efectivo">Efectivo</SelectItem>
                                <SelectItem value="Domiciliacion">Domiciliación</SelectItem>
                                <SelectItem value="Cheque">Cheque</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Referencia */}
                    <div className="space-y-2">
                        <Label>Referencia de Pago</Label>
                        <Input
                            placeholder="Ej. Transferencia Ref: 123456"
                            {...form.register('referencia')}
                        />
                    </div>

                    {/* Asignacion */}
                    <div className="space-y-3 pt-2">
                        <Label>Tipo de Asignación</Label>
                        <RadioGroup
                            value={asignacion}
                            onValueChange={(val: 'total' | 'parcial') => form.setValue('asignacion', val)}
                            className="flex gap-4"
                        >
                            <div className={`flex items-center space-x-2 border rounded-lg p-3 flex-1 cursor-pointer transition-colors ${asignacion === 'total' ? 'border-primary bg-primary/5' : 'border-slate-200'}`}>
                                <RadioGroupItem value="total" id="r1" />
                                <Label htmlFor="r1" className="cursor-pointer">Pago Total (Liquida factura)</Label>
                            </div>
                            <div className={`flex items-center space-x-2 border rounded-lg p-3 flex-1 cursor-pointer transition-colors ${asignacion === 'parcial' ? 'border-primary bg-primary/5' : 'border-slate-200'}`}>
                                <RadioGroupItem value="parcial" id="r2" />
                                <Label htmlFor="r2" className="cursor-pointer">Pago Parcial</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notas Internas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="Añade cualquier nota relevante sobre este cobro..."
                        className="min-h-[100px]"
                        {...form.register('notas')}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Opciones Post-Pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Only show "Mark as paid" checkbox if partial payment, otherwise it's auto-checked/hidden-but-true */}
                    {asignacion === 'total' && (
                        <div className="flex items-center space-x-2 p-3 bg-green-50 text-green-700 rounded-lg border border-green-100">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-sm font-medium">La factura se marcará automáticamente como PAGADA.</span>
                        </div>
                    )}

                    {asignacion === 'parcial' && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="markPaid"
                                checked={form.watch('marcar_como_pagada')}
                                onCheckedChange={(chk) => form.setValue('marcar_como_pagada', !!chk)}
                            />
                            <label
                                htmlFor="markPaid"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Marcar factura como Pagada (forzar cierre)
                            </label>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pb-10">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={sending} className="min-w-[200px] text-lg h-12">
                    {sending ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Registrando...
                        </>
                    ) : (
                        'Guardar Pago'
                    )}
                </Button>
            </div>
        </form>
    )
}
