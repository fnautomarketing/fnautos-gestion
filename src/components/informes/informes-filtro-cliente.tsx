'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { User, X, ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface ClienteOption {
    id: string
    label: string
    cif?: string
}

interface SearchResult {
    items: ClienteOption[]
    total: number
    page: number
    totalPages: number
}

const EMPTY_RESULT: SearchResult = { items: [], total: 0, page: 1, totalPages: 0 }

interface InformesFiltroClienteProps {
    value: string | null
    label: string
    onChange: (id: string | null, label: string) => void
    empresaId: string | null
    disabled?: boolean
    placeholder?: string
    className?: string
}

export function InformesFiltroCliente({
    value,
    label,
    onChange,
    empresaId,
    disabled,
    placeholder = 'Todos los clientes',
    className,
}: InformesFiltroClienteProps) {
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [result, setResult] = useState<SearchResult>(EMPTY_RESULT)
    const [searching, setSearching] = useState(false)
    const [selectedLabel, setSelectedLabel] = useState(label)
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const fetchPage = useCallback(
        async (q: string, page: number, append = false) => {
            if (page === 1) setSearching(true)
            try {
                const limit = q ? 25 : 50
                const params = new URLSearchParams({
                    q,
                    page: String(page),
                    limit: String(limit),
                })
                if (empresaId) params.set('empresa_id', empresaId)
                const res = await fetch(`/api/clientes/search?${params}`)
                const data: SearchResult = await res.json()
                setResult((prev) =>
                    append ? { ...data, items: [...prev.items, ...data.items] } : data
                )
            } catch {
                if (!append) setResult(EMPTY_RESULT)
            } finally {
                setSearching(false)
            }
        },
        [empresaId]
    )

    useEffect(() => {
        setSelectedLabel(label)
    }, [label, value])

    useEffect(() => {
        if (!open) return
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => fetchPage(query, 1), query ? 280 : 0)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [open, query, fetchPage])

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
        onChange(null, '')
    }

    const hasMore = result.page < result.totalPages

    return (
        <Popover
            open={open}
            onOpenChange={(o) => {
                setOpen(o)
                if (!o) setQuery('')
            }}
        >
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        'flex items-center gap-2 min-h-[40px] sm:min-h-[36px] px-3 rounded-lg border bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-600 cursor-text transition-all',
                        open && 'ring-2 ring-primary/20 border-primary/50',
                        disabled && 'opacity-50 cursor-not-allowed',
                        className
                    )}
                    onClick={() => {
                        if (!disabled) {
                            setOpen(true)
                            setTimeout(() => inputRef.current?.focus(), 50)
                        }
                    }}
                    data-testid="informes-filter-cliente"
                >
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {value && selectedLabel ? (
                        <span className="text-sm text-slate-900 dark:text-slate-100 truncate flex-1 min-w-0 max-w-[180px] sm:max-w-[220px]">
                            {selectedLabel}
                        </span>
                    ) : (
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                setOpen(true)
                            }}
                            onFocus={() => setOpen(true)}
                            placeholder={placeholder}
                            className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400 min-w-0 w-full"
                            disabled={disabled}
                        />
                    )}
                    {value ? (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="shrink-0 text-slate-400 hover:text-slate-600 p-0.5"
                            aria-label="Quitar filtro de cliente"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    ) : (
                        <ChevronDown
                            className={cn(
                                'h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform',
                                open && 'rotate-180'
                            )}
                        />
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] min-w-[260px] max-w-[min(400px,90vw)] p-0"
                align="start"
                sideOffset={4}
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="flex flex-col max-h-[min(320px,70vh)] overflow-hidden">
                    {searching && (
                        <div className="px-3 py-2 text-xs text-slate-400">Cargando…</div>
                    )}
                    {!searching && query.length === 0 && result.items.length === 0 && (
                        <div className="px-3 py-2 text-xs text-slate-400">
                            {empresaId ? 'No hay clientes en esta empresa' : 'No hay clientes'}
                        </div>
                    )}
                    {!searching && query.length > 0 && result.items.length === 0 && (
                        <div className="px-3 py-2 text-xs text-slate-400">Sin resultados</div>
                    )}
                    {result.items.length > 0 && (
                        <ul className="overflow-y-auto flex-1 p-1">
                            {result.items.map((opt) => (
                                <li key={opt.id}>
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 truncate"
                                        onClick={() => handleSelect(opt)}
                                    >
                                        {opt.label}
                                    </button>
                                </li>
                            ))}
                            {hasMore && (
                                <li>
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        onClick={() => fetchPage(query, result.page + 1, true)}
                                    >
                                        Cargar más…
                                    </button>
                                </li>
                            )}
                        </ul>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
