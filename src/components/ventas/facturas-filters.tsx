'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Search, X, Calendar, ArrowUpDown, SlidersHorizontal, User, ChevronDown, Check } from 'lucide-react'
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

// ─── Cliente combobox (sin cambios) ───────────────────────────────────────────

interface ClienteOption { id: string; label: string; cif?: string }
interface SearchResult { items: ClienteOption[]; total: number; page: number; totalPages: number }
const EMPTY_RESULT: SearchResult = { items: [], total: 0, page: 1, totalPages: 0 }

function ClienteCombobox({ value, label: initialLabel, onChange, disabled }: { value: string; label?: string; onChange: (id: string, label: string) => void; disabled?: boolean }) {
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [result, setResult] = useState<SearchResult>(EMPTY_RESULT)
    const [loadingMore, setLoadingMore] = useState(false)
    const [searching, setSearching] = useState(false)
    const [selectedLabel, setSelectedLabel] = useState(initialLabel || '')
    const inputRef = useRef<HTMLInputElement>(null)
    const triggerRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const fetchPage = useCallback(async (q: string, page: number, append = false) => {
        if (page === 1) setSearching(true); else setLoadingMore(true)
        try {
            const limit = q ? 25 : 50
            const url = `/api/clientes/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`
            const res = await fetch(url)
            const data: SearchResult = await res.json()
            setResult(prev => append ? { ...data, items: [...prev.items, ...data.items] } : data)
        } catch { if (!append) setResult(EMPTY_RESULT) }
        finally { setSearching(false); setLoadingMore(false) }
    }, [])

    useEffect(() => {
        if (!open) return
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => fetchPage(query, 1), query ? 280 : 0)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [open, query, fetchPage])

    useEffect(() => { setSelectedLabel(initialLabel || '') }, [initialLabel, value])

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50)
    }, [open])

    const handleSelect = (opt: ClienteOption) => {
        setSelectedLabel(opt.label)
        setQuery('')
        setResult(EMPTY_RESULT)
        setOpen(false)
        onChange(opt.id, opt.label)
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedLabel('')
        setQuery('')
        setResult(EMPTY_RESULT)
        onChange('', '')
    }

    const hasMore = result.page < result.totalPages

    return (
        <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery('') }}>
            <PopoverTrigger asChild>
                <div
                    ref={triggerRef}
                    className={cn(
                        'flex items-center gap-2 h-9 px-3 rounded-lg border bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-600 cursor-text transition-all',
                        open && 'ring-2 ring-primary/20 border-primary/50',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => { if (!disabled) { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) } }}
                    data-testid="facturas-filter-cliente-box"
                >
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {value && selectedLabel ? (
                        <span className="text-sm text-slate-900 dark:text-slate-100 truncate flex-1 max-w-[160px]">{selectedLabel}</span>
                    ) : (
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={e => { setQuery(e.target.value); setOpen(true) }}
                            onFocus={() => setOpen(true)}
                            placeholder="Cliente…"
                            className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400 min-w-0"
                            disabled={disabled}
                            data-testid="facturas-filter-cliente-input"
                        />
                    )}
                    {value ? (
                        <button type="button" onClick={handleClear} className="shrink-0 text-slate-400 hover:text-slate-600" data-testid="facturas-filter-cliente-clear">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    ) : (
                        <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform', open && 'rotate-180')} />
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[min(400px,90vw)] p-0"
                align="start"
                sideOffset={4}
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="flex flex-col max-h-[min(320px,70vh)] overflow-hidden">
                    {searching && <div className="px-3 py-2 text-xs text-slate-400">Cargando…</div>}
                    {!searching && query.length === 0 && result.items.length === 0 && <div className="px-3 py-2 text-xs text-slate-400">No hay clientes</div>}
                    {!searching && query.length > 0 && result.items.length === 0 && <div className="px-3 py-2 text-xs text-slate-400">Sin resultados</div>}
                    {result.items.length > 0 && (
                        <div className="overflow-y-auto flex-1">
                            {result.items.map(opt => (
                                <button key={opt.id} type="button" onMouseDown={() => handleSelect(opt)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between gap-2"
                                    data-testid={`cliente-option-${opt.id}`}>
                                    <span className="truncate font-medium">{opt.label}</span>
                                    {opt.cif && <span className="text-xs text-slate-400 shrink-0">{opt.cif}</span>}
                                </button>
                            ))}
                        </div>
                    )}
                    {result.items.length > 0 && (
                        <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 shrink-0">
                            <span className="text-[11px] text-slate-400">{result.items.length} de {result.total}</span>
                            {hasMore && (
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); fetchPage(query, result.page + 1, true) }}
                                    disabled={loadingMore} className="text-[11px] text-primary hover:underline font-medium disabled:opacity-50"
                                    data-testid="facturas-filter-cliente-ver-mas">
                                    {loadingMore ? 'Cargando…' : 'Ver más'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

const DEBOUNCE_MS = 350
const currentYear = new Date().getFullYear()

const PERIODO_OPTIONS = [
    { value: 'todos', label: 'Todas las fechas' },
    { value: 'este-mes', label: 'Este mes' },
    { value: 'este-anio', label: 'Este año' },
    { value: 'rango', label: 'Rango personalizado' },
]

// Constantes eliminadas por no usarse: MESES, ANIOS

const ESTADOS: { value: string; label: string; color: string }[] = [
    { value: 'todas', label: 'Todos', color: '' },
    { value: 'borrador', label: 'Borrador', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { value: 'emitida', label: 'Emitida', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    { value: 'enviada', label: 'Enviada', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
    { value: 'pagada', label: 'Pagada', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    { value: 'parcial', label: 'Parcial', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    { value: 'vencida', label: 'Vencida', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    { value: 'externa-emitida', label: 'Externa', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
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
    { value: 'cliente_asc', label: 'Cliente A→Z' },
    { value: 'cliente_desc', label: 'Cliente Z→A' },
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

interface FacturasFiltersProps {
    series?: Array<{ id: string; codigo: string; nombre: string }>
    pageSize?: number
}

export function FacturasFilters({ series = [], pageSize: initialPageSize = 10 }: FacturasFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const [busqueda, setBusqueda] = useState(searchParams.get('q') || '')
    const [estado, setEstado] = useState(searchParams.get('estado') || 'todas')
    const [periodo, setPeriodo] = useState(() => getPeriodoFromParams(searchParams).periodo)
    const [customDesde, setCustomDesde] = useState(() => getPeriodoFromParams(searchParams).desde)
    const [customHasta, setCustomHasta] = useState(() => getPeriodoFromParams(searchParams).hasta)
    const [orden, setOrden] = useState(searchParams.get('orden') || 'fecha_desc')
    const [clienteId, setClienteId] = useState(searchParams.get('clienteId') || '')
    const [clienteLabel, setClienteLabel] = useState(searchParams.get('clienteLabel') || '')
    const [serieId, setSerieId] = useState(searchParams.get('serie') || '')
    const [pageSize, setPageSize] = useState(searchParams.get('pageSize') || String(initialPageSize))
    const [periodoOpen, setPeriodoOpen] = useState(false)

    // Sincronizar estado local con la URL de forma eficiente
    useEffect(() => {
        const q = searchParams.get('q') || ''
        const est = searchParams.get('estado') || 'todas'
        const ord = searchParams.get('orden') || 'fecha_desc'
        const cId = searchParams.get('clienteId') || ''
        const cLab = searchParams.get('clienteLabel') || ''
        const sId = searchParams.get('serie') || ''
        const pSize = searchParams.get('pageSize') || String(initialPageSize)
        const { periodo: p, desde: d, hasta: h } = getPeriodoFromParams(searchParams)

        if (busqueda !== q) setBusqueda(q)
        if (estado !== est) setEstado(est)
        if (orden !== ord) setOrden(ord)
        if (clienteId !== cId) setClienteId(cId)
        if (clienteLabel !== cLab) setClienteLabel(cLab)
        if (serieId !== sId) setSerieId(sId)
        if (pageSize !== pSize) setPageSize(pSize)
        if (periodo !== p) setPeriodo(p)
        if (customDesde !== d) setCustomDesde(d)
        if (customHasta !== h) setCustomHasta(h)
    }, [searchParams, initialPageSize]) // Eliminados estados locales de las dependencias para evitar bucles

    const applySearch = useCallback((q: string) => {
        const trimmed = q.trim()
        const params = new URLSearchParams(searchParams.toString())
        if ((params.get('q') || '') === trimmed) return
        if (trimmed) params.set('q', trimmed)
        else params.delete('q')
        params.delete('page')
        router.push(`/ventas/facturas?${params.toString()}`)
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
            router.push(`/ventas/facturas?${queryString}`)
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
        if (value !== 'todas') params.set('estado', value)
        else params.delete('estado')
        params.delete('page')
        startTransition(() => { router.push(`/ventas/facturas?${params.toString()}`); router.refresh() })
    }

    const handleOrden = (value: string) => {
        setOrden(value)
        const params = new URLSearchParams(searchParams.toString())
        if (value !== 'fecha_desc') params.set('orden', value)
        else params.delete('orden')
        params.delete('page')
        startTransition(() => { router.push(`/ventas/facturas?${params.toString()}`); router.refresh() })
    }

    const handleClienteChange = (id: string, label: string) => {
        setClienteId(id)
        setClienteLabel(label)
        const params = new URLSearchParams(searchParams.toString())
        if (id) { params.set('clienteId', id); params.set('clienteLabel', label) }
        else { params.delete('clienteId'); params.delete('clienteLabel') }
        params.delete('page')
        startTransition(() => { router.push(`/ventas/facturas?${params.toString()}`); router.refresh() })
    }

    const handleSerieChange = (value: string) => {
        const id = value === '__todas__' ? '' : value
        setSerieId(id)
        const params = new URLSearchParams(searchParams.toString())
        if (id) params.set('serie', id)
        else params.delete('serie')
        params.delete('page')
        startTransition(() => { router.push(`/ventas/facturas?${params.toString()}`); router.refresh() })
    }

    const handlePageSizeChange = (value: string) => {
        setPageSize(value)
        const params = new URLSearchParams(searchParams.toString())
        params.set('pageSize', value)
        params.set('page', '1')
        startTransition(() => { router.push(`/ventas/facturas?${params.toString()}`); router.refresh() })
    }

    const handleLimpiar = () => {
        setBusqueda('')
        setEstado('todas')
        setPeriodo('todos')
        setCustomDesde('')
        setCustomHasta('')
        setOrden('fecha_desc')
        setClienteId('')
        setClienteLabel('')
        setSerieId('')
        startTransition(() => { router.push('/ventas/facturas'); router.refresh() })
    }

    const tieneFiltrosActivos =
        !!busqueda.trim() || estado !== 'todas' || periodo !== 'todos' || orden !== 'fecha_desc' || !!clienteId || !!serieId

    const periodoLabel =
        periodo === 'todos' ? 'Todas las fechas' :
            periodo === 'este-mes' ? 'Este mes' :
                periodo === 'este-anio' ? 'Este año' :
                    customDesde && customHasta ? `${customDesde} – ${customHasta}` : 'Rango personalizado'

    return (
        <Card data-testid="facturas-filters" className="border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/80 shadow-md overflow-hidden">
            <CardContent className="p-5">
                <div className="flex flex-col gap-5">
                    {/* Búsqueda */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="relative flex-1 min-w-0 group" role="search">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                id="facturas-search"
                                data-testid="facturas-filter-search"
                                placeholder="Buscar por cliente, CIF, número o importe…"
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                className="pl-10 h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                disabled={isPending}
                            />
                            {busqueda && (
                                <button type="button" onClick={() => setBusqueda('')}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {tieneFiltrosActivos && (
                            <Button variant="ghost" size="sm" onClick={handleLimpiar} disabled={isPending}
                                className="text-slate-500 hover:text-destructive dark:text-slate-400 hover:bg-destructive/10 transition-all rounded-lg h-11 px-4"
                                data-testid="facturas-filter-limpiar">
                                <X className="h-4 w-4 mr-2" />
                                Limpiar filtros
                            </Button>
                        )}
                    </div>

                    {/* Período: pills + rango */}
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
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20 border-transparent translate-y-[-1px]' 
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5'
                                        )}
                                        data-testid={`facturas-filter-periodo-${p.value}`}
                                    >
                                        {p.label}
                                    </Button>
                                )
                            })}
                            {periodo === 'rango' && (
                                <Popover open={periodoOpen} onOpenChange={setPeriodoOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs px-4 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                                            data-testid="facturas-filter-rango-trigger">
                                            {customDesde && customHasta ? `${format(new Date(customDesde), 'dd MMM', { locale: es })} – ${format(new Date(customHasta), 'dd MMM', { locale: es })}` : 'Seleccionar rango'}
                                            <ChevronDown className="ml-2 h-3 w-3" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-5 rounded-2xl shadow-2xl border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl" align="start">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-sm">Personalizar intervalo</h4>
                                                <p className="text-xs text-slate-500">Elige las fechas de inicio y fin para filtrar.</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase tracking-wider text-slate-500">Desde</Label>
                                                    <Input type="date" value={customDesde} onChange={e => setCustomDesde(e.target.value)} className="h-9 rounded-lg" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase tracking-wider text-slate-500">Hasta</Label>
                                                    <Input type="date" value={customHasta} onChange={e => setCustomHasta(e.target.value)} className="h-9 rounded-lg" />
                                                </div>
                                            </div>
                                            <Button className="w-full rounded-xl shadow-lg shadow-primary/20" onClick={handleApplyRango}
                                                disabled={!customDesde || !customHasta || customDesde > customHasta}
                                                data-testid="facturas-filter-rango-aplicar">
                                                Confirmar rango
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                            {periodo === 'todos' ? 'Mostrando todas las facturas sin filtro de fecha' : `Período: ${periodoLabel}`}
                        </p>
                    </div>

                    {/* Estado + Cliente + Orden */}
                    <div className="flex flex-col gap-5 border-t border-slate-100 dark:border-slate-800 pt-5">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-400">
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Filtrado por Estado</span>
                            </div>
                            <div className="flex flex-wrap gap-2" role="group">
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
                                                    ? cn(e.color || 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md', 'border-transparent scale-[1.02]') 
                                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary/40 hover:bg-primary/5'
                                            )}
                                            data-testid={`facturas-filter-estado-${e.value}`}
                                        >
                                            {e.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-end gap-5">
                            <div className="space-y-2 min-w-[240px] flex-1 sm:flex-none">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-1">Cliente</Label>
                                <ClienteCombobox value={clienteId} label={clienteLabel} onChange={handleClienteChange} disabled={isPending} />
                            </div>
                            {series.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-1">Serie</Label>
                                    <Select value={serieId || '__todas__'} onValueChange={handleSerieChange} disabled={isPending}>
                                        <SelectTrigger data-testid="facturas-filter-serie" className="w-[140px] h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50">
                                            <SelectValue placeholder="Todas" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700 shadow-xl">
                                            <SelectItem value="__todas__">Todas las series</SelectItem>
                                            {series.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.codigo}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-1">Ordenar por</Label>
                                <Select value={orden} onValueChange={handleOrden} disabled={isPending}>
                                    <SelectTrigger data-testid="facturas-filter-orden" className="w-[200px] h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50">
                                        <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-primary" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700 shadow-xl">
                                        {ORDEN_OPTIONS.map(o => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-1">Registros</Label>
                                <Select value={pageSize} onValueChange={handlePageSizeChange} disabled={isPending}>
                                    <SelectTrigger data-testid="facturas-filter-page-size" className="w-[85px] h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700 shadow-xl min-w-[70px]">
                                        {PAGE_SIZE_OPTIONS.map(o => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {tieneFiltrosActivos && (
                                <div className="ml-auto flex items-center gap-2 pb-1">
                                    {clienteId && clienteLabel && (
                                        <Badge variant="outline" className="text-[10px] font-bold h-7 bg-primary/5 text-primary border-primary/20 rounded-lg px-2 flex items-center gap-1.5 animate-in zoom-in-95">
                                            <User className="h-3 w-3" />
                                            {clienteLabel}
                                            <button type="button" onClick={() => handleClienteChange('', '')} className="hover:text-destructive transition-colors ml-0.5">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )}
                                    <Badge variant="secondary" className="text-[10px] font-bold h-7 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none rounded-lg px-2 animate-in zoom-in-95" data-testid="facturas-filters-active-badge">
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
