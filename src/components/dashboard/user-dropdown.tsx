'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Settings, User, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import type { User as SupabaseUser } from '@supabase/supabase-js'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { logoutAction } from '@/app/actions/auth'

interface UserDropdownProps {
    user: SupabaseUser
}

function getDisplayName(email: string | null, metadata?: Record<string, unknown>): string {
    const fromMeta = metadata?.full_name
    if (typeof fromMeta === 'string' && fromMeta.trim()) return fromMeta.trim()
    if (!email) return 'Administrador'
    if (email.toLowerCase().startsWith('administracion@')) return 'Administración'
    const local = email.split('@')[0] || ''
    const cleaned = local.replace(/[._-]+/g, ' ').trim()
    if (!cleaned) return 'Administrador'
    return cleaned
        .split(' ')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ')
}

export function UserDropdown({ user }: UserDropdownProps) {
    const router = useRouter()

    const handleLogout = async () => {
        const result = await logoutAction()

        if (result.success) {
            toast.success('Sesión cerrada correctamente')
            // Forzar recarga completa para limpiar estado de cliente
            window.location.href = '/login'
        } else {
            toast.error('Error al cerrar sesión')
        }
    }

    const displayName = getDisplayName(user.email || null, user.user_metadata)
    const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) || null

    const initials =
        displayName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0])
            .join('')
            .toUpperCase() ||
        user.email
            ?.split('@')[0]
            .substring(0, 2)
            .toUpperCase() ||
        'AU'

    const handleOpenPerfil = () => {
        router.push('/perfil')
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                data-testid="navbar-user-dropdown"
                className="flex items-center gap-3 rounded-full focus:outline-none group min-h-[44px] min-w-[44px] touch-manipulation p-1 -m-1"
                aria-label="Menú de usuario"
            >
                <div className="hidden text-right lg:block">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                        {displayName}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-primary tracking-wider">
                        Administrador único
                    </p>
                </div>
                <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-700 shadow-md group-hover:border-primary transition-colors">
                    {avatarUrl ? (
                        <AvatarImage
                            src={avatarUrl}
                            alt=""
                            className="object-cover"
                        />
                    ) : null}
                    <AvatarFallback className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-64 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-xl"
            >
                <DropdownMenuLabel className="p-2">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{displayName}</p>
                        <p className="text-xs text-slate-500 font-medium truncate">{user.email}</p>
                    </div>
                </DropdownMenuLabel>

                <div className="p-2 m-1 rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
                        <Sparkles className="w-3 h-3" />
                        <span>Administrador del sistema</span>
                    </div>
                </div>

                <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-800/50" />

                <DropdownMenuItem
                    onClick={handleOpenPerfil}
                    className="cursor-pointer rounded-lg focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-primary transition-colors"
                    data-testid="user-menu-perfil"
                >
                    <User className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-800/50" />

                <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 rounded-lg"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
