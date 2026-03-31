import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Download, Mail, PenTool, Edit, Trash, FileText, CheckCircle2, Clock, XCircle, Send, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BotonEnviarContrato } from '@/components/contratos/boton-enviar-contrato'
import { BotonReenviarFirmado } from '@/components/contratos/boton-reenviar-firmado'

export const metadata: Metadata = {
    title: 'Detalle de Contrato | FN Autos',
    description: 'Ver detalles de un contrato de compraventa',
}

export const dynamic = 'force-dynamic'

export default async function DetalleContratoPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const adminClient = createAdminClient()
    const { empresaId } = await getUserContext()

    const query = adminClient
        .from('contratos')
        .select('*')
        .eq('id', id)
        .single()

    const { data, error } = await query

    if (error || !data) {
        notFound()
    }

    const contrato = data as unknown as import('@/types/contratos').Contrato

    // Seguridad extra: verificar que pertenece a la empresa
    if (empresaId && contrato.empresa_id !== empresaId) {
        notFound()
    }

    const isVenta = contrato.tipo_operacion === 'venta'

    const renderEstado = (estado: string) => {
        switch (estado) {
            case 'firmado':
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-3"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Firmado</Badge>
            case 'pendiente_firma':
                return <Badge className="bg-blue-500/10 text-blue-600 border-none px-3"><Clock className="w-3.5 h-3.5 mr-1" /> Pendiente de Firma</Badge>
            case 'borrador':
                return <Badge className="bg-slate-500/10 text-slate-600 border-none px-3">Borrador</Badge>
            case 'anulado':
                return <Badge className="bg-red-500/10 text-red-600 border-none px-3"><XCircle className="w-3.5 h-3.5 mr-1" /> Anulado</Badge>
            default:
                return <Badge className="uppercase">{estado}</Badge>
        }
    }

    const { enviarContratoAction } = await import('@/app/actions/contratos')

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header + Acciones */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <Link href="/ventas/contratos" className="hover:text-slate-900 transition-colors flex items-center">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Volver a contratos
                        </Link>
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                        Contrato {contrato.numero_contrato}
                        {renderEstado(contrato.estado)}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Creado el {formatDate(contrato.created_at || '')}
                    </p>
                </div>
                
                {/* Panel de botones flotante en móvil */}
                <div className="sticky bottom-0 z-50 -mx-4 sm:-mx-6 mt-6 p-4 sm:p-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 sm:static sm:mx-0 sm:mt-0 sm:p-0 sm:bg-transparent sm:backdrop-blur-none sm:border-none flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button variant="outline" asChild className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur shadow-sm">
                        <a href={`/api/contratos/${contrato.id}/pdf`} target="_blank">
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                        </a>
                    </Button>
                    
                    {contrato.estado === 'borrador' && (
                        <BotonEnviarContrato 
                            contratoId={contrato.id} 
                            emailInicial={isVenta ? contrato.comprador_email : contrato.vendedor_email}
                            tipoOperacion={contrato.tipo_operacion}
                        />
                    )}
                    
                    {contrato.estado === 'pendiente_firma' && (
                        <>
                            <Button variant="outline" asChild className="rounded-xl border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400">
                                <Link href={`/contratos/firmar/${contrato.token_firma}`} target="_blank">
                                    <PenTool className="w-4 h-4 mr-2" />
                                    Firma Presencial
                                </Link>
                            </Button>
                            <BotonEnviarContrato 
                                contratoId={contrato.id} 
                                emailInicial={isVenta ? contrato.comprador_email : contrato.vendedor_email}
                                tipoOperacion={contrato.tipo_operacion}
                                label="Reenviar Email"
                            />
                        </>
                    )}

                    {contrato.estado === 'firmado' && (
                        <BotonReenviarFirmado contratoId={contrato.id} />
                    )}
                </div>
            </div>

            {/* Grid Detalles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                
                {/* Operación */}
                <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur shadow-xl shadow-slate-200/50 dark:shadow-none border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50">
                        <CardTitle className="text-sm uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Detalle Operación
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Tipo</p>
                            <p className="font-bold text-slate-900 dark:text-white uppercase mt-0.5">
                                {isVenta ? <span className="text-primary">Venta (Entregas Vehículo)</span> : <span className="text-blue-600">Compra (Adquieres Vehículo)</span>}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Precio Acordado</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mt-0.5">
                                {formatCurrency(contrato.total_con_iva || contrato.precio_venta)}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Forma Pago</p>
                                <p className="font-medium text-slate-900 dark:text-white capitalize">{contrato.forma_pago}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">IVA</p>
                                <p className="font-medium text-slate-900 dark:text-white">{contrato.iva_porcentaje}% {contrato.iva_porcentaje === 0 && '(REBU)'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Vehículo */}
                <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur shadow-xl shadow-slate-200/50 dark:shadow-none border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50">
                        <CardTitle className="text-sm uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H8.5a1 1 0 00-.8.4L5 11l-5.16.86a1 1 0 00-.84.99V16h3m10 0a2 2 0 11-4 0 2 2 0 014 0zM9 16a2 2 0 11-4 0 2 2 0 014 0z"/></svg> 
                            Datos del Vehículo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Marca, Modelo y Versión</p>
                            <p className="font-bold text-slate-900 dark:text-white mt-0.5">{contrato.vehiculo_marca} {contrato.vehiculo_modelo} {contrato.vehiculo_version}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Matrícula</p>
                                <p className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit mt-1">{contrato.vehiculo_matricula}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Kilometraje</p>
                                <p className="font-medium text-slate-900 dark:text-white mt-1">{contrato.vehiculo_kilometraje?.toLocaleString() || 'N/D'} km</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Bastidor (VIN)</p>
                            <p className="font-mono text-sm text-slate-700 dark:text-slate-300 tracking-wider mt-0.5">{contrato.vehiculo_bastidor}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Partes */}
                <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur shadow-xl shadow-slate-200/50 dark:shadow-none border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50">
                        <CardTitle className="text-sm uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> 
                            Las Partes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-5">
                        <div className="border-l-2 border-primary pl-3">
                            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Vendedor</p>
                            <p className="font-bold text-slate-900 dark:text-white mt-0.5">{contrato.vendedor_nombre}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{contrato.vendedor_nif}</p>
                        </div>
                        <div className="border-l-2 border-blue-500 pl-3">
                            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Comprador</p>
                            <p className="font-bold text-slate-900 dark:text-white mt-0.5">{contrato.comprador_nombre}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{contrato.comprador_nif}</p>
                            {contrato.comprador_email && (
                                <p className="text-xs text-slate-500 flex items-center mt-1"><Mail className="w-3 h-3 mr-1" /> {contrato.comprador_email}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
