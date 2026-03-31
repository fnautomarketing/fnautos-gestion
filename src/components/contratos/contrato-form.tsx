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
import { CarFront, FileText, UserSquare, Users, CreditCard, ChevronRight, ChevronLeft, Save, Info, Check, AlertCircle, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

import { SimpleCombobox } from '@/components/ui/simple-combobox'
import { CrearClienteRapidoModal } from '@/components/ventas/crear-cliente-rapido-modal'

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
    empresa?: {
        razon_social: string
        nombre_comercial?: string | null
        cif: string
        direccion?: string | null
        ciudad?: string | null
        codigo_postal?: string | null
        telefono?: string | null
        email?: string | null
    }
    empresasIds?: string[]
}

export function ContratoForm({ clientes: clientesIniciales, empresa, empresasIds = [] }: ContratoFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [activeTab, setActiveTab] = useState('operacion')
    
    // Estado para clientes locales recién creados
    const [clientesNuevosLocales, setClientesNuevosLocales] = useState<Array<{ id: string; nombre_fiscal: string; cif?: string; activo?: boolean }>>([])
    const clientes = [...clientesIniciales, ...clientesNuevosLocales]

    // Estado del modal rápido
    const [showCrearClienteModal, setShowCrearClienteModal] = useState(false)
    const [clienteRoleToCreate, setClienteRoleToCreate] = useState<'comprador' | 'vendedor'>('comprador')

    const steps = [
        { id: 'operacion', label: 'Operación', icon: FileText },
        { id: 'vendedor', label: 'Vendedor', icon: UserSquare },
        { id: 'comprador', label: 'Comprador', icon: Users },
        { id: 'vehiculo', label: 'Vehículo', icon: CarFront },
        { id: 'economico', label: 'Económicos', icon: CreditCard },
        { id: 'clausulas', label: 'Cláusulas', icon: Info },
    ]

    type FormValues = z.infer<typeof crearContratoSchema>

    const form = useForm<FormValues>({
        resolver: zodResolver(crearContratoSchema),
        defaultValues: {
            tipo_operacion: 'venta',
            comprador_nombre: '',
            comprador_nif: '',
            comprador_direccion: '',
            comprador_ciudad: '',
            comprador_codigo_postal: '',
            comprador_telefono: '',
            comprador_email: '',
            vendedor_nombre: '',
            vendedor_nif: '',
            vendedor_direccion: '',
            vendedor_ciudad: '',
            vendedor_codigo_postal: '',
            vendedor_telefono: '',
            vendedor_email: '',
            vehiculo_marca: '',
            vehiculo_modelo: '',
            vehiculo_version: '',
            vehiculo_matricula: '',
            vehiculo_bastidor: '',
            vehiculo_fecha_matriculacion: '',
            vehiculo_kilometraje: null,
            vehiculo_color: '',
            vehiculo_combustible: 'diesel',
            precio_venta: 0,
            forma_pago: 'transferencia',
            iva_porcentaje: 0,
            vehiculo_estado_declarado: '',
            vehiculo_libre_cargas: true,
            documentacion_entregada: [],
            clausulas_adicionales: '',
            cliente_id: null,
            notas_internas: '',
        }
    })

    const stepFields: Record<string, (keyof FormValues)[]> = {
        operacion: ['tipo_operacion'],
        vendedor: ['vendedor_nombre', 'vendedor_nif'],
        comprador: ['comprador_nombre', 'comprador_nif'],
        vehiculo: ['vehiculo_marca', 'vehiculo_modelo', 'vehiculo_matricula', 'vehiculo_bastidor'],
        economico: ['precio_venta'],
        clausulas: [],
    }

    const getStepStatus = (stepId: string) => {
        const fields = stepFields[stepId]
        if (!fields || fields.length === 0) return 'pending'

        const hasError = fields.some(field => form.formState.errors[field])
        if (hasError) return 'error'

        const isFilled = fields.every(field => {
            const val = form.getValues(field)
            return val !== undefined && val !== null && val !== '' && val !== 0
        })

        if (isFilled) return 'success'
        return 'pending'
    }

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
            } catch {
                toast.error('Ocurrió un error inesperado al guardar el contrato')
            }
        })
    }

    const onError = (errors: Record<string, unknown>) => {
        console.log('Form errors:', errors)
        toast.error('Corrige los errores antes de continuar', {
            description: 'Revisa los campos obligatorios en cada sección.'
        })
        
        // Saltar a la primera pestaña que tenga un error
        if (errors.tipo_operacion) setActiveTab('operacion')
        else if (errors.vendedor_nombre || errors.vendedor_nif) setActiveTab('vendedor')
        else if (errors.comprador_nombre || errors.comprador_nif) setActiveTab('comprador')
        else if (errors.vehiculo_matricula || errors.vehiculo_bastidor || errors.vehiculo_marca || errors.vehiculo_modelo) setActiveTab('vehiculo')
        else if (errors.precio_venta) setActiveTab('economico')
    }

    // Llenado automático de datos de empresa
    useEffect(() => {
        if (!empresa) return

        if (tipoOperacion === 'venta') {
            // Empresa es Vendedor
            form.setValue('vendedor_nombre', empresa.razon_social || '')
            form.setValue('vendedor_nif', empresa.cif || '')
            form.setValue('vendedor_direccion', empresa.direccion || '')
            form.setValue('vendedor_ciudad', empresa.ciudad || '')
            form.setValue('vendedor_codigo_postal', empresa.codigo_postal || '')
            form.setValue('vendedor_telefono', empresa.telefono || '')
            form.setValue('vendedor_email', empresa.email || '')
            
            // Vaciar Comprador si era la empresa antes (protegemos si el usuario ya escribió algo)
            const compNombre = form.getValues('comprador_nombre')
            if (compNombre === empresa.razon_social || !compNombre) {
                form.setValue('comprador_nombre', '')
                form.setValue('comprador_nif', '')
                form.setValue('comprador_direccion', '')
                form.setValue('comprador_ciudad', '')
                form.setValue('comprador_codigo_postal', '')
                form.setValue('comprador_telefono', '')
                form.setValue('comprador_email', '')
            }
        } else if (tipoOperacion === 'compra') {
            // Empresa es Comprador
            form.setValue('comprador_nombre', empresa.razon_social || '')
            form.setValue('comprador_nif', empresa.cif || '')
            form.setValue('comprador_direccion', empresa.direccion || '')
            form.setValue('comprador_ciudad', empresa.ciudad || '')
            form.setValue('comprador_codigo_postal', empresa.codigo_postal || '')
            form.setValue('comprador_telefono', empresa.telefono || '')
            form.setValue('comprador_email', empresa.email || '')

            // Vaciar Vendedor si era la empresa antes
            const vendNombre = form.getValues('vendedor_nombre')
            if (vendNombre === empresa.razon_social || !vendNombre) {
                form.setValue('vendedor_nombre', '')
                form.setValue('vendedor_nif', '')
                form.setValue('vendedor_direccion', '')
                form.setValue('vendedor_ciudad', '')
                form.setValue('vendedor_codigo_postal', '')
                form.setValue('vendedor_telefono', '')
                form.setValue('vendedor_email', '')
            }
        }
    }, [tipoOperacion, empresa, form])

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
        <>
        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Visual Stepper */}
                <div className="relative mb-12 px-4 md:px-0">
                    <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -z-10" />
                    <TabsList className="flex justify-between items-start bg-transparent h-auto p-0 border-none shadow-none w-full">
                        {steps.map((step) => {
                            const Icon = step.icon
                            const isActive = activeTab === step.id
                            const status = getStepStatus(step.id)
                            
                            return (
                                <TabsTrigger 
                                    key={step.id} 
                                    value={step.id}
                                    className={cn(
                                        "flex flex-col items-center gap-2 bg-transparent border-none shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none group px-0 min-w-[60px] md:min-w-[80px]",
                                        isActive ? "text-primary" : status === 'success' ? "text-green-600" : status === 'error' ? "text-red-500" : "text-slate-400"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                        isActive 
                                            ? "bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/20" 
                                            : status === 'success'
                                                ? "bg-green-50 border-green-600 text-green-600" 
                                                : status === 'error'
                                                    ? "bg-red-50 border-red-500 text-red-500 animate-pulse"
                                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    )}>
                                        {status === 'success' ? (
                                            <Check className="w-5 h-5" />
                                        ) : status === 'error' ? (
                                            <AlertCircle className="w-5 h-5" />
                                        ) : (
                                            <Icon className="w-5 h-5" />
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] md:text-xs font-medium uppercase tracking-wider hidden md:block",
                                        isActive ? "opacity-100" : "opacity-60"
                                    )}>
                                        {step.label}
                                    </span>
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>
                </div>

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
                            {/* Autocompletar desde clientes solo si es COMPRA (donde el vendedor es el cliente) */}
                            {tipoOperacion === 'compra' && (
                                <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-xl max-w-md">
                                    <Label className="uppercase text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 mb-2 block">Seleccionar Cliente Existente</Label>
                                    <div className="flex gap-2 isolate">
                                        <div className="flex-1">
                                            <SimpleCombobox
                                                options={clientes.map(c => ({
                                                    value: c.id,
                                                    label: c.nombre_fiscal || c.nombre_comercial || '',
                                                    subLabel: c.cif || c.nif || ''
                                                }))}
                                                value={form.getValues('vendedor_nombre') ? clientes.find(c => (c.nombre_fiscal || c.nombre_comercial) === form.getValues('vendedor_nombre'))?.id || '' : ''}
                                                onChange={(val) => selectCliente(val || 'none', 'vendedor')}
                                                placeholder="Buscar cliente..."
                                                emptyText="No se encontraron clientes"
                                            />
                                        </div>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="icon"
                                            className="shrink-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:text-blue-600"
                                            title="Crear nuevo cliente"
                                            onClick={() => {
                                                setClienteRoleToCreate('vendedor')
                                                setShowCrearClienteModal(true)
                                            }}
                                        >
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-blue-500 mt-2 flex items-center gap-1">
                                        <Info className="w-3 h-3" /> Esto rellenará los campos automáticamente con los datos de facturación.
                                    </p>
                                </div>
                            )}

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
                            <div className="mt-8 flex justify-between gap-4">
                                <Button type="button" variant="outline" onClick={() => setActiveTab('operacion')} className="rounded-xl px-6 group">
                                    <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Anterior
                                </Button>
                                <Button type="button" onClick={() => nextTab('comprador')} className="rounded-xl px-6 group">
                                    Siguiente: Comprador <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
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
                            {/* Autocompletar desde clientes solo si es VENTA (donde el comprador es el cliente) */}
                            {tipoOperacion === 'venta' && (
                                <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-xl max-w-md">
                                    <Label className="uppercase text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 mb-2 block">Seleccionar Cliente Existente</Label>
                                    <div className="flex gap-2 isolate">
                                        <div className="flex-1">
                                            <SimpleCombobox
                                                options={clientes.map(c => ({
                                                    value: c.id,
                                                    label: c.nombre_fiscal || c.nombre_comercial || '',
                                                    subLabel: c.cif || c.nif || ''
                                                }))}
                                                value={form.getValues('comprador_nombre') ? clientes.find(c => (c.nombre_fiscal || c.nombre_comercial) === form.getValues('comprador_nombre'))?.id || '' : ''}
                                                onChange={(val) => selectCliente(val || 'none', 'comprador')}
                                                placeholder="Buscar cliente..."
                                                emptyText="No se encontraron clientes"
                                            />
                                        </div>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="icon"
                                            className="shrink-0 rounded-xl bg-white dark:bg-slate-900 shadow-sm border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:text-blue-600"
                                            title="Crear nuevo cliente"
                                            onClick={() => {
                                                setClienteRoleToCreate('comprador')
                                                setShowCrearClienteModal(true)
                                            }}
                                        >
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-blue-500 mt-2 flex items-center gap-1">
                                        <Info className="w-3 h-3" /> Esto rellenará los campos automáticamente con los datos de facturación.
                                    </p>
                                </div>
                            )}

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
                            <div className="mt-8 flex justify-between gap-4">
                                <Button type="button" variant="outline" onClick={() => setActiveTab('vendedor')} className="rounded-xl px-6 group">
                                    <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Anterior
                                </Button>
                                <Button type="button" onClick={() => nextTab('vehiculo')} className="rounded-xl px-6 group">
                                    Siguiente: Vehículo <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
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
                            <div className="mt-8 flex justify-between gap-4">
                                <Button type="button" variant="outline" onClick={() => setActiveTab('comprador')} className="rounded-xl px-6 group">
                                    <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Anterior
                                </Button>
                                <Button type="button" onClick={() => nextTab('economico')} className="rounded-xl px-6 group">
                                    Siguiente: Económicos <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
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
                            <div className="mt-8 flex justify-between gap-4">
                                <Button type="button" variant="outline" onClick={() => setActiveTab('vehiculo')} className="rounded-xl px-6 group">
                                    <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Anterior
                                </Button>
                                <Button type="button" onClick={() => nextTab('clausulas')} className="rounded-xl px-6 group">
                                    Siguiente: Cláusulas <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
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
                            
                             <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-4">
                                <Button type="button" variant="outline" onClick={() => setActiveTab('economico')} className="rounded-xl px-6 group">
                                    <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Anterior
                                </Button>
                                <Button 
                                    type="submit" 
                                    size="lg"
                                    disabled={isPending}
                                    className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 px-8 flex-1 md:flex-none"
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

        <CrearClienteRapidoModal
            open={showCrearClienteModal}
            onOpenChange={setShowCrearClienteModal}
            empresasIds={empresasIds}
            onClienteCreado={(id, nombre_fiscal, cif) => {
                const nuevoCliente = { id, nombre_fiscal, cif, activo: true }
                setClientesNuevosLocales(prev => [...prev, nuevoCliente])
                
                // Forzar sincronización inmediata de la selección 
                // Usamos un pequeño macro-task si se requiere delay, pero selectCliente resolverá con el valor local
                setTimeout(() => {
                    selectCliente(id, clienteRoleToCreate)
                }, 100)
            }}
        />
        </>
    )
}
