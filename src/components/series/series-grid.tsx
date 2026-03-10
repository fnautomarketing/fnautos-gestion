'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
import { Edit, FileText, MoreVertical, Star, Trash2, ToggleLeft, RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { toggleActivaSerieAction, establecerPredeterminadaAction, eliminarSerieAction, resetearNumeracionAction } from '@/app/actions/series'
import { useRouter } from 'next/navigation'

interface SeriesGridProps {
    series: any[]
}

function groupByEmpresa(series: any[]) {
    const groups: Record<string, any[]> = {}
    for (const s of series) {
        const eid = s.empresa_id
        if (!groups[eid]) groups[eid] = []
        groups[eid].push(s)
    }
    const ids = Object.keys(groups)
    return ids
        .sort((a, b) => {
            const nameA = groups[a][0]?.empresa?.razon_social || groups[a][0]?.empresa?.nombre_comercial || ''
            const nameB = groups[b][0]?.empresa?.razon_social || groups[b][0]?.empresa?.nombre_comercial || ''
            return nameA.localeCompare(nameB)
        })
        .map(id => ({
            empresaId: id,
            nombre: groups[id][0]?.empresa?.razon_social || groups[id][0]?.empresa?.nombre_comercial || id,
            series: groups[id]
        }))
}

/**
 * Componente que muestra las series de facturación agrupadas por empresa.
 * Compatible con Verifactu: numeración consecutiva, serie única por emisor.
 */
export function SeriesGrid({ series }: SeriesGridProps) {
    const router = useRouter()
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; codigo: string } | null>(null)
    const [resetTarget, setResetTarget] = useState<{ id: string; codigo: string } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isResetting, setIsResetting] = useState(false)

    const handleToggleActiva = async (serieId: string, activa: boolean) => {
        const result = await toggleActivaSerieAction(serieId, !activa)
        if (result.success) {
            toast.success(activa ? 'Serie desactivada' : 'Serie activada')
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    const handleSetPredeterminada = async (serieId: string) => {
        const result = await establecerPredeterminadaAction(serieId)
        if (result.success) {
            toast.success('Serie establecida como predeterminada')
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    const handleEliminar = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        const result = await eliminarSerieAction(deleteTarget.id)
        setIsDeleting(false)
        setDeleteTarget(null)
        if (result.success) {
            toast.success('Serie eliminada')
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    const handleResetear = async () => {
        if (!resetTarget) return
        setIsResetting(true)
        const result = await resetearNumeracionAction(resetTarget.id)
        setIsResetting(false)
        setResetTarget(null)
        if (result.success) {
            toast.success('Numeración reseteada')
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    const grupos = groupByEmpresa(series)

    return (
        <div className="space-y-10">
            {grupos.map(({ empresaId, nombre, series: seriesEmpresa }) => (
                <div key={empresaId} className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-white/10">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{nombre}</h2>
                        <span className="text-sm text-slate-500">({seriesEmpresa.length} serie{seriesEmpresa.length !== 1 ? 's' : ''})</span>
                    </div>
                    <div className="grid gap-6">
            {seriesEmpresa.map((serie) => (
                <div
                    key={serie.id}
                    className="group rounded-2xl bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 shadow-xl hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.01] transition-all duration-300"
                >
                    <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                        {/* Izquierda: Info */}
                        <div className="flex items-start gap-5 flex-1 w-full">
                            {/* Icono */}
                            <div className="text-6xl bg-slate-100 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                {serie.icono || '📄'}
                            </div>

                            {/* Contenido */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{serie.codigo}</h2>
                                    <Badge className={serie.activa ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'}>
                                        {serie.activa ? 'ACTIVA' : 'INACTIVA'}
                                    </Badge>
                                    {serie.predeterminada && (
                                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-none shadow-lg shadow-orange-900/20 animate-pulse">
                                            ⭐ PREDETERMINADA
                                        </Badge>
                                    )}
                                </div>

                                <p className="text-slate-600 dark:text-slate-400 text-lg mb-5 font-medium">{serie.nombre}</p>

                                {/* Stats */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                                    <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Formato</p>
                                        <p className="font-mono text-slate-800 dark:text-slate-200">{serie.prefijo || ''}<span className="text-primary">{'{n}'}</span>{serie.sufijo || ''}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Próximo número</p>
                                        <p className="text-2xl font-black text-primary font-mono">
                                            {serie.codigo}-{String(serie.numero_actual).padStart(serie.digitos || 3, '0')}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">Secuencia: {serie.numero_actual} (editable en Editar)</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Reseteo</p>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{serie.reseteo}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Emitidas</p>
                                        <p className="font-black text-slate-900 dark:text-white text-xl">{serie.facturas_emitidas}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Derecha: Acciones - botones negros por defecto, dorado al hover */}
                        <div className="flex md:flex-col gap-2 w-full md:w-auto">
                            <Link href={`/ventas/configuracion/series/${serie.id}/editar`} className="flex-1 md:flex-none">
                                <Button variant="outline" size="sm" className="w-full bg-white dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-200 hover:border-primary hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                </Button>
                            </Link>

                            <Link href={`/ventas/facturas?serie=${serie.id}`} className="flex-1 md:flex-none">
                                <Button variant="outline" size="sm" className="w-full bg-white dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-200 hover:border-primary hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Ver Facturas
                                </Button>
                            </Link>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-primary/10">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#1a2332] border-white/10 text-slate-200">
                                    <DropdownMenuItem onClick={() => handleSetPredeterminada(serie.id)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                        <Star className="h-4 w-4 mr-2 text-amber-500" />
                                        Establecer como predeterminada
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleActiva(serie.id, serie.activa)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                        <ToggleLeft className="h-4 w-4 mr-2" />
                                        {serie.activa ? 'Desactivar' : 'Activar'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setResetTarget({ id: serie.id, codigo: serie.codigo })} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                        <RotateCcw className="h-4 w-4 mr-2 text-blue-400" />
                                        Resetear Numeración
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer" onClick={() => setDeleteTarget({ id: serie.id, codigo: serie.codigo })}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            ))}
                    </div>
                </div>
            ))}

            {series.length === 0 && (
                <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No hay series configuradas</h3>
                    <p className="text-slate-600 dark:text-slate-400">Crea tu primera serie para empezar a organizar tu facturación.</p>
                    <Link href="/ventas/configuracion/series/nueva" className="mt-6 inline-block">
                        <Button className="bg-primary text-secondary-foreground font-bold px-8">Crear Serie</Button>
                    </Link>
                </div>
            )}

            {/* Diálogo confirmación eliminar */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent className="bg-slate-900 border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar serie?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará permanentemente la serie <strong>{deleteTarget?.codigo}</strong>. Esta acción no se puede deshacer. Solo puedes eliminar series sin facturas asociadas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleEliminar() }}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Eliminando...</> : 'Eliminar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Diálogo confirmación resetear */}
            <AlertDialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
                <AlertDialogContent className="bg-slate-900 border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Resetear numeración?</AlertDialogTitle>
                        <AlertDialogDescription>
                            El contador de la serie <strong>{resetTarget?.codigo}</strong> volverá al número inicial. Las facturas ya emitidas no se modifican. ¿Continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isResetting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleResetear() }}
                            disabled={isResetting}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {isResetting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Reseteando...</> : 'Resetear'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
