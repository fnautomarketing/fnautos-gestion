'use client'

import { useState, useEffect, useCallback } from 'react'

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)')
        setIsMobile(mq.matches)
        const fn = () => setIsMobile(mq.matches)
        mq.addEventListener('change', fn)
        return () => mq.removeEventListener('change', fn)
    }, [])
    return isMobile
}
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Eye, Edit, Trash2, Search, Download, X } from 'lucide-react'
import { eliminarClienteAction } from '@/app/actions/clientes'
import { toast } from 'sonner'
import { Cliente } from '@/types/ventas'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 350
type SortCol = 'nombre' | 'cif' | 'facturacion' | 'estado'
const SORT_MAP: Record<SortCol, { asc: string; desc: string }> = {
    nombre: { asc: 'nombre_asc', desc: 'nombre_desc' },
    cif: { asc: 'cif_asc', desc: 'cif_desc' },
    facturacion: { asc: 'facturacion_asc', desc: 'facturacion_desc' },
    estado: { asc: 'estado_asc', desc: 'estado_desc' },
}

interface ClientesTablaProps {
    clientes: Cliente[]
    searchParams?: { search?: string; estado?: string; orden?: string }
}

export function ClientesTabla({ clientes, searchParams = {} }: ClientesTablaProps) {
    const router = useRouter()
    const urlParams = useSearchParams()
    const isMobile = useIsMobile()
    const [search, setSearch] = useState(searchParams.search || '')
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deleteName, setDeleteName] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => setSearch(urlParams.get('search') || ''), [urlParams.get('search')])

    const updateUrl = useCallback((updates: { search?: string; estado?: string; orden?: string }) => {
        const params = new URLSearchParams(urlParams.toString())
        if (updates.search !== undefined) updates.search ? params.set('search', updates.search) : params.delete('search')
        if (updates.estado !== undefined) updates.estado ? params.set('estado', updates.estado) : params.delete('estado')
        if (updates.orden !== undefined) updates.orden !== 'nombre_asc' ? params.set('orden', updates.orden) : params.delete('orden')
        router.push(`/ventas/clientes?${params.toString()}`)
        router.refresh()
    }, [router, urlParams])

    useEffect(() => {
        const t = setTimeout(() => {
            const current = urlParams.get('search') || ''
            if (search.trim() !== current) updateUrl({ search: search.trim() || undefined })
        }, DEBOUNCE_MS)
        return () => clearTimeout(t)
    }, [search, updateUrl, urlParams])

    const clientesFiltrados = clientes

    const confirmDelete = async () => {
        if (!deleteId) return
        setIsDeleting(true)
        const result = await eliminarClienteAction(deleteId)
        setIsDeleting(false)

        if (result.success) {
            toast.success('Cliente eliminado correctamente')
            setDeleteId(null)
            setDeleteName(null)
            router.refresh()
        } else {
            toast.error(result.error || 'Error al eliminar cliente')
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)
    }

    const estado = urlParams.get('estado') || 'todos'
    const orden = urlParams.get('orden') || 'nombre_asc'

    const handleSort = (col: SortCol) => {
        const { asc, desc } = SORT_MAP[col]
        updateUrl({ orden: orden === asc ? desc : asc })
    }
    const getSortIndicator = (col: SortCol) => {
        const { asc, desc } = SORT_MAP[col]
        if (orden === asc) return ' ↑'
        if (orden === desc) return ' ↓'
        return ''
    }

    const exportCsv = () => {
        const headers = ['Nombre', 'CIF', 'Email', 'Teléfono', 'Ciudad', 'Facturación', 'Estado']
        const rows = clientesFiltrados.map((c) => [
            c.nombre_fiscal || '',
            c.cif || '',
            c.email_principal || '',
            c.telefono_principal || '',
            c.ciudad || '',
            String(c.total_facturado ?? 0),
            c.activo ? 'Activo' : 'Inactivo',
        ])
        const csv = [headers.join(';'), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))].join('\n')
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(a.href)
    }

    const exportUrl = (format: 'csv' | 'xlsx') => {
        const params = new URLSearchParams(urlParams.toString())
        params.set('format', format)
        return `/api/ventas/clientes/export?${params.toString()}`
    }

    return (
        <div className="space-y-4" data-testid="clientes-tabla">
            {/* Búsqueda + Filtros + Exportar */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between bg-white/40 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-primary" aria-hidden />
                    <Input
                        data-testid="clientes-search"
                        placeholder="Buscar por nombre, CIF..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-11 min-h-[48px] sm:min-h-0 bg-white dark:bg-slate-950 border-slate-200/60 dark:border-slate-800/60 focus:ring-2 focus:ring-primary/20 transition-all duration-300 rounded-xl"
                        role="searchbox"
                        aria-label="Buscar clientes"
                    />
                    {search && (
                        <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" aria-label="Limpiar búsqueda">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        {(['todos', 'activos', 'inactivos'] as const).map((e) => (
                            <Button
                                key={e}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    'h-9 px-4 rounded-lg transition-all duration-300 text-xs font-semibold',
                                    estado === e 
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600/50' 
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                                )}
                                onClick={() => updateUrl({ estado: e === 'todos' ? undefined : e })}
                            >
                                {e === 'todos' ? 'Todos' : e === 'activos' ? 'Activos' : 'Inactivos'}
                            </Button>
                        ))}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="lg" className="h-[48px] sm:h-9 border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 rounded-xl">
                                <Download className="h-4 w-4 mr-2 text-slate-500" />
                                <span className="text-sm font-medium">Exportar</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl">
                            <DropdownMenuItem onClick={exportCsv} className="rounded-lg cursor-pointer">Exportar CSV (página)</DropdownMenuItem>
                            <DropdownMenuSeparator className="opacity-50" />
                            <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                <a href={exportUrl('csv')} download className="w-full">Exportar todos (CSV)</a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                <a href={exportUrl('xlsx')} download className="w-full">Exportar todos (Excel)</a>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Tabla Desktop - solo render en desktop para evitar duplicados en DOM (tests E2E) */}
            {!isMobile && (
            <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl transition-all duration-300">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50">
                                    <TableHead className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 cursor-pointer hover:text-primary transition-colors select-none" onClick={() => handleSort('nombre')} data-testid="clientes-th-nombre">
                                        <div className="flex items-center gap-1.5">
                                            Cliente{getSortIndicator('nombre')}
                                        </div>
                                    </TableHead>
                                    <TableHead className="py-4 font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 cursor-pointer hover:text-primary transition-colors select-none" onClick={() => handleSort('cif')} data-testid="clientes-th-cif">CIF{getSortIndicator('cif')}</TableHead>
                                    <TableHead className="py-4 font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 hidden lg:table-cell">Contacto</TableHead>
                                    <TableHead className="py-4 text-right font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 cursor-pointer hover:text-primary transition-colors select-none" onClick={() => handleSort('facturacion')} data-testid="clientes-th-facturacion">Facturación{getSortIndicator('facturacion')}</TableHead>
                                    <TableHead className="py-4 text-center font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 cursor-pointer hover:text-primary transition-colors select-none" onClick={() => handleSort('estado')} data-testid="clientes-th-estado">Estado{getSortIndicator('estado')}</TableHead>
                                    <TableHead className="w-[80px] px-6"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clientesFiltrados.map((cliente, idx) => {
                                    const iniciales = cliente.nombre_fiscal.substring(0, 2).toUpperCase()
                                    return (
                                        <TableRow
                                            key={cliente.id}
                                            data-client-id={cliente.id}
                                            className="group cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all duration-300 border-b border-slate-100/50 dark:border-slate-800/50 animate-in fade-in slide-in-from-left-2"
                                            style={{ animationDelay: `${idx * 30}ms` } as React.CSSProperties}
                                            onClick={() => router.push(`/ventas/clientes/${cliente.id}`)}
                                        >
                                            <TableCell className="py-5 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold shadow-sm group-hover:shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                                        {iniciales}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-slate-900 dark:text-white block truncate leading-none mb-1.5 tracking-tight group-hover:text-primary transition-colors">
                                                            {cliente.nombre_fiscal}
                                                        </span>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{cliente.ciudad}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="px-2 py-1 rounded-md bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 inline-block">
                                                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300 font-bold tracking-tighter uppercase whitespace-nowrap">
                                                        {cliente.cif}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 hidden lg:table-cell">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{cliente.email_principal}</span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{cliente.telefono_principal}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 text-right px-4">
                                                <span className="text-sm md:text-base font-bold text-slate-900 dark:text-white tabular-nums" suppressHydrationWarning>
                                                    {formatCurrency(cliente.total_facturado || 0)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-5 text-center">
                                                <Badge variant="outline" className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-sm transition-all duration-300",
                                                    cliente.activo
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 group-hover:scale-110'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                )}>
                                                    {cliente.activo ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all duration-300" aria-label="Más opciones">
                                                            <MoreVertical className="h-5 w-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-2xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl">
                                                        <DropdownMenuItem onClick={() => router.push(`/ventas/clientes/${cliente.id}`)} className="rounded-xl cursor-pointer py-2.5 px-3">
                                                            <Eye className="h-4 w-4 mr-3 text-slate-500" /> <span className="font-medium">Ver Detalle</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.push(`/ventas/clientes/${cliente.id}/editar`)} className="rounded-xl cursor-pointer py-2.5 px-3">
                                                            <Edit className="h-4 w-4 mr-3 text-slate-500" /> <span className="font-medium">Editar Perfil</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="my-1 opacity-50" />
                                                        <DropdownMenuItem
                                                            className="text-red-500 hover:text-red-600 focus:text-red-600 cursor-pointer rounded-xl py-2.5 px-3 focus:bg-red-50 dark:focus:bg-red-950/30"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setDeleteId(cliente.id)
                                                                setDeleteName(cliente.nombre_fiscal)
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-3" /> <span className="font-bold">Eliminar Cliente</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {clientesFiltrados.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 py-8">
                                            <div className="flex flex-col items-center justify-center text-center" data-testid="clientes-empty">
                                                <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron clientes con esos criterios.</p>
                                                <Link href="/ventas/clientes/nuevo" className="mt-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                                                    Crear cliente
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            )}

            {/* Vista Móvil (Cards) - solo render en móvil para evitar duplicados en DOM */}
            {isMobile && (
            <div className="grid gap-4">
                {clientesFiltrados.map((cliente) => {
                    const iniciales = cliente.nombre_fiscal.substring(0, 2).toUpperCase()
                    return (
                        <Card key={cliente.id} data-client-id={cliente.id} className="border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 shadow-lg">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md">
                                            {iniciales}
                                        </div>
                                        <div>
                                            <Link href={`/ventas/clientes/${cliente.id}`} className="font-bold text-slate-900 dark:text-slate-100 hover:text-primary transition-colors block text-lg">
                                                {cliente.nombre_fiscal}
                                            </Link>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono font-medium">{cliente.cif}</p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 min-h-[44px] min-w-[44px] text-slate-500 hover:text-primary" aria-label="Más opciones">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-white/90 backdrop-blur-xl dark:bg-slate-900/90 border-slate-200 dark:border-slate-800">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/ventas/clientes/${cliente.id}`} className="flex items-center cursor-pointer">
                                                    <Eye className="h-4 w-4 mr-2" /> Ver Detalle
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/ventas/clientes/${cliente.id}/editar`} className="flex items-center cursor-pointer">
                                                    <Edit className="h-4 w-4 mr-2" /> Editar
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600 focus:text-red-600 cursor-pointer"
                                                onClick={() => {
                                                    setDeleteId(cliente.id)
                                                    setDeleteName(cliente.nombre_fiscal)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Contacto</p>
                                        <p className="text-slate-900 dark:text-slate-100 truncate font-medium">{cliente.email_principal}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Estado</p>
                                        <Badge variant="outline" className={`border ${cliente.activo
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800'
                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                            }`}>
                                            {cliente.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Facturado</span>
                                    <span className="font-bold text-slate-900 dark:text-slate-100 text-lg" suppressHydrationWarning>
                                        {formatCurrency(cliente.total_facturado || 0)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
                {clientesFiltrados.length === 0 && (
                    <div className="p-8 text-center bg-white/70 dark:bg-slate-900/60 rounded-xl border border-white/20 dark:border-white/10" data-testid="clientes-empty-mobile">
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron clientes.</p>
                        <Link href="/ventas/clientes/nuevo" className="mt-3 inline-block text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                            Crear cliente
                        </Link>
                    </div>
                )}
            </div>
            )}

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente al cliente <strong>{deleteName}</strong> y no se puede deshacer.
                            Si tiene facturas asociadas, no se podrá eliminar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Eliminando...' : 'Eliminar Cliente'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
