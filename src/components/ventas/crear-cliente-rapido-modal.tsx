'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Building2, User } from 'lucide-react'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { crearClienteAction } from '@/app/actions/clientes'
import { validarCIF } from '@/lib/utils/cif-validator'

interface CrearClienteRapidoModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    empresasIds: string[] // Se asume que vendrá la lista de empresas de la sesión para compartirlas
    onClienteCreado: (clienteId: string, clienteNombre: string, clienteCif: string) => void
}

export function CrearClienteRapidoModal({
    open,
    onOpenChange,
    empresasIds,
    onClienteCreado
}: CrearClienteRapidoModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [cifValido, setCifValido] = useState(false)

    // Valores del formulario manejados vía controlada o no controlada, usaremos FormData para simplicidad y match con el action
    const [cif, setCif] = useState('')

    const handleCifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setCif(value)
        setCifValido(validarCIF(value))
    }

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!cifValido) {
            toast.error('El CIF/NIF introducido no es válido')
            document.getElementById('cif_rapido')?.focus()
            return
        }

        setIsSubmitting(true)
        const form = e.currentTarget
        const formData = new FormData(form)

        // Añadir valores ocultos y obligatorios para el Action
        formData.append('compartido', 'true') // Lo hacemos común por simplicidad en creación rápida
        if (empresasIds.length > 0) {
            formData.append('empresas_ids', empresasIds.join(','))
        }
        formData.append('activo', 'on')
        // El resto toma valores por defecto en el schema del lado del cliente/servidor.

        try {
            const result = await crearClienteAction(formData)
            
            if (result.success && result.data) {
                toast.success('Cliente creado correctamente')
                onClienteCreado(result.data.id, result.data.nombre_fiscal, result.data.cif)
                onOpenChange(false)
                // Limpiar form
                form.reset()
                setCif('')
                setCifValido(false)
            } else {
                toast.error(result.error as string || 'Error al crear cliente')
            }
        } catch (error) {
            console.error('Error en CrearClienteRapidoModal:', error)
            toast.error('Ocurrió un error inesperado al intentar guardar')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Plus className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">Crear Cliente Rápido</DialogTitle>
                            <DialogDescription>
                                Introduce los datos esenciales para facturar. Podrás completar el resto en la ficha del cliente más tarde.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <Label htmlFor="cif_rapido">NIF/CIF *</Label>
                            <div className="relative">
                                <Input
                                    id="cif_rapido"
                                    name="cif"
                                    value={cif}
                                    onChange={handleCifChange}
                                    required
                                    className={cifValido ? 'border-green-500/50 focus:border-green-500 pr-8' : ''}
                                    placeholder="B12345678"
                                    disabled={isSubmitting}
                                />
                                {cifValido && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none">
                                        ✓
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <Label htmlFor="tipo_cliente_rapido">Tipo de Cliente</Label>
                            <Select name="tipo_cliente" defaultValue="empresa" disabled={isSubmitting}>
                                <SelectTrigger id="tipo_cliente_rapido">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="empresa"><div className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Empresa</div></SelectItem>
                                    <SelectItem value="autonomo"><div className="flex items-center gap-2"><User className="w-4 h-4" /> Autónomo</div></SelectItem>
                                    <SelectItem value="particular"><div className="flex items-center gap-2"><User className="w-4 h-4" /> Particular</div></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="nombre_fiscal_rapido">Razón Social *</Label>
                            <Input
                                id="nombre_fiscal_rapido"
                                name="nombre_fiscal"
                                required
                                placeholder="Nombre completo o Razón Social"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="email_principal_rapido">Email Principal *</Label>
                            <Input
                                id="email_principal_rapido"
                                name="email_principal"
                                type="email"
                                required
                                placeholder="facturacion@empresa.com"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-2 space-y-2">
                            <Label htmlFor="direccion_rapida">Dirección *</Label>
                            <Input
                                id="direccion_rapida"
                                name="direccion"
                                required
                                placeholder="Calle, número, piso..."
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <Label htmlFor="codigo_postal_rapido">Código Postal *</Label>
                            <Input
                                id="codigo_postal_rapido"
                                name="codigo_postal"
                                required
                                maxLength={5}
                                pattern="[0-9]{5}"
                                placeholder="28001"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <Label htmlFor="ciudad_rapida">Ciudad *</Label>
                            <Input
                                id="ciudad_rapida"
                                name="ciudad"
                                required
                                placeholder="Madrid"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-primary/90 text-white font-bold px-6 shadow-md shadow-primary/20"
                        >
                            {isSubmitting ? 'Creando...' : 'Crear y Seleccionar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
