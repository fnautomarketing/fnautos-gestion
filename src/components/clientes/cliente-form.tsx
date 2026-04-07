'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { crearClienteAction, actualizarClienteAction } from '@/app/actions/clientes'
import { validarCIF } from '@/lib/utils/cif-validator'

import { ClienteFormData } from '@/lib/validations/cliente-schema'

export interface EmpresaOption {
    id: string
    razon_social: string
    nombre_comercial?: string | null
}

interface ClienteFormProps {
    clienteId?: string
    defaultValues?: Partial<ClienteFormData> & { id?: string }
    empresas: EmpresaOption[]
    empresasCliente?: string[]
}

export function ClienteForm({ clienteId, defaultValues, empresas, empresasCliente = [] }: ClienteFormProps) {
    const router = useRouter()
    const [cifValido, setCifValido] = useState(!!defaultValues?.cif)
    const [isLoading, setIsLoading] = useState(false)

    const isComunDefault = empresasCliente.length === 0 || empresasCliente.length >= empresas.length
    const [isComun, setIsComun] = useState(isComunDefault)
    const [empresasSeleccionadas, setEmpresasSeleccionadas] = useState<string[]>(
        isComunDefault ? empresas.map(e => e.id) : empresasCliente
    )
    const [activo, setActivo] = useState(defaultValues?.activo !== false)

    const handleCifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cif = e.target.value
        setCifValido(validarCIF(cif))
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)
        const cif = formData.get('cif') as string

        if (!validarCIF(cif)) {
            toast.error('El CIF/NIF introducido no es válido')
            document.getElementById('cif')?.focus()
            return
        }

        const idsFinal = isComun ? empresas.map(e => e.id) : empresasSeleccionadas
        if (idsFinal.length === 0) {
            toast.error('Selecciona al menos una empresa')
            return
        }

        setIsLoading(true)

        formData.set('compartido', isComun ? 'true' : 'false')
        formData.set('empresas_ids', idsFinal.join(','))
        formData.set('activo', activo ? 'on' : '')

        try {
            const result = clienteId
                ? await actualizarClienteAction(clienteId, formData)
                : await crearClienteAction(formData)

            if (result.success) {
                toast.success(clienteId ? 'Cliente actualizado' : 'Cliente creado')
                // Usar replace para evitar volver al formulario con "atrás" y forzar recarga
                router.refresh()
                router.push('/ventas/clientes')
            } else {
                toast.error(result.error as string)
                setIsLoading(false)
            }
        } catch (error) {
            console.error('Error al guardar cliente:', error)
            toast.error('Ocurrió un error inesperado')
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Columna principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Datos Fiscales */}
                    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold flex items-center gap-2">🏢 Datos Fiscales</h2>
                        </div>

                        <div className="rounded-lg bg-white/5 p-4 space-y-3 border border-white/10">
                            <Label className="text-sm font-medium">Empresas para este cliente</Label>
                            <div className="flex flex-col gap-2">
                                <label data-testid="cliente-empresas-comun" className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="modo_empresas"
                                        checked={isComun}
                                        onChange={() => setIsComun(true)}
                                        className="rounded-full border-white/20"
                                    />
                                    <span className="text-sm">Común para todas las empresas</span>
                                </label>
                                <label data-testid="cliente-empresas-seleccion" className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="modo_empresas"
                                        checked={!isComun}
                                        onChange={() => {
                                            setIsComun(false)
                                            if (empresasSeleccionadas.length === 0) setEmpresasSeleccionadas(empresas.map(e => e.id))
                                        }}
                                        className="rounded-full border-white/20"
                                    />
                                    <span className="text-sm">Solo para empresas seleccionadas</span>
                                </label>
                            </div>
                            {!isComun && (
                                <div className="flex flex-wrap gap-3 pl-6 mt-2" data-testid="cliente-empresas-checkboxes">
                                    {empresas.map((emp) => (
                                        <label key={emp.id} data-testid={`cliente-empresa-${emp.id}`} className="flex items-center gap-2 cursor-pointer">
                                            <Checkbox
                                                checked={empresasSeleccionadas.includes(emp.id)}
                                                onCheckedChange={(checked) => {
                                                    setEmpresasSeleccionadas(prev =>
                                                        checked ? [...prev, emp.id] : prev.filter(id => id !== emp.id)
                                                    )
                                                }}
                                            />
                                            <span className="text-sm">{emp.nombre_comercial || emp.razon_social}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cif">NIF/CIF *</Label>
                                <div className="relative">
                                    <Input
                                        id="cif"
                                        name="cif"
                                        defaultValue={defaultValues?.cif}
                                        required
                                        onChange={handleCifChange}
                                        className={cifValido ? 'border-green-500/50 focus:border-green-500 pr-10 h-11 md:h-10 text-base md:text-sm' : 'h-11 md:h-10 text-base md:text-sm'}
                                        placeholder="B12345678"
                                    />
                                    {cifValido && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none">
                                            ✓
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nombre_fiscal">Razón Social *</Label>
                                <Input
                                    id="nombre_fiscal"
                                    name="nombre_fiscal"
                                    defaultValue={defaultValues?.nombre_fiscal}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="tipo_cliente">Tipo de Cliente</Label>
                                <Select name="tipo_cliente" defaultValue={defaultValues?.tipo_cliente || 'empresa'}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="empresa">Empresa</SelectItem>
                                        <SelectItem value="autonomo">Autónomo</SelectItem>
                                        <SelectItem value="particular">Particular</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Contacto */}
                    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">📧 Información de Contacto</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="email_principal">Email Principal *</Label>
                                <Input type="email" id="email_principal" name="email_principal" defaultValue={defaultValues?.email_principal} required className="h-11 md:h-10 text-base md:text-sm" />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email_secundario">Email Secundario</Label>
                                <Input type="email" id="email_secundario" name="email_secundario" defaultValue={defaultValues?.email_secundario} className="h-11 md:h-10 text-base md:text-sm" />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="telefono_principal">Teléfono Principal</Label>
                                <Input type="tel" id="telefono_principal" name="telefono_principal" defaultValue={defaultValues?.telefono_principal} className="h-11 md:h-10 text-base md:text-sm" />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="telefono_secundario">Teléfono Secundario</Label>
                                <Input type="tel" id="telefono_secundario" name="telefono_secundario" defaultValue={defaultValues?.telefono_secundario} className="h-11 md:h-10 text-base md:text-sm" />
                            </div>

                            <div className="sm:col-span-2">
                                <Label htmlFor="persona_contacto">Persona de Contacto</Label>
                                <Input id="persona_contacto" name="persona_contacto" defaultValue={defaultValues?.persona_contacto} />
                            </div>
                        </div>
                    </div>

                    {/* Dirección */}
                    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">📍 Dirección Fiscal</h2>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <Label htmlFor="direccion">Dirección *</Label>
                                <Input id="direccion" name="direccion" defaultValue={defaultValues?.direccion} required />
                            </div>

                            <div>
                                <Label htmlFor="codigo_postal">Código Postal *</Label>
                                <Input id="codigo_postal" name="codigo_postal" defaultValue={defaultValues?.codigo_postal} maxLength={5} required />
                            </div>

                            <div>
                                <Label htmlFor="ciudad">Ciudad *</Label>
                                <Input id="ciudad" name="ciudad" defaultValue={defaultValues?.ciudad} required />
                            </div>

                            <div>
                                <Label htmlFor="provincia">Provincia</Label>
                                <Input id="provincia" name="provincia" defaultValue={defaultValues?.provincia} />
                            </div>

                            <div>
                                <Label htmlFor="pais">País</Label>
                                <Input id="pais" name="pais" defaultValue={defaultValues?.pais || 'España'} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna lateral */}
                <div className="space-y-6">
                    {/* Configuración Comercial */}
                    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">⚙️ Configuración Comercial</h2>

                        <div>
                            <Label htmlFor="forma_pago_predeterminada">Forma de Pago</Label>
                            <Select name="forma_pago_predeterminada" defaultValue={defaultValues?.forma_pago_predeterminada || 'transferencia_30'}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="transferencia">Transferencia</SelectItem>
                                    <SelectItem value="domiciliación">Domiciliación</SelectItem>
                                    <SelectItem value="efectivo">Efectivo</SelectItem>
                                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {/* (Se eliminó el campo de días de vencimiento) */}

                            <div>
                                <Label htmlFor="descuento_comercial">Descuento %</Label>
                                <Input type="number" id="descuento_comercial" name="descuento_comercial" defaultValue={defaultValues?.descuento_comercial || 0} step="0.01" />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="iva_aplicable">IVA Aplicable</Label>
                            <Select name="iva_aplicable" defaultValue={String(defaultValues?.iva_aplicable || 21)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="21">21% General</SelectItem>
                                    <SelectItem value="10">10% Reducido</SelectItem>
                                    <SelectItem value="4">4% Superreducido</SelectItem>
                                    <SelectItem value="0">0% Exento</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Datos Bancarios */}
                    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">💳 Datos Bancarios</h2>

                        <div>
                            <Label htmlFor="iban">IBAN</Label>
                            <Input id="iban" name="iban" defaultValue={defaultValues?.iban} placeholder="ES91 2100 0418 4502 0005 1332" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="banco">Banco</Label>
                                <Input id="banco" name="banco" defaultValue={defaultValues?.banco} />
                            </div>

                            <div>
                                <Label htmlFor="bic_swift">BIC/SWIFT</Label>
                                <Input id="bic_swift" name="bic_swift" defaultValue={defaultValues?.bic_swift} />
                            </div>
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">📝 Notas Internas</h2>
                        <Textarea name="notas_internas" defaultValue={defaultValues?.notas_internas} rows={4} placeholder="Notas privadas..." className="bg-white/5" />
                    </div>

                    {/* Estado */}
                    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="activo" className="cursor-pointer">Cliente Activo</Label>
                            <Switch id="activo" checked={activo} onCheckedChange={setActivo} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 sticky bottom-4 z-10 bg-[#1a2332]/90 backdrop-blur-xl p-4 rounded-xl border border-white/10 shadow-2xl">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-linear-to-r from-primary to-primary/80 hover:scale-105 active:scale-95 transition-all duration-300 font-bold"
                >
                    {isLoading ? 'Guardando...' : clienteId ? 'Guardar Cambios' : 'Guardar Cliente'}
                </Button>
            </div>
        </form>
    )
}
