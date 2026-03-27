'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    MoreVertical, 
    Eye, 
    Edit, 
    Trash, 
    Download, 
    Mail, 
    ChevronLeft, 
    ChevronRight,
    Check,
    FileSignature,
    FileWarning,
    CarFront,
    XCircle,
    Copy,
    PenTool,
    Clock,
    FileText,
    Send
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Contrato } from '@/types/contratos'
import { anularContratoAction, enviarContratoAction } from '@/app/actions/contratos'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import Link from 'next/link'
import ExcelJS from 'exceljs'
import { clientConfig } from '@/config/clients'

interface ContratosTableProps {
    contratos: Contrato[]
    totalCount: number
    currentPage: number
    pageSize: number
    searchQuery?: string
}

export function ContratosTable({
    contratos,
    totalCount,
    currentPage,
    pageSize,
    searchQuery,
}: ContratosTableProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isAnulando, setIsAnulando] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isSending, setIsSending] = useState<string | null>(null)
    const [anularTarget, setAnularTarget] = useState<{ id: string; numero: string } | null>(null)

    const totalPages = Math.ceil(totalCount / pageSize)

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', newPage.toString())
        router.push(`?${params.toString()}`)
    }

    const handleAnular = async () => {
        if (!anularTarget) return
        setIsAnulando(true)
        try {
            const result = await anularContratoAction(anularTarget.id)
            if (result.success) {
                toast.success('Contrato anulado correctamente')
                setAnularTarget(null)
                router.refresh()
            } else {
                toast.error(result.error || 'Error al anular contrato')
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado al anular')
        } finally {
            setIsAnulando(false)
        }
    }

    const handleEnviarEmail = async (id: string) => {
        setIsSending(id)
        try {
            const result = await enviarContratoAction(id)
            if (result.success) {
                toast.success('Enlace de firma enviado por email')
            } else {
                toast.error(result.error || 'Error al enviar email')
            }
        } catch (error) {
            toast.error('Error de red al enviar el email')
        } finally {
            setIsSending(null)
            router.refresh()
        }
    }

    const handleCopyLink = (token: string) => {
        const url = `${window.location.origin}/contratos/firmar/${token}`
        navigator.clipboard.writeText(url)
        toast.success('Enlace de firma copiado al portapapeles')
    }

    const handleExportExcel = async () => {
        if (isExporting) return
        setIsExporting(true)
        try {
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('Contratos')

            worksheet.columns = [
                { header: 'Número', key: 'numero_contrato', width: 15 },
                { header: 'Tipo', key: 'tipo_operacion', width: 12 },
                { header: 'Vehículo', key: 'vehiculo', width: 30 },
                { header: 'Comprador', key: 'comprador', width: 25 },
                { header: 'Vendedor', key: 'vendedor', width: 25 },
                { header: 'Fecha', key: 'created_at', width: 15 },
                { header: 'Estado', key: 'estado', width: 15 },
                { header: 'Total', key: 'total_con_iva', width: 15 },
            ]

            contratos.forEach(c => {
                worksheet.addRow({
                    numero_contrato: c.numero_contrato,
                    tipo_operacion: c.tipo_operacion === 'venta' ? 'VENTA' : 'COMPRA',
                    vehiculo: `${c.vehiculo_matricula} - ${c.vehiculo_marca} ${c.vehiculo_modelo}`,
                    comprador: c.comprador_nombre,
                    vendedor: c.vendedor_nombre,
                    created_at: formatDate(c.created_at || ''),
                    estado: c.estado,
                    total_con_iva: c.total_con_iva || c.precio_venta
                })
            })

            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = window.URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = `contratos_${new Date().toISOString().split('T')[0]}.xlsx`
            anchor.click()
            window.URL.revokeObjectURL(url)
            
            toast.success('Archivo Excel generado con éxito')
        } catch (error) {
            console.error('Error exportando a Excel:', error)
            toast.error('Error al generar el archivo Excel')
        } finally {
            setIsExporting(false)
        }
    }

    const getEstadoBadge = (contrato: Contrato) => {
        switch (contrato.estado) {
            case 'firmado':
                return (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-900/50 font-medium px-2.5 py-0.5 rounded-full">
                        Firmado
                    </Badge>
                )
            case 'pendiente_firma':
                return (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-900/50 font-medium px-2.5 py-0.5 rounded-full flex gap-1 items-center">
                        <Clock className="w-3 h-3" />
                        Esperando firma
                    </Badge>
                )
            case 'borrador':
                return (
                    <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-800/50 font-medium px-2.5 py-0.5 rounded-full">
                        Borrador
                    </Badge>
                )
            case 'anulado':
                return (
                    <Badge variant="destructive" className="bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700 font-medium px-2.5 py-0.5 rounded-full opacity-60">
                        Anulado
                    </Badge>
                )
            default:
                return (
                    <Badge variant="outline" className="font-medium px-2.5 py-0.5 rounded-full capitalize">
                        {contrato.estado}
                    </Badge>
                )
        }
    }

    const HighlightText = ({ text, query }: { text: string, query?: string }) => {
        if (!query || !text) return <>{text}</>
        const parts = text.split(new RegExp(`(${query})`, 'gi'))
        return (
            <>
                {parts.map((part, i) => 
                    part.toLowerCase() === query.toLowerCase() 
                        ? <mark key={i} className="bg-yellow-100 text-yellow-900 px-0.5 rounded-sm dark:bg-yellow-500/30 dark:text-yellow-200">{part}</mark> 
                        : part
                )}
            </>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <FileSignature className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">Listado de Contratos</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{totalCount} registros encontrados</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportExcel}
                        disabled={isExporting || contratos.length === 0}
                        className="flex-1 sm:flex-none border-white/20 bg-white/50 backdrop-blur-sm hover:bg-white/80 dark:bg-slate-800/50 hover:dark:bg-slate-800/80 transition-all duration-300 rounded-xl"
                    >
                        {isExporting ? (
                            <span className="flex items-center gap-2">
                                <div className="h-3 w-3 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                                Exportando...
                            </span>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                Exportar
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/60 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-slate-200/50 dark:border-slate-800/50">
                                    <TableHead className="w-[120px] font-serif font-bold text-slate-900 dark:text-slate-100 py-5 pl-6">Número</TableHead>
                                    <TableHead className="font-serif font-bold text-slate-900 dark:text-slate-100 py-5">Vehículo</TableHead>
                                    <TableHead className="font-serif font-bold text-slate-900 dark:text-slate-100 py-5 hidden md:table-cell">Cliente/Otra Parte</TableHead>
                                    <TableHead className="font-serif font-bold text-slate-900 dark:text-slate-100 py-5 text-center hidden lg:table-cell">Fecha</TableHead>
                                    <TableHead className="font-serif font-bold text-slate-900 dark:text-slate-100 py-5 text-center">Estado</TableHead>
                                    <TableHead className="font-serif font-bold text-slate-900 dark:text-slate-100 py-5 text-right hidden sm:table-cell">Total</TableHead>
                                    <TableHead className="w-[80px] py-5 pr-6"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contratos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3 animate-in zoom-in duration-500">
                                                <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                                    <FileWarning className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <p className="text-slate-500 font-medium">No se encontraron contratos</p>
                                                <Button variant="link" onClick={() => router.push(window.location.pathname)} className="text-primary hover:text-primary/80">
                                                    Limpiar todos los filtros
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    contratos.map((contrato, index) => {
                                        const nombreAgente = contrato.tipo_operacion === 'venta' ? contrato.comprador_nombre : contrato.vendedor_nombre
                                        const rutAgente = contrato.tipo_operacion === 'venta' ? contrato.comprador_nif : contrato.vendedor_nif

                                        return (
                                            <TableRow 
                                                key={contrato.id} 
                                                className="group hover:bg-primary/5 border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300 animate-in fade-in slide-in-from-left-4"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <TableCell className="py-4 pl-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                                                            <HighlightText text={contrato.numero_contrato} query={searchQuery} />
                                                        </span>
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase tracking-widest mt-0.5",
                                                            contrato.tipo_operacion === 'venta' ? 'text-primary' : 'text-blue-600'
                                                        )}>
                                                            {contrato.tipo_operacion === 'venta' ? 'VENTA' : 'COMPRA'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col max-w-[200px] sm:max-w-[240px]">
                                                        <span className="font-medium text-slate-900 dark:text-slate-200 truncate flex items-center gap-1.5">
                                                            <CarFront className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors" />
                                                            <HighlightText text={`${contrato.vehiculo_marca} ${contrato.vehiculo_modelo}`} query={searchQuery} />
                                                        </span>
                                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5 bg-slate-100 dark:bg-slate-800 w-fit px-1.5 rounded uppercase font-bold tracking-wider">
                                                            <HighlightText text={contrato.vehiculo_matricula} query={searchQuery} />
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 hidden md:table-cell">
                                                    <div className="flex flex-col max-w-[200px]">
                                                        <span className="font-medium text-slate-900 dark:text-slate-200 truncate">
                                                            <HighlightText text={nombreAgente || '-'} query={searchQuery} />
                                                        </span>
                                                        <span className="text-xs text-slate-400 font-mono">{rutAgente || '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center py-4 hidden lg:table-cell">
                                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                        {formatDate(contrato.created_at || '')}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center py-4">
                                                    <div className="flex flex-col items-center gap-1">
                                                        {getEstadoBadge(contrato)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4 hidden sm:table-cell">
                                                    <span className="font-mono font-bold tracking-tight text-slate-900 dark:text-white">
                                                        {formatCurrency(contrato.total_con_iva || contrato.precio_venta)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-4 pr-6">
                                                    <div className="flex justify-end pt-2">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    className="h-11 w-11 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                                                >
                                                                    <MoreVertical className="h-5 w-5 text-slate-500" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-52 p-1 border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl rounded-xl">
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/ventas/contratos/${contrato.id}`} className="flex items-center cursor-pointer rounded-lg px-3 py-2.5">
                                                                        <Eye className="mr-3 h-5 w-5 text-slate-600" /> Ver Detalles
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/api/contratos/${contrato.id}/pdf`} target="_blank" className="flex items-center cursor-pointer rounded-lg px-3 py-2.5">
                                                                        <FileText className="mr-3 h-5 w-5 text-slate-600" /> Previsualizar PDF
                                                                    </Link>
                                                                </DropdownMenuItem>

                                                                {contrato.estado === 'borrador' && (
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={`/ventas/contratos/${contrato.id}`} className="flex items-center cursor-pointer rounded-lg px-3 py-2.5">
                                                                            <Send className="mr-3 h-5 w-5 text-blue-600" /> Enviar para Firma
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                )}

                                                                {contrato.estado === 'pendiente_firma' && (
                                                                    <>
                                                                        <DropdownMenuItem asChild>
                                                                            <Link href={`/ventas/contratos/${contrato.id}`} className="flex items-center cursor-pointer rounded-lg px-3 py-2.5 font-medium text-primary">
                                                                                <Mail className="mr-3 h-5 w-5" /> Reenviar / Cambiar Email
                                                                            </Link>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleCopyLink(contrato.token_firma!)} className="flex items-center cursor-pointer rounded-lg px-3 py-2.5 text-slate-600">
                                                                            <Copy className="mr-3 h-5 w-5 text-blue-500" /> Copiar enlace de firma
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem asChild>
                                                                            <Link href={`/contratos/firmar/${contrato.token_firma}`} target="_blank" className="flex items-center cursor-pointer rounded-lg font-bold text-primary px-3 py-2.5">
                                                                                <PenTool className="mr-3 h-5 w-5" /> Firmar ahora (Presencial)
                                                                            </Link>
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}

                                                                <div className="h-px bg-slate-200 dark:bg-slate-800 my-1 mx-1" />

                                                                <DropdownMenuItem 
                                                                    disabled={contrato.estado === 'firmado' || contrato.estado === 'anulado'}
                                                                    className="text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-lg px-3 py-2.5"
                                                                    onClick={() => setAnularTarget({ id: contrato.id, numero: contrato.numero_contrato })}
                                                                >
                                                                    <XCircle className="mr-3 h-5 w-5" /> Anular contrato
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View (Premium Optimization) */}
                    <div className="md:hidden flex flex-col p-4 gap-4">
                        {contratos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16">
                                <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                    <FileWarning className="h-8 w-8 text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-medium text-center">No se encontraron contratos</p>
                            </div>
                        ) : (
                            contratos.map((contrato) => {
                                const nombreAgente = contrato.tipo_operacion === 'venta' ? contrato.comprador_nombre : contrato.vendedor_nombre
                                
                                return (
                                    <div key={contrato.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative pl-16">
                                        <div className="absolute left-4 top-4 h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <FileText className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="pr-8">
                                                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                    {contrato.numero_contrato}
                                                </p>
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-widest block mt-0.5",
                                                    contrato.tipo_operacion === 'venta' ? 'text-primary' : 'text-blue-600'
                                                )}>
                                                    {contrato.tipo_operacion === 'venta' ? 'VENTA' : 'COMPRA'}
                                                </span>
                                            </div>
                                            <div className="shrink-0 -mt-1 -mr-1">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button 
                                                            variant="ghost" 
                                                            className="h-11 w-11 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                                        >
                                                            <MoreVertical className="h-5 w-5 text-slate-500" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 p-1 border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl rounded-xl">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/ventas/contratos/${contrato.id}`} className="flex items-center cursor-pointer rounded-lg px-3 py-3 text-base">
                                                                <Eye className="mr-3 h-5 w-5 text-slate-600" /> Ver Detalles
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/api/contratos/${contrato.id}/pdf`} target="_blank" className="flex items-center cursor-pointer rounded-lg px-3 py-3 text-base">
                                                                <FileText className="mr-3 h-5 w-5 text-slate-600" /> PDF
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {contrato.estado === 'pendiente_firma' && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleEnviarEmail(contrato.id)} className="flex items-center cursor-pointer rounded-lg px-3 py-3 text-base">
                                                                    <Mail className="mr-3 h-5 w-5 text-primary" /> Reenviar Email
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/contratos/firmar/${contrato.token_firma}`} target="_blank" className="flex items-center cursor-pointer rounded-lg font-bold text-primary px-3 py-3 text-base">
                                                                        <PenTool className="mr-3 h-5 w-5" /> Firmar ahora
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2 mt-4 text-sm">
                                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/50 pb-2">
                                                <span className="text-slate-500">Vehículo</span>
                                                <span className="font-medium text-slate-900 dark:text-slate-200 text-right">
                                                    {contrato.vehiculo_marca} {contrato.vehiculo_modelo}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/50 pb-2">
                                                <span className="text-slate-500">Total</span>
                                                <span className="font-bold text-slate-900 dark:text-white font-mono">
                                                    {formatCurrency(contrato.total_con_iva || contrato.precio_venta)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="text-xs text-slate-400">
                                                    {formatDate(contrato.created_at || '')}
                                                </span>
                                                {getEstadoBadge(contrato)}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between py-2 px-1">
                    <p className="text-xs text-slate-500">
                        {currentPage} de {totalPages} ({totalCount} res.)
                    </p>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!anularTarget}
                onOpenChange={(open) => !open && setAnularTarget(null)}
                onConfirm={handleAnular}
                title="¿Anular contrato?"
                description={`Esta acción marcará el contrato ${anularTarget?.numero} como anulado. No se eliminará de la base de datos pero no podrá ser firmado.`}
                confirmText={isAnulando ? "Anulando..." : "Sí, anular"}
                cancelText="Cancelar"
                variant="destructive"
            />
        </div>
    )
}
