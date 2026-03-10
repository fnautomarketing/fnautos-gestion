'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useState, useEffect, useRef } from 'react'
import { clientConfig } from '@/config/clients'
import {
    LayoutDashboard,
    ShoppingCart,
    Receipt,
    Users,
    CreditCard,
    BarChart3,
    Settings,
    ChevronDown,
    ChevronRight,
    Hash,
} from 'lucide-react'

interface NavItem {
    name: string
    href: string
    icon: any
    submenu?: {
        name: string
        href: string
        icon: any
    }[]
}

const navigation: NavItem[] = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        name: 'Ventas',
        href: '/ventas',
        icon: ShoppingCart,
        submenu: [
            { name: 'Facturas', href: '/ventas/facturas', icon: Receipt },
            { name: 'Clientes', href: '/ventas/clientes', icon: Users },
            { name: 'Pagos', href: '/ventas/pagos', icon: CreditCard },
            { name: 'Informes', href: '/ventas/informes', icon: BarChart3 },
        ]
    },
]

const tools: NavItem[] = [
    {
        name: 'Configuración',
        href: '/ventas/configuracion/empresa',
        icon: Settings,
        submenu: [
            { name: 'Empresa', href: '/ventas/configuracion/empresa', icon: Settings },
            { name: 'Series', href: '/ventas/configuracion/series', icon: Hash },
        ]
    },
]

interface SidebarProps {
    className?: string
    userEmail?: string
}

export function Sidebar({ className, userEmail }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [openMenus, setOpenMenus] = useState<string[]>([])
    const prevPathRef = useRef(pathname)

    // Auto-open solo el menú que contiene la ruta activa (solo al cambiar pathname)
    useEffect(() => {
        if (pathname !== prevPathRef.current) {
            prevPathRef.current = pathname
            const toOpen: string[] = []
            ;[...navigation, ...tools].forEach(item => {
                if (item.submenu && item.submenu.some(sub => pathname.startsWith(sub.href))) {
                    toOpen.push(item.name)
                }
            })
            if (toOpen.length > 0) {
                setOpenMenus(prev => [...new Set([...prev, ...toOpen])])
            }
        }
    }, [pathname])

    const toggleMenu = (name: string) => {
        setOpenMenus(prev =>
            prev.includes(name)
                ? prev.filter(n => n !== name)
                : [...prev, name]
        )
    }

    const baseEmail = (userEmail || clientConfig.email.admin).toLowerCase()
    
    // Mejorar lógica de visualización de usuario
    const isClientAdmin = baseEmail === clientConfig.email.admin.toLowerCase()
    const footerName = isClientAdmin ? (clientConfig.nombreCorto || 'Administrador') : (userEmail?.split('@')[0] || 'Usuario')
    const footerInitials = isClientAdmin
        ? (clientConfig.id === 'nike' ? 'N' : clientConfig.nombreCorto?.[0] || 'A')
        : (baseEmail.split('@')[0] || 'us')
              .substring(0, 2)
              .toUpperCase()

    const renderNavItem = (item: NavItem) => {
        const isActive = pathname === item.href || (item.submenu && item.submenu.some(sub => pathname.startsWith(sub.href)))
        const isOpen = openMenus.includes(item.name)
        const Icon = item.icon

        if (item.submenu) {
            return (
                <div key={item.name} className="space-y-1">
                    <button
                        type="button"
                        onClick={() => toggleMenu(item.name)}
                        className={cn(
                            'w-full group flex items-center justify-between gap-3 rounded-xl px-4 py-3 min-h-[44px] sm:min-h-0 sm:py-3 text-sm font-semibold transition-all duration-500 relative overflow-hidden touch-manipulation',
                            isActive
                                ? 'bg-white/5 text-primary shadow-[inset_0_0_20px_rgba(var(--primary),0.05)]'
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 hover:translate-x-1'
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-primary drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]" : "group-hover:text-primary")} />
                            {item.name}
                        </div>
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>

                    {isOpen && (
                        <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                            {item.submenu.map(sub => {
                                const SubIcon = sub.icon
                                return (
                                    <Link
                                        key={sub.name}
                                        href={sub.href}
                                        className={cn(
                                            'group flex items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] sm:min-h-0 sm:py-2 text-sm font-medium transition-all duration-300 relative touch-manipulation',
                                            pathname === sub.href
                                                ? 'bg-white/5 text-primary'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                                        )}
                                    >
                                        <SubIcon className={cn("h-4 w-4 shrink-0 transition-colors", pathname === sub.href ? "text-primary" : "group-hover:text-primary")} />
                                        {sub.name}
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            )
        }

        return (
            <Link
                key={item.name}
                href={item.href}
                className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-3 min-h-[44px] sm:min-h-0 sm:py-3 text-sm font-medium transition-all duration-300 relative overflow-hidden touch-manipulation',
                    isActive
                        ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 hover:translate-x-1'
                )}
            >
                {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_2px_rgba(var(--primary),0.5)]" />
                )}
                <Icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-primary drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]" : "group-hover:text-primary")} />
                {item.name}
            </Link>
        )
    }

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen w-64 flex flex-col bg-[#1a2332]/95 backdrop-blur-xl text-slate-200 border-r border-white/5 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.5)] transition-all duration-500 overflow-hidden',
                className
            )}
        >
            {/* Logo Section - responsive padding y safe area */}
            <div className="flex-shrink-0 flex h-16 sm:h-20 items-center gap-2 sm:gap-3 px-4 sm:px-6 pt-[env(safe-area-inset-top)] border-b border-white/5 bg-[#171f2c]">
                <div className="relative h-9 w-9 sm:h-10 sm:w-10 shrink-0 overflow-hidden rounded-lg bg-white/5 p-1 ring-1 ring-white/10">
                    <Image
                        src={clientConfig.logoPath}
                        alt={clientConfig.nombre}
                        fill
                        className="object-contain"
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-serif font-bold text-base sm:text-lg text-white tracking-wide truncate">{clientConfig.nombre}</p>
                    <p className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">Enterprise</p>
                </div>
            </div>

            {/* Navigation - scroll con safe area y padding responsive */}
            <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-3 py-4 sm:py-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-600/60 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500/70">
                {/* Principal */}
                <div className="space-y-1">
                    <p className="px-3 text-xs sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Principal</p>
                    {navigation.map(renderNavItem)}
                </div>

                {/* Herramientas */}
                <div className="pt-4 sm:pt-6 space-y-1">
                    <p className="px-3 text-xs sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        Herramientas
                    </p>
                    {tools.map(renderNavItem)}
                </div>
            </nav>

            {/* User Info Footer - safe area para iOS */}
            <div className="flex-shrink-0 border-t border-white/5 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#171f2c]/50 backdrop-blur-md">
                <button
                    type="button"
                    onClick={() => router.push('/perfil')}
                    className="w-full flex items-center gap-3 p-3 min-h-[52px] rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer group shadow-inner text-left touch-manipulation active:scale-[0.98]"
                    data-testid="sidebar-user-perfil"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-white text-xs font-black shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                        {footerInitials}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{footerName}</p>
                        <p className="text-[10px] font-medium text-slate-400 truncate">
                            {userEmail || clientConfig.email.admin}
                        </p>
                    </div>
                </button>
            </div>
        </aside>
    )
}
