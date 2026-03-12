'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, Copy, Trash2, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { eliminarConceptoAction, duplicarConceptoAction } from '@/app/actions/conceptos'
import Link from 'next/link'

import { ConceptoCatalogo } from '@/types/conceptos'

interface ConceptosTablaProps {
    conceptos: ConceptoCatalogo[]
}

export function ConceptosTabla({ conceptos }: ConceptosTablaProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('search') || '')

    const getCategoriaColor = (categoria: string) => {
        const colores: Record<string, string> = {
            transporte: 'bg-blue-100 text-blue-700 hover:bg-blue-100/80',
            almacenaje: 'bg-green-100 text-green-700 hover:bg-green-100/80',
            logistica: 'bg-purple-100 text-purple-700 hover:bg-purple-100/80',
            material: 'bg-orange-100 text-orange-700 hover:bg-orange-100/80',
            otros: 'bg-slate-100 text-slate-700 hover:bg-slate-100/80',
        }
        return colores[categoria] || colores.otros
    }

    const getCategoriaIcon = (categoria: string) => {
        const iconos: Record<string, string> = {
            transporte: '🚚',
            almacenaje: '📦',
            logistica: '📋',
            material: '🔧',
            otros: '📄',
        }
        return iconos[categoria] || '📄'
    }

    const handleDuplicar = async (conceptoId: string) => {
        try {
            const result = await duplicarConceptoAction(conceptoId)
            if (result.success) {
                toast.success('Concepto duplicado')
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error: unknown) {
            console.error('[handleDuplicar]', error)
            const message = error instanceof Error ? error.message : 'Error al duplicar concepto'
            toast.error(message)
        }
    }

    const handleEliminar = async (conceptoId: string) => {
        if (!confirm('¿Eliminar este concepto? Esta acción no se puede deshacer.')) return

        try {
            const result = await eliminarConceptoAction(conceptoId)
            if (result.success) {
                toast.success('Concepto eliminado')
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error: unknown) {
            console.error('[handleEliminar]', error)
            const message = error instanceof Error ? error.message : 'Error al eliminar concepto'
            toast.error(message)
        }
    }

    // Handle filters update
    const updateFilters = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== 'todas' && value !== 'todos') {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`?${params.toString()}`)
    }

    // Handle search with debounce ideally, but direct push for now
    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            updateFilters('search', search)
        }
    }

    return (
        <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                <div className="flex-1 min-w-[200px]">
                    <Input
                        placeholder="Buscar por código, concepto..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearch}
                        className="w-full"
                    />
                </div>

                <Select
                    defaultValue={searchParams.get('categoria') || 'todas'}
                    onValueChange={(val) => updateFilters('categoria', val)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="transporte">Transporte</SelectItem>
                        <SelectItem value="almacenaje">Almacenaje</SelectItem>
                        <SelectItem value="logistica">Logística</SelectItem>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    defaultValue={searchParams.get('tipo') || 'todos'}
                    onValueChange={(val) => updateFilters('tipo', val)}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="servicio">Servicio</SelectItem>
                        <SelectItem value="producto">Producto</SelectItem>
                    </SelectContent>
                </Select>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setSearch('')
                        router.push('?')
                    }}
                >
                    Limpiar Filtros
                </Button>
            </div>

            {/* Tabla */}
            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Código</th>
                            <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Concepto</th>
                            <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Categoría</th>
                            <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</th>
                            <th className="p-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Precio Base</th>
                            <th className="p-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">IVA</th>
                            <th className="p-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                            <th className="p-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Usado</th>
                            <th className="p-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {conceptos.map((concepto) => {
                            const precioTotal = (concepto.precio_base || 0) * (1 + (concepto.iva_porcentaje || 0) / 100)
                            return (
                                <tr key={concepto.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="p-4 font-mono text-sm text-slate-500">{concepto.codigo}</td>
                                    <td className="p-4">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{concepto.nombre}</p>
                                        {concepto.descripcion && <p className="text-sm text-slate-500 line-clamp-1">{concepto.descripcion}</p>}
                                    </td>
                                    <td className="p-4">
                                        <Badge variant="secondary" className={`font-medium border-0 ${getCategoriaColor(concepto.categoria)}`}>
                                            <span className="mr-1">{getCategoriaIcon(concepto.categoria)}</span> {concepto.categoria}
                                        </Badge>
                                    </td>
                                    <td className="p-4 capitalize text-sm text-slate-600 dark:text-slate-400">{concepto.tipo}</td>
                                    <td className="p-4 text-right font-medium text-slate-700 dark:text-slate-300">
                                        {(concepto.precio_base || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                                    </td>
                                    <td className="p-4 text-center text-sm text-slate-500">{concepto.iva_porcentaje}%</td>
                                    <td className="p-4 text-right font-bold text-slate-900 dark:text-slate-100">
                                        {precioTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center">
                                            <Badge variant="outline" className="flex items-center gap-1 font-normal bg-slate-50 dark:bg-slate-900">
                                                <TrendingUp className="h-3 w-3 text-slate-400" />
                                                {concepto.veces_usado || 0}
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/ventas/configuracion/conceptos/${concepto.id}/editar`} className="cursor-pointer font-medium">
                                                        <Edit className="h-4 w-4 mr-2" /> Editar
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDuplicar(concepto.id)} className="cursor-pointer">
                                                    <Copy className="h-4 w-4 mr-2" /> Duplicar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50" onClick={() => handleEliminar(concepto.id)}>
                                                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {conceptos.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <div className="inline-flex items-center justify-center p-4 bg-slate-100 rounded-full mb-4">
                            <span className="text-2xl">🔍</span>
                        </div>
                        <p className="text-lg font-medium text-slate-900">No se encontraron conceptos</p>
                        <p className="text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                )}
            </div>

            <div className="flex justify-end text-xs text-slate-400">
                Mostrando {conceptos.length} conceptos
            </div>
        </div>
    )
}
