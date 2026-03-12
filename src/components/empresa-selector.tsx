'use client'

import { useState, useEffect } from 'react'
import { Building2, ChevronDown, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { listarEmpresasUsuarioAction, cambiarEmpresaActivaAction } from '@/app/actions/usuarios-empresas'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

/**
 * Selector de empresas con diseño Premium y optimización táctil.
 * Soporta variantes para el Header (global) y Formularios (local).
 */

interface Empresa {
    id: string
    razon_social: string
    nombre_comercial?: string | null
    logo_url?: string | null
    tipo_empresa: string | null
    rol: string | null
    activa: boolean | null
}

interface EmpresaSelectorProps {
    variant?: 'header' | 'form'
    onSelect?: (empresaId: string) => void
    selectedId?: string
}

export function EmpresaSelector({ variant = 'header', onSelect, selectedId }: EmpresaSelectorProps) {
    const router = useRouter()
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [empresaActiva, setEmpresaActiva] = useState<Empresa | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showConfirm, setShowConfirm] = useState(false)
    const [pendingEmpresaId, setPendingEmpresaId] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)

    const loadEmpresas = async () => {
        setIsLoading(true)
        const result = await listarEmpresasUsuarioAction()
        if (result.success && result.data) {
            setEmpresas(result.data.empresas)
            setIsAdmin(!!result.data.isAdmin)

            // Determine active company
            if (result.data.isGlobal) {
                setEmpresaActiva({
                    id: 'ALL',
                    razon_social: 'Todas las Empresas',
                    nombre_comercial: 'Visión Global',
                    tipo_empresa: 'Corporación',
                    rol: 'admin',
                    activa: true
                })
            } else {
                const activa = result.data.empresas.find(e => e.activa) || result.data.empresas[0]
                setEmpresaActiva(activa)
            }
        }
        setIsLoading(false)
    }

    useEffect(() => {
        loadEmpresas()
    }, [])

    const handleSelectEmpresa = (empresaOrId: Empresa | string) => {
        const id = typeof empresaOrId === 'string' ? empresaOrId : empresaOrId.id

        if (variant === 'form') {
            if (id === 'ALL') return // Form variant usually doesn't support ALL unless specific requirement
            onSelect?.(id)
            const emp = empresas.find(e => e.id === id)
            if (emp) setEmpresaActiva(emp)
        } else {
            // En el header, el cambio es global y requiere confirmación
            if (id === empresaActiva?.id) return
            setPendingEmpresaId(id)
            setShowConfirm(true)
        }
    }

    const confirmCambioEmpresa = async () => {
        if (!pendingEmpresaId) return

        // Mover el cierre del diálogo aquí para evitar parpadeos o estados inconsistentes
        const empresaIdToSwitch = pendingEmpresaId

        const result = await cambiarEmpresaActivaAction(empresaIdToSwitch)

        if (result.success) {
            toast.success('Entorno de trabajo actualizado')
            setShowConfirm(false) // Cerrar diálogo visualmente

            // Redirigir al dashboard para cargar el nuevo contexto
            setTimeout(() => {
                window.location.href = '/dashboard'
            }, 300)
        } else {
            toast.error(result.error || 'Error al cambiar de empresa')
            setPendingEmpresaId(null) // Reset solo en error
            setShowConfirm(false)
        }
    }

    // Loader minimalista con animación pulsante
    if (isLoading) {
        return (
            <div className="h-10 w-[200px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse flex items-center px-3 gap-2">
                <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
        )
    }

    if (empresas.length === 0 && !isAdmin) return null

    // Caso de empresa única en selector de formulario (Simplificado)
    if (empresas.length === 1 && !isAdmin && variant === 'form') {
        const emp = empresas[0]
        return (
            <div className="flex items-center gap-3 px-4 py-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur rounded-xl border border-slate-200 dark:border-slate-800">
                {emp.logo_url ? (
                    <Image
                        src={emp.logo_url}
                        alt={emp.razon_social}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-lg object-cover shadow-sm"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-white" />
                    </div>
                )}
                <span className="font-bold text-slate-700 dark:text-slate-300">{emp.razon_social}</span>
            </div>
        )
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        data-testid="empresa-selector-trigger"
                        variant={variant === 'header' ? 'ghost' : 'outline'}
                        className={`group transition-all duration-300 active:scale-95 touch-manipulation ${
                            variant === 'header'
                                ? 'h-11 min-h-[44px] px-3 gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl hover:bg-white/60 dark:hover:bg-slate-900/60 border border-white/20 dark:border-slate-800/20'
                                : 'w-full justify-between h-12 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {empresaActiva?.id === 'ALL' ? (
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                                    <Building2 className="w-4 h-4 text-white" />
                                </div>
                            ) : empresaActiva?.logo_url ? (
                                <Image
                                    src={empresaActiva.logo_url}
                                    alt={empresaActiva.razon_social}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                                    <Building2 className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <span className="font-black text-sm tracking-tight truncate max-w-[140px] md:max-w-[200px] text-slate-800 dark:text-slate-200 uppercase">
                                {empresaActiva?.nombre_comercial || empresaActiva?.razon_social || 'Seleccionar'}
                            </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 opacity-50 transition-transform group-data-[state=open]:rotate-180`} />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align={variant === 'header' ? 'end' : 'start'}
                    className="w-[300px] p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-white/20 dark:border-slate-800/40 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200"
                >
                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Tus Organizaciones
                    </div>

                    <div className="space-y-1">
                        {/* Global View Option for Admins */}
                        {isAdmin && (
                            <DropdownMenuItem
                                data-testid="empresa-option-ALL"
                                onClick={() => handleSelectEmpresa('ALL')}
                                className={`flex items-center justify-between px-3 py-4 cursor-pointer rounded-2xl transition-all active:scale-[0.98] mb-2 ${
                                    empresaActiva?.id === 'ALL'
                                        ? 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 border border-indigo-500/20'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md text-white">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-tight truncate max-w-[160px]">
                                            Todas las Empresas
                                        </span>
                                        <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest flex items-center gap-1">
                                            Visión Global • Admin
                                        </span>
                                    </div>
                                </div>
                                {empresaActiva?.id === 'ALL' && (
                                    <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-in zoom-in-50" />
                                )}
                            </DropdownMenuItem>
                        )}

                        {empresas.map((empresa) => (
                            <DropdownMenuItem
                                key={empresa.id}
                                data-testid={`empresa-option-${empresa.id}`}
                                onClick={() => handleSelectEmpresa(empresa)}
                                className={`flex items-center justify-between px-3 py-4 cursor-pointer rounded-2xl transition-all active:scale-[0.98] ${
                                    (variant === 'header' ? empresa.activa : empresa.id === selectedId)
                                        ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    {empresa.logo_url ? (
                                        <Image
                                            src={empresa.logo_url}
                                            alt={empresa.razon_social}
                                            width={44}
                                            height={44}
                                            className="w-11 h-11 rounded-xl object-cover border-2 border-white dark:border-slate-800 shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md text-white">
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-tight truncate max-w-[160px]">
                                            {empresa.nombre_comercial || empresa.razon_social}
                                        </span>
                                        <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest flex items-center gap-1">
                                            {empresa.tipo_empresa} • {empresa.rol === 'admin' ? '💎 Admin' : '👤 Usuario'}
                                        </span>
                                    </div>
                                </div>
                                {(variant === 'header' ? empresa.activa : empresa.id === selectedId) && (
                                    <Check className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-in zoom-in-50" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </div>

                    {variant === 'header' && (
                        <>
                            <DropdownMenuSeparator className="my-2 bg-slate-200/50 dark:bg-slate-800/50" />
                            <DropdownMenuItem
                                onClick={() => router.push('/configuracion/empresas')}
                                className="flex items-center gap-3 py-4 px-4 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 font-bold text-sm cursor-pointer rounded-2xl active:scale-95"
                            >
                                <Plus className="h-5 w-5" />
                                <span>Administrar Empresas</span>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmDialog
                open={showConfirm}
                onOpenChange={setShowConfirm}
                title="Cambiar Entorno de Trabajo"
                description={
                    pendingEmpresaId === 'ALL'
                        ? "¿Deseas cambiar a la **Visión Global**? Verás los datos consolidados de todas las empresas."
                        : `¿Deseas cambiar a \"${empresas.find(e => e.id === pendingEmpresaId)?.razon_social || pendingEmpresaId}\"? La aplicación se reiniciará para cargar el nuevo contexto.`
                }
                confirmText="Sincronizar y Cambiar"
                onConfirm={confirmCambioEmpresa}
            />
        </>
    )
}
