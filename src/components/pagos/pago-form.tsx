'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { pagoSchema, PagoFormData } from '@/lib/validations/pago-schema'
import { registrarPagoAction } from '@/app/actions/pagos'

interface PagoFormProps {
    facturas: any[]
}

export function PagoForm({ facturas }: PagoFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedFactura, setSelectedFactura] = useState<any>(null)

    const form = useForm<PagoFormData>({
        resolver: zodResolver(pagoSchema),
        defaultValues: {
            factura_id: '',
            importe: 0,
            fecha_pago: new Date().toISOString().split('T')[0],
            metodo_pago: 'transferencia',
            conciliado: false,
        },
    })

    // Update selected factura details when changed
    const handleFacturaChange = (facturaId: string) => {
        const factura = facturas.find(f => f.id === facturaId)
        setSelectedFactura(factura)
        form.setValue('factura_id', facturaId)

        // Set max importe based on pending amount
        if (factura) {
            const pendiente = factura.total - (factura.pagado || 0)
            form.setValue('importe', Number(pendiente.toFixed(2)))
        }
    }

    const onSubmit = async (data: PagoFormData) => {
        setIsSubmitting(true)
        try {
            const formData = new FormData()
            Object.entries(data).forEach(([key, value]) => {
                if (key === 'conciliado') {
                    formData.append(key, value ? 'true' : 'false')
                } else {
                    formData.append(key, String(value))
                }
            })

            const result = await registrarPagoAction(formData)

            if (result.success) {
                toast.success('Pago registrado correctamente')
                router.push('/ventas/pagos')
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (_error) {
            toast.error('Error al registrar pago')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Factura Select */}
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="factura_id">Factura Pendiente</Label>
                    <Select onValueChange={handleFacturaChange} value={form.watch('factura_id')}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona una factura..." />
                        </SelectTrigger>
                        <SelectContent>
                            {facturas.map((factura) => (
                                <SelectItem key={factura.id} value={factura.id}>
                                    {factura.serie}-{factura.numero} - {factura.cliente?.nombre_fiscal} (Pendiente: {(factura.total - (factura.pagado || 0)).toFixed(2)}€)
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {form.formState.errors.factura_id && (
                        <p className="text-sm text-red-500">{form.formState.errors.factura_id.message}</p>
                    )}
                </div>

                {/* Importe */}
                <div className="space-y-2">
                    <Label htmlFor="importe">Importe (€)</Label>
                    <Input
                        {...form.register('importe', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                    />
                    {selectedFactura && (
                        <p className="text-xs text-slate-500">
                            Máximo sugerido: {(selectedFactura.total - (selectedFactura.pagado || 0)).toFixed(2)}€
                        </p>
                    )}
                    {form.formState.errors.importe && (
                        <p className="text-sm text-red-500">{form.formState.errors.importe.message}</p>
                    )}
                </div>

                {/* Fecha Pago */}
                <div className="space-y-2">
                    <Label htmlFor="fecha_pago">Fecha de Pago</Label>
                    <Input
                        {...form.register('fecha_pago')}
                        type="date"
                    />
                    {form.formState.errors.fecha_pago && (
                        <p className="text-sm text-red-500">{form.formState.errors.fecha_pago.message}</p>
                    )}
                </div>

                {/* Metodo Pago */}
                <div className="space-y-2">
                    <Label htmlFor="metodo_pago">Método de Pago</Label>
                    <Select
                        onValueChange={(val) => form.setValue('metodo_pago', val as any)}
                        value={form.watch('metodo_pago')}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona método" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                            <SelectItem value="tarjeta">Tarjeta Crédito/Débito</SelectItem>
                            <SelectItem value="efectivo">Efectivo</SelectItem>
                            <SelectItem value="domiciliacion">Domiciliación</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Referencia */}
                <div className="space-y-2">
                    <Label htmlFor="referencia">Referencia / Nº Operación</Label>
                    <Input {...form.register('referencia')} placeholder="Ej: TRF-123456789" />
                </div>

                {/* Cuenta Bancaria */}
                <div className="space-y-2">
                    <Label htmlFor="cuenta_bancaria">Cuenta Bancaria (Opcional)</Label>
                    <Input {...form.register('cuenta_bancaria')} placeholder="ES12..." />
                </div>

                {/* Conciliado */}
                <div className="flex items-center space-x-2 pt-8">
                    <Checkbox
                        id="conciliado"
                        checked={form.watch('conciliado')}
                        onCheckedChange={(checked) => form.setValue('conciliado', checked === true)}
                    />
                    <Label htmlFor="conciliado" className="font-medium cursor-pointer">
                        Marcar como conciliado
                    </Label>
                </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
                <Label htmlFor="notas">Notas / Observaciones</Label>
                <Textarea {...form.register('notas')} placeholder="Añadir notas sobre el pago..." />
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-linear-to-r from-primary to-yellow-600 hover:scale-105 transition-all text-white font-bold"
                >
                    {isSubmitting ? 'Registrando...' : 'Registrar Pago'}
                </Button>
            </div>
        </form>
    )
}
