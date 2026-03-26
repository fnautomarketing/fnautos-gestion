'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Search, X, Calendar, ArrowUpDown, SlidersHorizontal, ChevronDown, Repeat } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 350
const currentYear = new Date().getFullYear()

const PERIODO_OPTIONS = [
    { value: 'todos', label: 'Todas las fechas' },
    { value: 'este-mes', label: 'Este mes' },
    { value: 'este-anio', label: 'Este año' },
    { value: 'rango', label: 'Rango personalizado' },
]

const ESTADOS = [
    { value: 'todos', label: 'Todos', color: '' },
    { value: 'borrador', label: 'Borrador', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { value: 'pendiente_firma', label: 'Enviado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    { value: 'firmado', label: 'Firmado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    { value: 'anulado', label: 'Anulado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
]

const TIPOS = [
    { value: 'todos', label: 'Todos' },
    { value: 'venta', label: 'Venta' },
    { value: 'compra', label: 'Compra' },
]

const PAGE_SIZE_OPTIONS = [
    { value: '10', label: '10' },
    { value: '25', label: '25' },
    { value: '50', label: '50' },
]

const ORDEN_OPTIONS = [
    { value: 'fecha_desc', label: 'Más reciente' },
    { value: 'fecha_asc', label: 'Más antiguo' },
    { value: 'numero_asc', label: 'Número 0001→9999' },
    { value: 'numero_desc', label: 'Número 9999→0001' },
    { value: 'total_desc', label: 'Mayor importe' },
    { value: 'total_asc', label: 'Menor importe' },
    { value: 'estado_asc', label: 'Estado A→Z' },
    { value: 'estado_desc', label: 'Estado Z→A' },
]

function getPeriodoFromParams(params: URLSearchParams): { periodo: string; desde: string; hasta: string } {
    const desde = params.get('desde')
    const hasta = params.get('hasta')
    const mes = params.get('mes')
    const anio = params.get('anio')
    if (desde && hasta) return { periodo: 'rango', desde, hasta }
    if (mes && anio) {
        const m = parseInt(mes, 10)
        const a = parseInt(anio, 10)
        const hoy = new Date()
        if (m === hoy.getMonth() + 1 && a === hoy.getFullYear()) return { periodo: 'este-mes', desde: '', hasta: '' }
        const d = `${a}-${String(m).padStart(2, '0')}-01`
        const lastDay = new Date(a, m, 0).getDate()
        const h = `${a}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
        return { periodo: 'rango', desde: d, hasta: h }
    }
    if (anio && !mes) {
        if (parseInt(anio, 10) === currentYear) return { periodo: 'este-anio', desde: '', hasta: '' }
        return { periodo: 'rango', desde: `${anio}-01-01`, hasta: `${anio}-12-31` }
    }
    return { periodo: 'todos', desde: '', hasta: '' }
}

export function ContratosFilters({ pageSize: initialPageSize = 10 }: { pageSize?: number }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const [busqueda, setBusqueda] = useState(searchParams.get('q') || '')
    const [estado, setEstado] = useState(searchParams.get('estado') || 'todos')
    const [tipo, setTipo] = useState(searchParams.get('tipo') || 'todos')
    const [periodo, setPeriodo] = useState(() => getPeriodoFromParams(searchParams).periodo)
    const [customDesde, setCustomDesde] = useState(() => getPeriodoFromParams(searchParams).desde)
    const [customHasta, setCustomHasta] = useState(() => getPeriodoFromParams(searchParams).hasta)
    const [orden, setOrden] = useState(searchParams.get('orden') || 'fecha_desc')
    const [pageSize, setPageSize] = useState(searchParams.get('pageSize') || String(initialPageSize))
    const [periodoOpen, setPeriodoOpen] = useState(false)

    useEffect(() => {
        const q = searchParams.get('q') || ''
        const est = searchParams.get('estado') || 'todos'
        const tp = searchParams.get('tipo') || 'todos'
        const ord = searchParams.get('orden') || 'fecha_desc'
        const pSize = searchParams.get('pageSize') || String(initialPageSize)
        const { periodo: p, desde: d, hasta: h } = getPeriodoFromParams(searchParams)

        if (busqueda !== q) setBusqueda(q)
        if (estado !== est) setEstado(est)
        if (tipo !== tp) setTipo(tp)
        if (orden !== ord) setOrden(ord)
        if (pageSize !== pSize) setPageSize(pSize)
        if (periodo !== p) setPeriodo(p)
        if (customDesde !== d) setCustomDesde(d)
        if (customHasta !== h) setCustomHasta(h)
    }, [searchParams, initialPageSize])

    const applySearch = useCallback((q: string) => {
        const trimmed = q.trim()
        const params = new URLSearchParams(searchParams.toString())
        if ((params.get('q') || '') === trimmed) return
        if (trimmed) params.set('q', trimmed)
        else params.delete('q')
        params.delete('page')
        router.push(`/ventas/contratos?${params.toString()}`)
        router.refresh()
    }, [searchParams, router])

    useEffect(() => {
        const t = setTimeout(() => applySearch(busqueda), DEBOUNCE_MS)
        return () => clearTimeout(t)
    }, [busqueda, applySearch])

    const applyPeriodo = useCallback((p: string, d?: string, h?: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('mes')
        params.delete('anio')
        params.delete('desde')
        params.delete('hasta')
        params.delete('page')

        if (p === 'todos') {
            // Sin filtro de fecha
        } else if (p === 'este-mes') {
            const hoy = new Date()
            params.set('mes', String(hoy.getMonth() + 1))
            params.set('anio', String(hoy.getFullYear()))
        } else if (p === 'este-anio') {
            params.set('anio', String(currentYear))
        } else if (p === 'rango' && d && h && d <= h) {
            params.set('desde', d)
            params.set('hasta', h)
        }
        
        const queryString = params.toString()
        startTransition(() => {
            router.push(`/ventas/contratos?${queryString}`)
            router.refresh()
        })
        setPeriodoOpen(false)
    }, [searchParams, router])

    const handlePeriodoPill = (p: string) => {
        setPeriodo(p)
        if (p === 'rango') {
            setPeriodoOpen(true)
            return
        }
        applyPeriodo(p)
    }

    const handleApplyRango = () => {
        if (customDesde && customHasta && customDesde <= customHasta) {
            setPeriodo('rango')
            applyPeriodo('rango', customDesde, customHasta)
        }
    }

    const handleEstado = (value: string) => {
        setEstado(value)
        const params = new URLSearchParams(searchParams.toString())
        if (value !== 'todos') params.set('estado', value)
        else params.delete('estado')
        params.delete('page')
        startTransition(() => { router.push(`/ventas/contratos?${params.toString()}`); router.refresh() })
    }

    const handleTipo = (value: string) => {
        setTipo(value)
        const params = new URLSearchParams(searchParams.toString())
        if (value !== 'todos') params.set('tipo', value)
        else params.delete('tipo')
        params.delete('page')
        startTransition(() => { router.push(`/ventas/contratos?${params.toString()}`); router.refresh() })
    }

    const handleOrden = (value: string) => {
        setOrden(value)
        const params = new URLSearchParams(searchParams.toString())
        if (value !== 'fecha_desc') params.set('orden', value)
        else params.delete('orden')
        params.delete('page')
        startTransition(() => { router.push(`/ventas/contratos?${params.toString()}`); router.refresh() })
    }

    const handlePageSizeChange = (value: string) => {
        setPageSize(value)
        const params = new URLSearchParams(searchParams.toString())
        params.set('pageSize', value)
        params.set('page', '1')
        startTransition(() => { router.push(`/ventas/contratos?${params.toString()}`); router.refresh() })
    }

    const handleLimpiar = () => {
        setBusqueda('')
        setEstado('todos')
        setTipo('todos')
        setPeriodo('todos')
        setCustomDesde('')
        setCustomHasta('')
        setOrden('fecha_desc')
        startTransition(() => { router.push('/ventas/contratos'); router.refresh() })
    }

    const tieneFiltrosActivos =
        !!busqueda.trim() || estado !== 'todos' || tipo !== 'todos' || periodo !== 'todos' || orden !== 'fecha_desc'

    const periodoLabel =
        periodo === 'todos' ? 'Todas las fechas' :
            periodo === 'este-mes' ? 'Este mes' :
                periodo === 'este-anio' ? 'Este año' :
                    customDesde && customHasta ? `${customDesde} – ${customHasta}` : 'Rango personalizado'

    return (
        <Card data-testid="contratos-filters" className="border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/80 shadow-md overflow-hidden">
            <CardContent className="p-5">
                <div className="flex flex-col gap-5">
                    {/* Búsqueda */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="relative flex-1 min-w-0 group" role="search">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Buscar por cliente, matrícula, número o importe…"
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                className="pl-10 h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50"
                                disabled={isPending}
                            />
                            {busqueda && (
                                <button type="button" onClick={() => setBusqueda('')}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {tieneFiltrosActivos && (
                            <Button variant="ghost" size="sm" onClick={handleLimpiar} disabled={isPending}
                                className="text-slate-500 hover:text-destructive h-11 px-4">
                                <X className="h-4 w-4 mr-2" />
                                Limpiar filtros
                            </Button>
                        )}
                    </div>

                    {/* Período */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Intervalo de Tiempo</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {PERIODO_OPTIONS.map(p => {
                                const isActive = periodo === p.value
                                return (
                                    <Button
                                        key={p.value}
                                        type="button"
                                        variant={isActive ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handlePeriodoPill(p.value)}
                                        disabled={isPending}
                                        className={cn(
                                            'h-9 rounded-xl text-xs font-semibold px-4 transition-all duration-300',
                                            isActive 
                                                ? 'bg-primary text-white shadow-lg border-transparent' 
                                                : 'bg-white hover:bg-primary/5'
                                        )}
                                    >
                                        {p.label}
                                    </Button>
                                )
                            })}
                            {periodo === 'rango' && (
                                <Popover open={periodoOpen} onOpenChange={setPeriodoOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs px-4">
                                            {customDesde && customHasta ? `${format(new Date(customDesde), 'dd MMM', { locale: es })} – ${format(new Date(customHasta), 'dd MMM', { locale: es })}` : 'Seleccionar rango'}
                                            <ChevronDown className="ml-2 h-3 w-3" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-5 rounded-2xl shadow-xl">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase text-slate-500">Desde</Label>
                                                    <Input type="date" value={customDesde} onChange={e => setCustomDesde(e.target.value)} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase text-slate-500">Hasta</Label>
                                                    <Input type="date" value={customHasta} onChange={e => setCustomHasta(e.target.value)} />
                                                </div>
                                            </div>
                                            <Button className="w-full" onClick={handleApplyRango}
                                                disabled={!customDesde || !customHasta || customDesde > customHasta}>
                                                Confirmar rango
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </div>

                    {/* Estado + Tipo + Orden */}
                    <div className="flex flex-col gap-5 border-t border-slate-100 dark:border-slate-800 pt-5">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-400">
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Filtrado por Estado</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {ESTADOS.map(e => {
                                    const isActive = estado === e.value
                                    return (
                                        <button
                                            key={e.value}
                                            type="button"
                                            disabled={isPending}
                                            onClick={() => handleEstado(e.value)}
                                            className={cn(
                                                'px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-300',
                                                isActive 
                                                    ? cn(e.color || 'bg-slate-900 text-white shadow-md', 'border-transparent') 
                                                    : 'bg-white text-slate-600 hover:bg-primary/5'
                                            )}
                                        >
                                            {e.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-end gap-5">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-1">Tipo</Label>
                                <Select value={tipo} onValueChange={handleTipo} disabled={isPending}>
                                    <SelectTrigger className="w-[140px] h-11 rounded-xl">
                                        <Repeat className="h-3.5 w-3.5 mr-2" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIPOS.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-1">Ordenar por</Label>
                                <Select value={orden} onValueChange={handleOrden} disabled={isPending}>
                                    <SelectTrigger className="w-[200px] h-11 rounded-xl">
                                        <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ORDEN_OPTIONS.map(o => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-1">Filas</Label>
                                <Select value={pageSize} onValueChange={handlePageSizeChange} disabled={isPending}>
                                    <SelectTrigger className="w-[85px] h-11 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAGE_SIZE_OPTIONS.map(o => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {tieneFiltrosActivos && (
                                <div className="ml-auto flex items-center pt-2">
                                    <Badge variant="secondary" className="h-7 bg-slate-100 text-slate-600">
                                        Filtros activos
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
