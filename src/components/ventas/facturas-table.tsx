'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MoreVertical, Eye, Edit, Trash, FileWarning, Download, Mail, ChevronDown, FileSpreadsheet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { formatFacturaDisplayNumero, cn } from '@/lib/utils'
import { FacturaWithCliente } from '@/types/ventas'
import { eliminarFacturaAction } from '@/app/actions/ventas'
import { toast } from 'sonner'

interface FacturasTableProps {
    facturas: FacturaWithCliente[]
    totalCount: number
    currentPage: number
    pageSize: number
    searchQuery?: string
    enviadaIds?: string[]
}

/** Resalta las coincidencias del término de búsqueda en el texto (case-insensitive).
 * Solo aplica resaltado tras montar en cliente para evitar errores de hidratación. */
function HighlightedText({ text, query }: { text: string; query?: string }) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    if (!mounted || !query?.trim() || !text) return <>{text}</>

    const q = query.trim()
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return (
        <>
            {parts.map((part, i) =>
                i % 2 === 1 ? (
                    <mark key={i} className="bg-amber-200 dark:bg-amber-600/50 text-amber-900 dark:text-amber-100 rounded px-0.5 font-medium">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    )
}

type SortColumn = 'numero' | 'cliente' | 'fecha_emision' | 'fecha_vencimiento' | 'total' | 'estado'
const SORT_MAP: Record<SortColumn, { asc: string; desc: string }> = {
    numero: { asc: 'numero_asc', desc: 'numero_desc' },
    cliente: { asc: 'cliente_asc', desc: 'cliente_desc' },
    fecha_emision: { asc: 'fecha_asc', desc: 'fecha_desc' },
    fecha_vencimiento: { asc: 'fecha_vencimiento_asc', desc: 'fecha_vencimiento_desc' },
    total: { asc: 'total_asc', desc: 'total_desc' },
    estado: { asc: 'estado_asc', desc: 'estado_desc' },
}

export function FacturasTable({
    facturas,
    totalCount,
    currentPage,
    pageSize,
    searchQuery,
    enviadaIds = [],
}: FacturasTableProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentOrden = searchParams.get('orden') || 'fecha_desc'
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [exportingAll, setExportingAll] = useState(false)

    const formatCurrency = (amount: number, currency: string = 'EUR') => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: currency,
        }).format(amount)
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-'
        return format(new Date(dateStr), 'dd MMM, yyyy', { locale: es })
    }

    const getEstadoBadge = (factura: FacturaWithCliente) => {
        const estado = factura.estado
        const esExterna = !!factura.es_externa
        const esEnviada = enviadaIds.includes(factura.id)

        const variants: Record<string, { label: string; className: string }> = {
            pagada: {
                label: 'Pagada',
                className: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800',
            },
            parcial: {
                label: 'Parcial',
                className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800',
            },
            emitida: {
                label: 'Emitida',
                className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
            },
            vencida: {
                label: 'Vencida',
                className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800',
            },
            borrador: {
                label: 'Borrador',
                className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
            },
            anulada: {
                label: 'Anulada',
                className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800',
            },
        }

        // Externa: siempre mostrar "Externa" (coincide con filtro)
        if (esExterna) {
            if (estado === 'borrador' && !factura.archivo_url) {
                return (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800 px-2.5 py-1 font-medium text-xs whitespace-nowrap max-w-full truncate" variant="outline" title="Externa (Pendiente PDF)">
                        Externa (Pend. PDF)
                    </Badge>
                )
            }
            const sub = estado === 'pagada' ? ' - Pagada' : estado === 'emitida' ? ' - Emitida' : ''
            return (
                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800 px-2.5 py-1 font-medium text-xs whitespace-nowrap max-w-full truncate" variant="outline" title={`Externa${sub}`}>
                    Externa{sub}
                </Badge>
            )
        }

        // Enviada: factura enviada por email (coincide con filtro)
        if (esEnviada) {
            return (
                <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800 px-3 py-1 font-medium" variant="outline">
                    Enviada
                </Badge>
            )
        }

        const variant = variants[estado] || variants.borrador
        return (
            <Badge className={`border ${variant.className} px-3 py-1 font-medium capitalize`} variant="outline">
                {variant.label}
            </Badge>
        )
    }

    const totalPages = Math.ceil(totalCount / pageSize)

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(window.location.search)
        params.set('page', page.toString())
        router.push(`/ventas/facturas?${params.toString()}`)
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            const result = await eliminarFacturaAction(deleteTarget.id)
            if (result.success) {
                toast.success('Factura eliminada con éxito')
                router.refresh()
            } else {
                toast.error(result.error || 'Error al eliminar la factura')
            }
        } catch {
            toast.error('Error inesperado al eliminar la factura')
        } finally {
            setIsDeleting(false)
            setDeleteTarget(null)
        }
    }

    const exportCsvPage = () => {
        const headers = ['Número', 'Serie', 'Cliente', 'CIF', 'Fecha Emisión', 'Fecha Vencimiento', 'Base Imponible', 'IVA', 'Descuento', 'Retención', 'Total', 'Estado', 'Externa', 'Empresa']
        const rows = facturas.map((f) => [
            formatFacturaDisplayNumero(f.serie, f.numero),
            f.serie || '',
            f.cliente?.nombre_comercial || f.cliente?.nombre_fiscal || '',
            f.cliente?.cif || '',
            f.fecha_emision || '',
            f.fecha_vencimiento || '',
            String(f.base_imponible ?? ''),
            String(f.cuota_iva ?? ''),
            String(f.descuento ?? ''),
            String(f.retencion_irpf ?? ''),
            String(f.total),
            f.estado,
            f.es_externa ? 'Sí' : 'No',
            f.empresa?.nombre_comercial ?? '',
        ])
        const csv = [headers.join(';'), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\n')
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `facturas-pagina-${new Date().toISOString().slice(0, 10)}.csv`
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const buildExportUrl = (format: 'xlsx' | 'csv') => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('format', format)
        params.delete('page')
        params.delete('pageSize')
        return `/api/ventas/facturas/export?${params.toString()}`
    }

    const handleExportAll = (format: 'xlsx' | 'csv') => {
        setExportingAll(true)
        const url = buildExportUrl(format)
        const a = document.createElement('a')
        a.href = url
        a.download = `facturas-${new Date().toISOString().slice(0, 10)}.${format}`
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setExportingAll(false)
    }

    const handleSort = (col: SortColumn) => {
        const { asc, desc } = SORT_MAP[col]
        const nextOrden = currentOrden === asc ? desc : asc
        const params = new URLSearchParams(searchParams.toString())
        params.set('orden', nextOrden)
        params.delete('page')
        router.push(`/ventas/facturas?${params.toString()}`)
    }

    const getSortIndicator = (col: SortColumn) => {
        const { asc, desc } = SORT_MAP[col]
        if (currentOrden === asc) return ' ↑'
        if (currentOrden === desc) return ' ↓'
        return ''
    }

    const isVencida = (fechaVenc: string | null) => {
        if (!fechaVenc) return false
        return new Date(fechaVenc) < new Date(new Date().setHours(0, 0, 0, 0))
    }

    if (facturas.length === 0) {
        return (
            <Card className="border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
                <CardContent className="p-12 text-center">
                    <p className="text-slate-600 dark:text-slate-400 font-medium">No se encontraron facturas</p>
                    <p className="text-sm text-slate-500 mt-2">Prueba a cambiar los filtros o crea tu primera factura</p>
                    <Button asChild className="mt-4" variant="outline">
                        <a href="/ventas/facturas/nueva">Nueva factura</a>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card className="border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 overflow-hidden">
                <CardContent className="p-0">
                    <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" disabled={exportingAll} className="text-xs" data-testid="facturas-export-trigger">
                                    <Download className="h-3.5 w-3.5 mr-1.5" />
                                    Exportar
                                    <ChevronDown className="h-3.5 w-3.5 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={exportCsvPage} data-testid="facturas-export-pagina">
                                    <Download className="h-4 w-4 mr-2" />
                                    Exportar página actual (CSV)
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleExportAll('xlsx')} data-testid="facturas-export-todas-xlsx">
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                    Exportar todas filtradas (Excel)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportAll('csv')} data-testid="facturas-export-todas-csv">
                                    <Download className="h-4 w-4 mr-2" />
                                    Exportar todas filtradas (CSV)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="overflow-x-auto">
                        <Table className="table-fixed w-full">
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                                <TableRow>
                                    <TableHead
                                        className="font-semibold text-slate-600 dark:text-slate-400 w-[120px] min-w-[100px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 select-none"
                                        onClick={(e) => { e.stopPropagation(); handleSort('numero') }}
                                        aria-sort={currentOrden.startsWith('numero') ? (currentOrden === 'numero_asc' ? 'ascending' : 'descending') : undefined}
                                        data-testid="facturas-th-numero"
                                    >
                                        Número{getSortIndicator('numero')}
                                    </TableHead>
                                    <TableHead
                                        className="font-semibold text-slate-600 dark:text-slate-400 min-w-0 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 select-none"
                                        onClick={(e) => { e.stopPropagation(); handleSort('cliente') }}
                                        aria-sort={currentOrden.startsWith('cliente') ? (currentOrden === 'cliente_asc' ? 'ascending' : 'descending') : undefined}
                                        data-testid="facturas-th-cliente"
                                    >
                                        Cliente{getSortIndicator('cliente')}
                                    </TableHead>
                                    <TableHead
                                        className="font-semibold text-slate-600 dark:text-slate-400 w-[115px] hidden md:table-cell cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 select-none"
                                        onClick={(e) => { e.stopPropagation(); handleSort('fecha_emision') }}
                                        aria-sort={currentOrden.startsWith('fecha') && !currentOrden.includes('vencimiento') ? (currentOrden === 'fecha_asc' ? 'ascending' : 'descending') : undefined}
                                        data-testid="facturas-th-fecha-emision"
                                    >
                                        Fecha Emisión{getSortIndicator('fecha_emision')}
                                    </TableHead>
                                    <TableHead
                                        className="font-semibold text-slate-600 dark:text-slate-400 w-[125px] hidden lg:table-cell cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 select-none"
                                        onClick={(e) => { e.stopPropagation(); handleSort('fecha_vencimiento') }}
                                        aria-sort={currentOrden.startsWith('fecha_vencimiento') ? (currentOrden === 'fecha_vencimiento_asc' ? 'ascending' : 'descending') : undefined}
                                        data-testid="facturas-th-fecha-vencimiento"
                                    >
                                        Fecha Venc.{getSortIndicator('fecha_vencimiento')}
                                    </TableHead>
                                    <TableHead
                                        className="text-right font-semibold text-slate-600 dark:text-slate-400 w-[100px] pr-2 md:pr-5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 select-none"
                                        onClick={(e) => { e.stopPropagation(); handleSort('total') }}
                                        aria-sort={currentOrden.startsWith('total') ? (currentOrden === 'total_asc' ? 'ascending' : 'descending') : undefined}
                                        data-testid="facturas-th-total"
                                    >
                                        Total{getSortIndicator('total')}
                                    </TableHead>
                                    <TableHead
                                        className="font-semibold text-slate-600 dark:text-slate-400 w-[140px] min-w-[120px] pl-2 md:pl-5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 select-none"
                                        onClick={(e) => { e.stopPropagation(); handleSort('estado') }}
                                        aria-sort={currentOrden.startsWith('estado') ? (currentOrden === 'estado_asc' ? 'ascending' : 'descending') : undefined}
                                        data-testid="facturas-th-estado"
                                    >
                                        Estado{getSortIndicator('estado')}
                                    </TableHead>
                                    <TableHead className="w-[48px] md:w-[56px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {facturas.map((factura) => (
                                    <TableRow
                                        key={factura.id}
                                        data-testid="factura-row"
                                        className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                        onClick={() => router.push(`/ventas/facturas/${factura.id}`)}
                                    >
                                        <TableCell className="font-mono font-medium text-slate-700 dark:text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <HighlightedText
                                                    text={formatFacturaDisplayNumero(factura.serie, factura.numero)}
                                                    query={searchQuery}
                                                />
                                                {factura.es_externa && (
                                                    <div className="flex gap-1" title="Factura Externa">
                                                        <Badge variant="secondary" className="h-5 px-1 text-[10px] bg-blue-50 text-blue-700 border-blue-100">EXT</Badge>
                                                        {!factura.archivo_url && (
                                                            <span title="Pendiente de PDF" className="flex items-center text-amber-600">
                                                                <FileWarning className="h-4 w-4" />
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="w-[200px] max-w-[200px] min-w-0 overflow-hidden !whitespace-normal">
                                            <div className="flex flex-col min-w-0 overflow-hidden w-full">
                                                <span className="font-medium text-slate-900 dark:text-slate-100 truncate" title={factura.cliente?.nombre_comercial || factura.cliente?.nombre_fiscal || 'Cliente Desconocido'}>
                                                    <HighlightedText
                                                        text={factura.cliente?.nombre_comercial || factura.cliente?.nombre_fiscal || 'Cliente Desconocido'}
                                                        query={searchQuery}
                                                    />
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate" title={factura.cliente?.cif || '-'}>
                                                    <HighlightedText
                                                        text={factura.cliente?.cif || '-'}
                                                        query={searchQuery}
                                                    />
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600 dark:text-slate-400 hidden md:table-cell">
                                            <span suppressHydrationWarning>{formatDate(factura.fecha_emision)}</span>
                                        </TableCell>
                                        <TableCell className={cn('w-[125px] hidden lg:table-cell', isVencida(factura.fecha_vencimiento) && factura.estado !== 'pagada' && factura.estado !== 'anulada' && 'text-red-600 dark:text-red-400 font-medium')}>
                                            <span suppressHydrationWarning>{formatDate(factura.fecha_vencimiento)}</span>
                                            {isVencida(factura.fecha_vencimiento) && factura.estado !== 'pagada' && factura.estado !== 'anulada' && (
                                                <span className="ml-1 text-[10px] text-red-600 dark:text-red-400" title="Vencida">⚠</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100 pr-2 md:pr-5">
                                            <span suppressHydrationWarning>
                                                <HighlightedText
                                                    text={formatCurrency(factura.total, factura.divisa || undefined)}
                                                    query={searchQuery}
                                                />
                                            </span>
                                        </TableCell>
                                        <TableCell className="pl-2 md:pl-5 min-w-0 overflow-hidden pr-2">
                                            <div className="max-w-full min-w-0 overflow-hidden">
                                                {getEstadoBadge(factura)}
                                            </div>
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()} className="w-[48px] md:w-[120px]">
                                            <div className="flex items-center gap-0.5">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-primary" onClick={(e) => { e.stopPropagation(); router.push(`/ventas/facturas/${factura.id}`) }} title="Ver">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-primary" onClick={(e) => { e.stopPropagation(); router.push(`/ventas/facturas/${factura.id}/pdf`) }} title="Descargar PDF">
                                                    <Download className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-primary" onClick={(e) => { e.stopPropagation(); router.push(`/ventas/facturas/${factura.id}/email`) }} title="Enviar email">
                                                    <Mail className="h-3.5 w-3.5" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-primary">
                                                            <MoreVertical className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-white/90 backdrop-blur-xl dark:bg-slate-900/90 border-slate-200 dark:border-slate-800">
                                                        <DropdownMenuItem onClick={() => router.push(`/ventas/facturas/${factura.id}/editar`)} className="cursor-pointer">
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={() => setDeleteTarget({ id: factura.id, label: formatFacturaDisplayNumero(factura.serie, factura.numero) || factura.id })}>
                                                            <Trash className="h-4 w-4 mr-2" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Paginación */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30">
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 order-2 sm:order-1">
                            Mostrando <span className="font-medium text-slate-900 dark:text-slate-100">{(currentPage - 1) * pageSize + 1}</span>-
                            <span className="font-medium text-slate-900 dark:text-slate-100">{Math.min(currentPage * pageSize, totalCount)}</span> de <span className="font-medium text-slate-900 dark:text-slate-100">{totalCount}</span> facturas
                        </p>
                        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 order-1 sm:order-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="bg-white/50 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800"
                            >
                                Anterior
                            </Button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + 1
                                return (
                                    <Button
                                        key={page}
                                        variant={page === currentPage ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handlePageChange(page)}
                                        className={page === currentPage ? 'bg-primary text-primary-foreground' : 'bg-white/50 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800'}
                                    >
                                        {page}
                                    </Button>
                                )}
                            )}
                            {totalPages > 5 && <span className="text-slate-400">...</span>}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="bg-white/50 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800"
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente la factura <strong>{deleteTarget?.label}</strong> y todas sus líneas asociadas. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
                        >
                            {isDeleting ? 'Eliminando...' : 'Eliminar Factura'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
