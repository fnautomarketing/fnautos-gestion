'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Search, Moon, Sun, Menu } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Sidebar } from './sidebar'
import { UserDropdown } from './user-dropdown'
import { EmpresaSelector } from '@/components/empresa-selector'
import { NotificacionesDropdown } from '@/components/notificaciones-dropdown'
import type { User } from '@supabase/supabase-js'
import { clientConfig } from '@/config/clients'

interface NavbarProps {
    user: User
}

export function Navbar({ user }: NavbarProps) {
    const [isDark, setIsDark] = useState(false)
    const [sheetOpen, setSheetOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        setSheetOpen(false)
    }, [pathname])

    const toggleTheme = () => {
        setIsDark(!isDark)
        document.documentElement.classList.toggle('dark')
    }

    return (
        <header
            data-testid="navbar-header"
            className="sticky top-0 z-30 flex h-16 sm:h-20 items-center gap-2 sm:gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl px-3 sm:px-4 lg:px-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-b border-slate-200/50 dark:border-white/5 transition-all duration-500"
            role="banner"
        >
            {/* Mobile Menu - touch target 44px mínimo (WCAG) */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        data-testid="navbar-toggle-menu"
                        className="lg:hidden min-h-[44px] min-w-[44px] h-11 w-11 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors touch-manipulation"
                        aria-label="Abrir menú de navegación"
                    >
                        <Menu className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 border-r-white/5 bg-[#1a2332] w-[85vw] max-w-[340px] sm:w-72 sm:max-w-none">
                    <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                    <Sidebar className="static w-full h-full border-none shadow-none" userEmail={user?.email} />
                </SheetContent>
            </Sheet>

            {/* Search Input - Ultra Premium Style */}
            <div className="flex-1 max-w-xl hidden md:block">
                <div className="relative group/search">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within/search:text-primary group-focus-within/search:scale-110 transition-all duration-300" />
                    <Input
                        id="navbar-search"
                        name="q"
                        type="search"
                        role="searchbox"
                        aria-label={`Buscar en ${clientConfig.nombre}`}
                        placeholder={`Buscar en ${clientConfig.nombre}...`}
                        className="w-full h-12 rounded-2xl bg-slate-100/50 dark:bg-white/5 pl-11 pr-12 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-primary/20 focus:ring-8 focus:ring-primary/5 transition-all duration-500 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1.5">
                        <kbd className="h-6 px-2 rounded-md border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 flex items-center justify-center shadow-xs">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">⌘</span>
                        </kbd>
                        <kbd className="h-6 px-2 rounded-md border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 flex items-center justify-center shadow-xs">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">K</span>
                        </kbd>
                    </div>
                </div>
            </div>

            <div className="flex-1 md:hidden" />

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-4 md:gap-5 flex-shrink-0">
                {/* Notifications */}
                <NotificacionesDropdown />

                {/* Theme Toggle - 44px touch target */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    data-testid="navbar-theme-toggle"
                    className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-primary transition-all duration-300 group touch-manipulation"
                >
                    {isDark ? (
                        <Sun className="h-5 w-5 group-hover:rotate-45" />
                    ) : (
                        <Moon className="h-5 w-5 group-hover:-rotate-12" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                </Button>

                {/* Company Selector (RFC-025) - Only show if multi-company is enabled */}
                {clientConfig.multiEmpresa ? (
                    <EmpresaSelector variant="header" />
                ) : (
                    <div className="hidden sm:flex items-center h-11 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm">
                        <span className="font-extrabold text-[13px] tracking-wide text-slate-800 dark:text-slate-200 uppercase">
                            {clientConfig.razonSocial}
                        </span>
                    </div>
                )}

                <div className="h-8 w-px bg-slate-200/50 dark:bg-white/10 mx-1 hidden sm:block" />

                {/* User Dropdown */}
                <UserDropdown user={user} />
            </div>
        </header>
    )
}
