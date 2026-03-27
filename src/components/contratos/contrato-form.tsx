'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { crearContratoSchema } from '@/lib/validations/contrato-schema'
import type { z } from 'zod'
import { crearContratoAction } from '@/app/actions/contratos'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CarFront, FileText, UserSquare, Users, CreditCard, ChevronRight, Save, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContratoFormProps {
    clientes: Array<{
        id: string
        nombre_fiscal?: string | null
        nombre_comercial?: string | null
        cif?: string | null
        nif?: string | null
        direccion?: string | null
        ciudad?: string | null
        codigo_postal?: string | null
        telefono?: string | null
        email?: string | null
    }>
}

export function ContratoForm({ clientes }: ContratoFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [activeTab, setActiveTab] = useState('operacion')

    type FormValues = z.infer<typeof crearContratoSchema>

    const form = useForm<FormValues>({
        resolver: zodResolver(crearContratoSchema) as any, // Cast to any due to complex nullable schema and hook-form version mismatch
        defaultValues: {
            tipo_operacion: 'venta',
            comprador_nombre: '',
            comprador_nif: '',
            comprador_direccion: null,
            comprador_ciudad: null,
            comprador_codigo_postal: null,
            comprador_telefono: null,
            comprador_email: null,
            vendedor_nombre: '',
            vendedor_nif: '',
            vendedor_direccion: null,
            vendedor_ciudad: null,
            vendedor_codigo_postal: null,
            vendedor_telefono: null,
            vendedor_email: null,
            vehiculo_marca: '',
            vehiculo_modelo: '',
            vehiculo_version: null,
            vehiculo_matricula: '',
            vehiculo_bastidor: '',
            vehiculo_fecha_matriculacion: null,
            vehiculo_kilometraje: null,
            vehiculo_color: null,
            vehiculo_combustible: null,
            precio_venta: 0,
            forma_pago: 'transferencia',
            iva_porcentaje: 0,
            vehiculo_estado_declarado: null,
            vehiculo_libre_cargas: true,
            documentacion_entregada: [],
            clausulas_adicionales: null,
            cliente_id: null,
            notas_internas: null,
        }
    })

    const tipoOperacion = form.watch('tipo_operacion')

    const onSubmit = (data: FormValues) => {
        startTransition(async () => {
            try {
                const result = await crearContratoAction(data)
                if (result.success) {
                    toast.success('Contrato creado', {
                        description: `Número: ${result.data?.numero}`
                    })
                    router.push(`/ventas/contratos/${result.data?.id}`)
                } else {
                    toast.error('Error al crear el contrato', { description: result.error })
                }
            } catch (err) {
                toast.error('Ocurrió un error inesperado al guardar el contrato')
            }
        })
    }

    const nextTab = (next: string) => {
        // Podríamos validar la tab actual antes de continuar
        setActiveTab(next)
    }

    // Helper para autocompletar desde cliente
    const selectCliente = (clienteId: string, role: 'comprador' | 'vendedor') => {
        if (clienteId === 'none') return
        const c = clientes.find(x => x.id === clienteId)
        if (!c) return
        
        const prefix = role === 'comprador' ? 'comprador' : 'vendedor'
        form.setValue(`${prefix}_nombre` as keyof FormValues, c.nombre_fiscal || c.nombre_comercial || '')
        form.setValue(`${prefix}_nif` as keyof FormValues, c.cif || c.nif || '')
        form.setValue(`${prefix}_direccion` as keyof FormValues, c.direccion || '')
        form.setValue(`${prefix}_ciudad` as keyof FormValues, c.ciudad || '')
        form.setValue(`${prefix}_codigo_postal` as keyof FormValues, c.codigo_postal || '')
        form.setValue(`${prefix}_telefono` as keyof FormValues, c.telefono || '')
        form.setValue(`${prefix}_email` as keyof FormValues, c.email || '')
        form.setValue('cliente_id', c.id) // Opcional la relación BD
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 h-auto p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl mb-6">
                    <TabsTrigger value="operacion" className="rounded-xl py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <FileText className="w-4 h-4 mr-2" /> Operación
                    </TabsTrigger>
                    <TabsTrigger value="vendedor" className="rounded-xl py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <UserSquare className="w-4 h-4 mr-2" /> Vendedor
                    </TabsTrigger>
                    <TabsTrigger value="comprador" className="rounded-xl py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Users className="w-4 h-4 mr-2" /> Comprador
                    </TabsTrigger>
                    <TabsTrigger value="vehiculo" className="rounded-xl py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <CarFront className="w-4 h-4 mr-2" /> Vehículo
                    </TabsTrigger>
                    <TabsTrigger value="economico" className="rounded-xl py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <CreditCard className="w-4 h-4 mr-2" /> Datos Económicos
                    </TabsTrigger>
                    <TabsTrigger value="clausulas" className="rounded-xl py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Info className="w-4 h-4 mr-2" /> Cláusulas
                    </TabsTrigger>
                </TabsList>

                {/* 1. OPERACIÓN */}
                <TabsContent value="operacion" className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-lg">Detalles de la Operación</CardTitle>
                            <CardDescription>Selecciona qué tipo de contrato vas a generar.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="max-w-md space-y-4">
                                <div className="space-y-2">
                                    <Label className="uppercase text-[10px] font-bold tracking-widest text-slate-500">Tipo de Contrato</Label>
                                    <Select 
                                        value={form.watch('tipo_operacion')} 
                                        onValueChange={(val: 'venta' | 'compra') => form.setValue('tipo_operacion', val)}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl">
                                            <SelectValue placeholder="Seleccione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="venta">Contrato de Compraventa (Tú VENDES)</SelectItem>
                                            <SelectItem value="compra">Contrato de Compra a Particulares (Tú COMPRAS)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.tipo_operacion && (
                                        <p className="text-sm text-red-500">{form.formState.errors.tipo_operacion.message}</p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <Button type="button" onClick={() => nextTab('vendedor')} className="rounded-xl">Siguiente: Vendedor <ChevronRight className="w-4 h-4 ml-2" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Función auxiliar para renderizar los campos de persona/empresa */}
                {/** 2. VENDEDOR */}
                <TabsContent value="vendedor" className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-lg flex items-center pr-4">
                                Datos del Vendedor
                                {tipoOperacion === 'venta' && <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary">Es el Concesionario</Badge>}
                                {tipoOperacion === 'compra' && <Badge variant="secondary" className="ml-auto bg-blue-500/10 text-blue-500">Es el Cliente particular</Badge>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Autocompletar desde clientes si aplica */}
                            <div className="mb-6 max-w-sm">
                                <Label className="uppercase text-[10px] font-bold tracking-widest text-slate-500 mb-2 block">Autocompletar desde Clientes (Opcional)</Label>
                                <Select onValueChange={(val) => selectCliente(val, 'vendedor')}>
                                    <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-800/50"><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">--- Ninguno (Manual) ---</SelectItem>
                                        {clientes.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.nombre_fiscal || c.nombre_comercial} ({c.cif || c.nif})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Nombre / Razón Social <span className="text-red-500">*</span></Label>
                                    <Input {...form.register('vendedor_nombre')} className="rounded-xl" placeholder="Ej: Juan Pérez" />
                                    {form.formState.errors.vendedor_nombre && <p className="text-xs text-red-500">{form.formState.errors.vendedor_nombre.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>NIF / CIF / NIE <span className="text-red-500">*</span></Label>
                                    <Input {...form.register('vendedor_nif')} className="rounded-xl uppercase" placeholder="Ej: 12345678Z" />
                                    {form.formState.errors.vendedor_nif && <p className="text-xs text-red-500">{form.formState.errors.vendedor_nif.message}</p>}
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Dirección Completa</Label>
                                    <Input {...form.register('vendedor_direccion')} className="rounded-xl" placeholder="Ej: Calle Principal 1, Piso 2" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ciudad</Label>
                                    <Input {...form.register('vendedor_ciudad')} className="rounded-xl" placeholder="Ej: Madrid" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Código Postal</Label>
                                    <Input {...form.register('vendedor_codigo_postal')} className="rounded-xl" placeholder="Ej: 28001" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input {...form.register('vendedor_email')} type="email" className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Teléfono</Label>
                                    <Input {...form.register('vendedor_telefono')} className="rounded-xl" />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <Button type="button" onClick={() => nextTab('comprador')} className="rounded-xl">Siguiente: Comprador <ChevronRight className="w-4 h-4 ml-2" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/** 3. COMPRADOR */}
                <TabsContent value="comprador" className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-lg flex items-center pr-4">
                                Datos del Comprador
                                {tipoOperacion === 'compra' && <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary">Es el Concesionario</Badge>}
                                {tipoOperacion === 'venta' && <Badge variant="secondary" className="ml-auto bg-blue-500/10 text-blue-500">Es el Cliente particular</Badge>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="mb-6 max-w-sm">
                                <Label className="uppercase text-[10px] font-bold tracking-widest text-slate-500 mb-2 block">Autocompletar desde Clientes (Opcional)</Label>
                                <Select onValueChange={(val) => selectCliente(val, 'comprador')}>
                                    <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-800/50"><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">--- Ninguno (Manual) ---</SelectItem>
                                        {clientes.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.nombre_fiscal || c.nombre_comercial} ({c.cif || c.nif})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Nombre / Razón Social <span className="text-red-500">*</span></Label>
                                    <Input {...form.register('comprador_nombre')} className="rounded-xl" />
                                    {form.formState.errors.comprador_nombre && <p className="text-xs text-red-500">{form.formState.errors.comprador_nombre.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>NIF / CIF / NIE <span className="text-red-500">*</span></Label>
                                    <Input {...form.register('comprador_nif')} className="rounded-xl uppercase" />
                                    {form.formState.errors.comprador_nif && <p className="text-xs text-red-500">{form.formState.errors.comprador_nif.message}</p>}
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Dirección Completa</Label>
                                    <Input {...form.register('comprador_direccion')} className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ciudad</Label>
                                    <Input {...form.register('comprador_ciudad')} className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Código Postal</Label>
                                    <Input {...form.register('comprador_codigo_postal')} className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email (Necesario para Enviar a Firmar)</Label>
                                    <Input {...form.register('comprador_email')} type="email" className="rounded-xl border-blue-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Teléfono</Label>
                                    <Input {...form.register('comprador_telefono')} className="rounded-xl" />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <Button type="button" onClick={() => nextTab('vehiculo')} className="rounded-xl">Siguiente: Vehículo <ChevronRight className="w-4 h-4 ml-2" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/** 4. VEHÍCULO */}
                <TabsContent value="vehiculo" className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-lg">Datos del Vehículo</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Matrícula <span className="text-red-500">*</span></Label>
                                    <Input {...form.register('vehiculo_matricula')} className="rounded-xl uppercase" placeholder="1234 BCD" />
                                    {form.formState.errors.vehiculo_matricula && <p className="text-xs text-red-500">{form.formState.errors.vehiculo_matricula.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Número de Bastidor (VIN) <span className="text-red-500">*</span></Label>
                                    <Input {...form.register('vehiculo_bastidor')} className="rounded-xl uppercase font-mono" maxLength={17} />
                                    {form.formState.errors.vehiculo_bastidor && <p className="text-xs text-red-500">{form.formState.errors.vehiculo_bastidor.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Marca <span className="text-red-500">*</span></Label>
                                    <Input {...form.register('vehiculo_marca')} className="rounded-xl" placeholder="BMW, Audi, Toyota..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Modelo <span className="text-red-500">*</span></Label>
                                    <Input {...form.register('vehiculo_modelo')} className="rounded-xl" placeholder="Ej: Serie 3, Golf..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Versión</Label>
                                    <Input {...form.register('vehiculo_version')} className="rounded-xl" placeholder="Ej: 2.0 TDI" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Kilometraje</Label>
                                    <Input {...form.register('vehiculo_kilometraje')} type="number" className="rounded-xl" placeholder="Ej: 150000" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fecha Matriculación</Label>
                                    <Input {...form.register('vehiculo_fecha_matriculacion')} type="date" className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Combustible</Label>
                                    <Select onValueChange={(val: 'diesel' | 'gasolina' | 'hibrido' | 'electrico') => form.setValue('vehiculo_combustible', val)}>
                                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="diesel">Diésel</SelectItem>
                                            <SelectItem value="gasolina">Gasolina</SelectItem>
                                            <SelectItem value="hibrido">Híbrido</SelectItem>
                                            <SelectItem value="electrico">Eléctrico</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <Button type="button" onClick={() => nextTab('economico')} className="rounded-xl">Siguiente: Datos Econ. <ChevronRight className="w-4 h-4 ml-2" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/** 5. DATOS ECONÓMICOS */}
                <TabsContent value="economico" className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-lg">Acuerdo Económico</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Precio de Venta / Compra (€) <span className="text-red-500">*</span></Label>
                                    <Input {...form.register('precio_venta')} type="number" step="0.01" className="rounded-xl text-lg font-bold" />
                                    {form.formState.errors.precio_venta && <p className="text-xs text-red-500">{form.formState.errors.precio_venta.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Forma de Pago</Label>
                                    <Select value={form.watch('forma_pago')} onValueChange={(val: 'transferencia' | 'efectivo' | 'cheque' | 'financiacion') => form.setValue('forma_pago', val)}>
                                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                                            <SelectItem value="efectivo">Efectivo</SelectItem>
                                            <SelectItem value="cheque">Cheque Bancario</SelectItem>
                                            <SelectItem value="financiacion">Financiación</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>IVA (%)</Label>
                                    <Input {...form.register('iva_porcentaje')} type="number" step="0.1" className="rounded-xl" placeholder="Ej: 21, o dejar 0 si es REBU" />
                                    <p className="text-[10px] text-slate-500 mt-1">Si aplicas el Régimen Especial de Bienes Usados (REBU), deja el IVA al 0%.</p>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <Button type="button" onClick={() => nextTab('clausulas')} className="rounded-xl">Siguiente: Cláusulas <ChevronRight className="w-4 h-4 ml-2" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/** 6. CLÁUSULAS Y FINALIZAR */}
                <TabsContent value="clausulas" className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-lg">Garantías y Declaraciones</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <div className="flex items-start space-x-3 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <Checkbox 
                                        id="cargas" 
                                        checked={form.watch('vehiculo_libre_cargas')}
                                        onCheckedChange={(val) => form.setValue('vehiculo_libre_cargas', val as boolean)}
                                        className="mt-1"
                                    />
                                    <div className="space-y-1">
                                        <Label htmlFor="cargas" className="font-semibold cursor-pointer">Vehículo Libre de Cargas y Gravámenes</Label>
                                        <p className="text-sm text-slate-500">El vendedor declara que sobre el vehículo no pesa embargo, reserva de dominio, ni carga alguna.</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Estado General del Vehículo Declarado</Label>
                                    <Textarea {...form.register('vehiculo_estado_declarado')} className="rounded-xl min-h-[100px]" placeholder="Ej: Vehículo con pequeños rasguños en paragolpes trasero. Mecánica al día." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cláusulas Adicionales</Label>
                                    <Textarea {...form.register('clausulas_adicionales')} className="rounded-xl min-h-[120px]" placeholder="Añade estipulaciones extra (ej: garantía comercial de X meses externalizada, etc)" />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Notas Internas (No visibles en contrato)</Label>
                                    <Textarea {...form.register('notas_internas')} className="rounded-xl bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/50" />
                                </div>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                                <Button 
                                    type="submit" 
                                    size="lg"
                                    disabled={isPending}
                                    className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 px-8"
                                >
                                    {isPending ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Save className="w-4 h-4" /> Generar Contrato (Borrador)
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </form>
    )
}
