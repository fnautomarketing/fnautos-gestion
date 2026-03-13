'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
    obtenerNotificacionesAction,
    marcarNotificacionLeidaAction,
    marcarTodasLeidasAction,
    eliminarNotificacionAction,
    contarNotificacionesNoLeidasAction
} from '@/app/actions/notificaciones'
import type { Notificacion } from '@/types/notificaciones'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function NotificacionesDropdown() {
    const router = useRouter()
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
    const [noLeidas, setNoLeidas] = useState(0)
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const cargarNotificaciones = async () => {
        setLoading(true)
        const result = await obtenerNotificacionesAction(20, false)
        if (result.success && result.data) {
            setNotificaciones(result.data)
        }
        setLoading(false)
    }

    const cargarContador = async () => {
        const result = await contarNotificacionesNoLeidasAction()
        if (result.success) {
            setNoLeidas(result.count)
        }
    }

    useEffect(() => {
        cargarContador()
        // Actualizar contador cada 30 segundos
        const interval = setInterval(cargarContador, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (open) {
            cargarNotificaciones()
        }
    }, [open])

    const handleMarcarLeida = async (notificacionId: string) => {
        const result = await marcarNotificacionLeidaAction(notificacionId)
        if (result.success) {
            setNotificaciones(prev =>
                prev.map(n => n.id === notificacionId ? { ...n, leida: true } : n)
            )
            setNoLeidas(prev => Math.max(0, prev - 1))
        }
    }

    const handleMarcarTodasLeidas = async () => {
        const result = await marcarTodasLeidasAction()
        if (result.success) {
            setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
            setNoLeidas(0)
            toast.success('Todas las notificaciones marcadas como leídas')
        }
    }

    const handleEliminar = async (notificacionId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const result = await eliminarNotificacionAction(notificacionId)
        if (result.success) {
            setNotificaciones(prev => prev.filter(n => n.id !== notificacionId))
            const notif = notificaciones.find(n => n.id === notificacionId)
            if (notif && !notif.leida) {
                setNoLeidas(prev => Math.max(0, prev - 1))
            }
            toast.success('Notificación eliminada')
        }
    }

    const handleClickNotificacion = async (notificacion: Notificacion) => {
        if (!notificacion.leida) {
            await handleMarcarLeida(notificacion.id)
        }
        if (notificacion.enlace) {
            setOpen(false)
            router.push(notificacion.enlace)
        }
    }

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'success':
                return 'text-green-600 dark:text-green-400'
            case 'warning':
                return 'text-yellow-600 dark:text-yellow-400'
            case 'error':
                return 'text-red-600 dark:text-red-400'
            default:
                return 'text-primary'
        }
    }

    const getTipoBg = (tipo: string) => {
        switch (tipo) {
            case 'success':
                return 'bg-green-50 dark:bg-green-950/20'
            case 'warning':
                return 'bg-yellow-50 dark:bg-yellow-950/20'
            case 'error':
                return 'bg-red-50 dark:bg-red-950/20'
            default:
                return 'bg-primary/10 dark:bg-primary/20'
        }
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    data-testid="navbar-notifications"
                    className="relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-primary transition-all duration-300 group touch-manipulation"
                >
                    <Bell className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                    {noLeidas > 0 && (
                        <>
                            <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-gradient-to-tr from-red-500 to-orange-400 ring-2 ring-white dark:ring-slate-900 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                                {noLeidas > 9 ? '9+' : noLeidas}
                            </span>
                        </>
                    )}
                    <span className="sr-only">Notificaciones</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-[min(420px,90vw)] max-w-[420px] p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-2xl"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                        Notificaciones
                        {noLeidas > 0 && (
                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                                ({noLeidas} nuevas)
                            </span>
                        )}
                    </h3>
                    {notificaciones.length > 0 && noLeidas > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarcarTodasLeidas}
                            className="h-7 text-xs hover:bg-slate-100 dark:hover:bg-white/5"
                        >
                            <Check className="h-3 w-3 mr-1" />
                            Marcar todas
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : notificaciones.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <Bell className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                No tienes notificaciones
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                Te avisaremos cuando haya novedades
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {notificaciones.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleClickNotificacion(notif)}
                                    className={cn(
                                        'px-4 py-3 transition-all duration-200 group relative',
                                        notif.enlace && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5',
                                        !notif.leida && 'bg-primary/5 dark:bg-primary/10'
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={cn(
                                                'flex-shrink-0 w-2 h-2 rounded-full mt-2',
                                                !notif.leida ? 'bg-primary' : 'bg-transparent'
                                            )}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn(
                                                    'text-sm font-semibold',
                                                    getTipoColor(notif.tipo)
                                                )}>
                                                    {notif.titulo}
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => handleEliminar(notif.id, e)}
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-950/20 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                                {notif.mensaje}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                                {new Date(notif.created_at).toLocaleString('es-ES', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
