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
    ChevronDown,
    Check,
    FileSpreadsheet,
    FileWarning
} from 'lucide-react'
import { cn, formatFacturaDisplayNumero, formatCurrency, formatDate, isVencida } from '@/lib/utils'
import { FacturaWithCliente } from '@/types/ventas'
import { eliminarFacturaAction } from '@/app/actions/ventas'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import Link from 'next/link'
import ExcelJS from 'exceljs'

interface FacturasTableProps {
    facturas: FacturaWithCliente[]
    totalCount: number
    currentPage: number
    pageSize: number
    searchQuery?: string
    enviadaIds?: string[]
}

export function FacturasTable({
    facturas,
    totalCount,
    currentPage,
    pageSize,
    searchQuery,
    enviadaIds = []
}: FacturasTableProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; numero: string } | null>(null)
    const [isExporting, setIsExporting] = useState(false)

    const totalPages = Math.ceil(totalCount / pageSize)

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', newPage.toString())
        router.push(`?${params.toString()}`)
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            const result = await eliminarFacturaAction(deleteTarget.id)
            if (result.success) {
                toast.success('Factura eliminada correctamente')
                setDeleteTarget(null)
                router.refresh()
            } else {
                toast.error(result.error || 'Error al eliminar la factura')
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado al eliminar la factura')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleExportExcel = async () => {
        if (isExporting) return
        setIsExporting(true)
        try {
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('Facturas')

            worksheet.columns = [
                { header: 'Número', key: 'numero', width: 20 },
                { header: 'Cliente', key: 'cliente', width: 35 },
                { header: 'Emisión', key: 'fecha_emision', width: 15 },
                { header: 'Vencimiento', key: 'fecha_vencimiento', width: 15 },
                { header: 'Estado', key: 'estado', width: 15 },
                { header: 'Total', key: 'total', width: 15 },
            ]

            facturas.forEach(f => {
                worksheet.addRow({
                    numero: formatFacturaDisplayNumero(f.serie, f.numero),
                    cliente: f.cliente?.nombre_fiscal || f.cliente?.nombre_comercial || '-',
                    fecha_emision: formatDate(f.fecha_emision),
                    fecha_vencimiento: formatDate(f.fecha_vencimiento),
                    estado: f.estado,
                    total: f.total
                })
            })

            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = window.URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = `facturas_${new Date().toISOString().split('T')[0]}.xlsx`
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

    const getEstadoBadge = (factura: FacturaWithCliente) => {
        const estado = factura.estado
        const vencida = isVencida(factura.fecha_vencimiento) && estado !== 'pagada' && estado !== 'anulada'

        if (vencida) {
            return (
                <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-900/50 font-medium px-2.5 py-0.5 rounded-full animate-pulse-slow">
                    Vencida
                </Badge>
            )
        }

        switch (estado) {
            case 'pagada':
                return (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-900/50 font-medium px-2.5 py-0.5 rounded-full">
                        Pagada
                    </Badge>
                )
            case 'cobro_parcial':
                return (
                    <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-900/50 font-medium px-2.5 py-0.5 rounded-full">
                        Cobro Parcial
                    </Badge>
                )
            case 'emitida':
                return (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-900/50 font-medium px-2.5 py-0.5 rounded-full text-center">
                        Emitida
                    </Badge>
                )
            case 'borrador':
                return (
                    <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-800/50 font-medium px-2.5 py-0.5 rounded-full">
                        Borrador
                    </Badge>
                )
            case 'anulada':
                return (
                    <Badge variant="destructive" className="bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700 font-medium px-2.5 py-0.5 rounded-full opacity-60">
                        Anulada
                    </Badge>
                )
            default:
                return (
                    <Badge variant="outline" className="font-medium px-2.5 py-0.5 rounded-full capitalize">
                        {estado}
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
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">Listado de Facturas</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{totalCount} registros encontrados</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportExcel}
                        disabled={isExporting || facturas.length === 0}
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
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-slate-200/50 dark:border-slate-800/50">
                                <TableHead className="w-[140px] font-serif font-bold text-slate-900 dark:text-slate-100 py-5 pl-6">Número</TableHead>
                                <TableHead className="font-serif font-bold text-slate-900 dark:text-slate-100 py-5">Cliente</TableHead>
                                <TableHead className="font-serif font-bold text-slate-900 dark:text-slate-100 py-5 text-center hidden md:table-cell">Emisión</TableHead>
                                <TableHead className="font-serif font-bold text-slate-900 dark:text-slate-100 py-5 text-center hidden lg:table-cell">Vencimiento</TableHead>
                                <TableHead className="font-serif font-bold text-slate-900 dark:text-slate-100 py-5 text-center">Estado</TableHead>
                                <TableHead className="font-serif font-bold text-slate-900 dark:text-slate-100 py-5 text-right">Total</TableHead>
                                <TableHead className="w-[80px] py-5 pr-6"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {facturas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3 animate-in zoom-in duration-500">
                                            <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                                <FileWarning className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-medium">No se encontraron facturas</p>
                                            <Button variant="link" onClick={() => router.push(window.location.pathname)} className="text-primary hover:text-primary/80">
                                                Limpiar todos los filtros
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                facturas.map((factura, index) => (
                                    <TableRow 
                                        key={factura.id} 
                                        className="group hover:bg-primary/5 border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300 animate-in fade-in slide-in-from-left-4"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <TableCell className="py-4 pl-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                                                    <HighlightText 
                                                        text={formatFacturaDisplayNumero(factura.serie, factura.numero)}
                                                        query={searchQuery}
                                                    />
                                                </span>
                                                {factura.es_externa && (
                                                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mt-0.5">EXTERNA</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col max-w-[200px] sm:max-w-xs md:max-w-md">
                                                <span className="font-medium text-slate-900 dark:text-slate-200 truncate group-hover:underline underline-offset-4 decoration-primary/30">
                                                    <HighlightText 
                                                        text={factura.cliente?.nombre_fiscal || factura.cliente?.nombre_comercial || '-'}
                                                        query={searchQuery}
                                                    />
                                                </span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                                    {factura.cliente?.cif || '-'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center py-4 hidden md:table-cell">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                {formatDate(factura.fecha_emision)}
                                            </span>
                                        </TableCell>
                                        <TableCell className={cn('text-center py-4 hidden lg:table-cell', isVencida(factura.fecha_vencimiento) && factura.estado !== 'pagada' && factura.estado !== 'anulada' && 'text-red-500 font-bold')}>
                                            <div className="flex items-center justify-center gap-1.5">
                                                {formatDate(factura.fecha_vencimiento)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            <div className="flex flex-col items-center gap-1">
                                                {getEstadoBadge(factura)}
                                                {enviadaIds.includes(factura.id) && (
                                                    <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 uppercase">
                                                        <Check className="h-2.5 w-2.5" />
                                                        Enviada
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-4 font-mono font-bold tracking-tight text-slate-900 dark:text-white">
                                            {formatCurrency(factura.total, factura.divisa || undefined)}
                                        </TableCell>
                                        <TableCell className="py-4 pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        className="h-11 w-11 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90"
                                                        aria-label="Más opciones"
                                                    >
                                                        <MoreVertical className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 p-1 border-white/20 bg-white/90 backdrop-blur-lg dark:border-white/10 dark:bg-slate-900/90 shadow-2xl rounded-xl">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/ventas/facturas/${factura.id}`} className="flex items-center cursor-pointer rounded-lg">
                                                            <Eye className="mr-2 h-4 w-4 text-blue-500" /> Ver Detalles
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/ventas/facturas/${factura.id}/pdf`} target="_blank" className="flex items-center cursor-pointer rounded-lg">
                                                            <Download className="mr-2 h-4 w-4 text-emerald-500" /> Descargar PDF
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/ventas/facturas/${factura.id}/enviar`} className="flex items-center cursor-pointer rounded-lg">
                                                            <Mail className="mr-2 h-4 w-4 text-primary" /> Enviar por Email
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1 mx-1" />
                                                    <DropdownMenuItem asChild disabled={factura.estado !== 'borrador'}>
                                                        <Link href={`/ventas/facturas/${factura.id}/editar`} className="flex items-center cursor-pointer rounded-lg">
                                                            <Edit className="mr-2 h-4 w-4 text-amber-500" /> Editar Borrador
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        disabled={factura.estado === 'pagada'}
                                                        className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer rounded-lg"
                                                        onClick={() => setDeleteTarget({ id: factura.id, numero: formatFacturaDisplayNumero(factura.serie, factura.numero) })}
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" /> Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-1">
                    <p className="text-xs text-slate-500 font-medium order-2 sm:order-1">
                        Mostrando página {currentPage} de {totalPages} ({totalCount} unidades)
                    </p>
                    <div className="flex items-center gap-1 order-1 sm:order-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-9 w-9 p-0 border-white/20 bg-white/50 dark:bg-slate-800/50 hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg shadow-sm"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1 px-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum = i + 1
                                if (totalPages > 5 && currentPage > 3) {
                                    pageNum = currentPage - 2 + i
                                    if (pageNum > totalPages) pageNum = totalPages - (4 - i)
                                }
                                
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => handlePageChange(pageNum)}
                                        className={cn(
                                            "h-9 w-9 p-0 rounded-lg transition-all duration-300",
                                            currentPage === pageNum ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "hover:bg-primary/5 text-slate-600 dark:text-slate-400"
                                        )}
                                    >
                                        {pageNum}
                                    </Button>
                                )
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="h-9 w-9 p-0 border-white/20 bg-white/50 dark:bg-slate-800/50 hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg shadow-sm"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="¿Eliminar factura?"
                description={`Esta acción eliminará permanentemente la factura ${deleteTarget?.numero} y todos sus registros asociados.`}
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                variant="destructive"
            />
        </div>
    )
}
