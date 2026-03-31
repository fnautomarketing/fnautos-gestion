'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    Receipt,
    FileText,
    Users,
    Search,
    Plus,
    Settings,
    BarChart3,
    LayoutDashboard,
    CreditCard,
    ArrowRight,
    Loader2,
    Hash,
    User,
} from 'lucide-react'
import { busquedaGlobalAction, type SearchResult } from '@/app/actions/busqueda'

// ── Acciones rápidas ──────────────────────────────────────
const quickActions = [
    { id: 'nueva-factura', label: 'Nueva Factura', icon: Plus, href: '/ventas/facturas/nueva', group: 'Crear' },
    { id: 'nuevo-contrato', label: 'Nuevo Contrato', icon: Plus, href: '/ventas/contratos/nuevo', group: 'Crear' },
]

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', group: 'Navegación' },
    { id: 'facturas', label: 'Facturas', icon: Receipt, href: '/ventas/facturas', group: 'Navegación' },
    { id: 'contratos', label: 'Contratos', icon: FileText, href: '/ventas/contratos', group: 'Navegación' },
    { id: 'clientes', label: 'Clientes', icon: Users, href: '/ventas/clientes', group: 'Navegación' },
    { id: 'pagos', label: 'Pagos', icon: CreditCard, href: '/ventas/pagos', group: 'Navegación' },
    { id: 'informes', label: 'Informes', icon: BarChart3, href: '/ventas/informes', group: 'Navegación' },
    { id: 'config-empresa', label: 'Configuración Empresa', icon: Settings, href: '/ventas/configuracion/empresa', group: 'Navegación' },
    { id: 'config-series', label: 'Series de Facturación', icon: Hash, href: '/ventas/configuracion/series', group: 'Navegación' },
    { id: 'perfil', label: 'Mi Perfil', icon: User, href: '/perfil', group: 'Navegación' },
]

// ── Iconos por tipo de resultado ──────────────────────────
const resultIcons: Record<string, React.ElementType> = {
    receipt: Receipt,
    'file-text': FileText,
    users: Users,
}

// ── Colores de badge ──────────────────────────────────────
const badgeStyles: Record<string, string> = {
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

// ── Etiquetas de categoría ────────────────────────────────
const categoryLabels: Record<string, string> = {
    factura: 'Facturas',
    contrato: 'Contratos',
    cliente: 'Clientes',
}

interface CommandPaletteProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Auto-focus al abrir
    useEffect(() => {
        if (open) {
            setQuery('')
            setResults([])
            setSelectedIndex(0)
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [open])

    // Búsqueda con debounce
    const performSearch = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setResults([])
            setIsSearching(false)
            return
        }
        setIsSearching(true)
        try {
            const res = await busquedaGlobalAction(q)
            setResults(res.results)
            setSelectedIndex(0)
        } catch {
            setResults([])
        } finally {
            setIsSearching(false)
        }
    }, [])

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => performSearch(query), 300)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [query, performSearch])

    // Construir lista plana de elementos navegables
    const flatItems: Array<{ id: string; href: string; label: string }> = []

    if (query.trim().length < 2) {
        // Mostrar acciones rápidas + navegación
        quickActions.forEach(a => flatItems.push({ id: a.id, href: a.href, label: a.label }))
        // Filtrar navegación por query si existe
        const filteredNav = query.trim()
            ? navItems.filter(n => n.label.toLowerCase().includes(query.toLowerCase()))
            : navItems
        filteredNav.forEach(n => flatItems.push({ id: n.id, href: n.href, label: n.label }))
    } else {
        results.forEach(r => flatItems.push({ id: r.id, href: r.href, label: r.title }))
    }

    // Navigación con teclado
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => (prev + 1) % Math.max(flatItems.length, 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => (prev - 1 + flatItems.length) % Math.max(flatItems.length, 1))
        } else if (e.key === 'Enter' && flatItems[selectedIndex]) {
            e.preventDefault()
            navigate(flatItems[selectedIndex].href)
        } else if (e.key === 'Escape') {
            onOpenChange(false)
        }
    }

    const navigate = (href: string) => {
        onOpenChange(false)
        router.push(href)
    }

    // Scroll del elemento seleccionado
    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
        el?.scrollIntoView({ block: 'nearest' })
    }, [selectedIndex])

    if (!open) return null

    // Agrupación de resultados por tipo
    const groupedResults: Record<string, SearchResult[]> = {}
    results.forEach(r => {
        if (!groupedResults[r.type]) groupedResults[r.type] = []
        groupedResults[r.type].push(r)
    })

    let flatIndex = -1

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal */}
            <div className="fixed inset-x-0 top-[15%] z-50 mx-auto w-[95vw] max-w-[620px] animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-200">
                <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl shadow-black/20 border border-slate-200/60 dark:border-slate-700/50 ring-1 ring-black/5">
                    {/* Input de búsqueda */}
                    <div className="flex items-center gap-3 border-b border-slate-200/60 dark:border-slate-800 px-4 py-3">
                        {isSearching ? (
                            <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                        ) : (
                            <Search className="h-5 w-5 text-slate-400 shrink-0" />
                        )}
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Buscar facturas, contratos, clientes o navegar..."
                            className="flex-1 bg-transparent text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <kbd className="hidden sm:inline-flex h-6 px-2 items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-400 font-bold">
                            ESC
                        </kbd>
                    </div>

                    {/* Lista de resultados */}
                    <div ref={listRef} className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
                        {/* ── Cuando no hay query: acciones rápidas + navegación ── */}
                        {query.trim().length < 2 && (
                            <>
                                {/* Acciones rápidas */}
                                <div className="px-2 pt-1 pb-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                        Acciones Rápidas
                                    </p>
                                    {quickActions.map(action => {
                                        flatIndex++
                                        const idx = flatIndex
                                        const Icon = action.icon
                                        return (
                                            <button
                                                key={action.id}
                                                data-index={idx}
                                                type="button"
                                                onClick={() => navigate(action.href)}
                                                onMouseEnter={() => setSelectedIndex(idx)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                                    selectedIndex === idx
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                    selectedIndex === idx
                                                        ? 'bg-primary/20 text-primary'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                }`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <span className="font-medium">{action.label}</span>
                                                <ArrowRight className={`h-4 w-4 ml-auto transition-opacity ${selectedIndex === idx ? 'opacity-100 text-primary' : 'opacity-0'}`} />
                                            </button>
                                        )
                                    })}
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2" />

                                {/* Navegación */}
                                <div className="px-2 pt-2 pb-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                        Navegación
                                    </p>
                                    {(() => {
                                        const filtered = query.trim()
                                            ? navItems.filter(n => n.label.toLowerCase().includes(query.toLowerCase()))
                                            : navItems
                                        return filtered.map(nav => {
                                            flatIndex++
                                            const idx = flatIndex
                                            const Icon = nav.icon
                                            return (
                                                <button
                                                    key={nav.id}
                                                    data-index={idx}
                                                    type="button"
                                                    onClick={() => navigate(nav.href)}
                                                    onMouseEnter={() => setSelectedIndex(idx)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                                                        selectedIndex === idx
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    <Icon className={`h-4 w-4 shrink-0 ${selectedIndex === idx ? 'text-primary' : 'text-slate-400'}`} />
                                                    <span className="font-medium">{nav.label}</span>
                                                    <ArrowRight className={`h-3.5 w-3.5 ml-auto transition-opacity ${selectedIndex === idx ? 'opacity-100 text-primary' : 'opacity-0'}`} />
                                                </button>
                                            )
                                        })
                                    })()}
                                </div>
                            </>
                        )}

                        {/* ── Resultados de búsqueda ── */}
                        {query.trim().length >= 2 && !isSearching && results.length === 0 && (
                            <div className="py-12 text-center">
                                <Search className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">No se encontraron resultados para &ldquo;{query}&rdquo;</p>
                                <p className="text-xs text-slate-400 mt-1">Prueba con otro término de búsqueda</p>
                            </div>
                        )}

                        {query.trim().length >= 2 && results.length > 0 && (
                            <>
                                {Object.entries(groupedResults).map(([type, items]) => (
                                    <div key={type} className="px-2 pt-2 pb-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                                            {categoryLabels[type] || type}
                                            <span className="text-[9px] font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{items.length}</span>
                                        </p>
                                        {items.map(item => {
                                            flatIndex++
                                            const idx = flatIndex
                                            const Icon = resultIcons[item.icon] || FileText
                                            return (
                                                <button
                                                    key={item.id}
                                                    data-index={idx}
                                                    type="button"
                                                    onClick={() => navigate(item.href)}
                                                    onMouseEnter={() => setSelectedIndex(idx)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                                        selectedIndex === idx
                                                            ? 'bg-primary/10'
                                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                                                        selectedIndex === idx
                                                            ? 'bg-primary/20 text-primary'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                    }`}>
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <p className={`font-medium truncate ${selectedIndex === idx ? 'text-primary' : 'text-slate-800 dark:text-slate-200'}`}>
                                                            {item.title}
                                                        </p>
                                                        <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                                                    </div>
                                                    {item.badge && (
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badgeStyles[item.badgeColor || 'slate']}`}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                    <ArrowRight className={`h-3.5 w-3.5 shrink-0 transition-opacity ${selectedIndex === idx ? 'opacity-100 text-primary' : 'opacity-0'}`} />
                                                </button>
                                            )
                                        })}
                                    </div>
                                ))}
                            </>
                        )}

                        {/* Loading skeleton */}
                        {isSearching && (
                            <div className="px-4 py-6 space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-3 animate-pulse">
                                        <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3.5 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
                                            <div className="h-2.5 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer hint */}
                    <div className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                                <kbd className="h-4 px-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[9px] font-bold">↑↓</kbd>
                                navegar
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="h-4 px-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[9px] font-bold">↵</kbd>
                                abrir
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="h-4 px-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[9px] font-bold">esc</kbd>
                                cerrar
                            </span>
                        </div>
                        <span className="text-[10px] text-slate-300 dark:text-slate-600 font-bold">
                            FNAUTOS ERP
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}
