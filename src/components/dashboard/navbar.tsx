'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Search, Moon, Sun, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Sidebar } from './sidebar'
import { UserDropdown } from './user-dropdown'
import { CommandPalette } from './command-palette'
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
    const [commandOpen, setCommandOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        setSheetOpen(false)
    }, [pathname])

    // Atajo de teclado global: Ctrl+K / ⌘K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setCommandOpen(prev => !prev)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    const toggleTheme = () => {
        setIsDark(!isDark)
        document.documentElement.classList.toggle('dark')
    }

    return (
        <>
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

            {/* Search Trigger — Command Palette (⌘K) */}
            <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="hidden md:flex items-center gap-3 w-full max-w-md h-11 rounded-2xl bg-slate-100/50 dark:bg-white/5 pl-4 pr-3 border border-transparent hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                aria-label={`Buscar en ${clientConfig.nombre}`}
            >
                <Search className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
                <span className="text-sm text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors truncate">
                    Buscar facturas, contratos, clientes...
                </span>
                <div className="ml-auto flex items-center gap-1 shrink-0">
                    <kbd className="h-5 px-1.5 rounded border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 flex items-center justify-center">
                        <span className="text-[10px] text-slate-400 font-bold">⌘</span>
                    </kbd>
                    <kbd className="h-5 px-1.5 rounded border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 flex items-center justify-center">
                        <span className="text-[10px] text-slate-400 font-bold">K</span>
                    </kbd>
                </div>
            </button>

            {/* Mobile search icon */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden min-h-[44px] min-w-[44px] h-11 w-11 hover:bg-slate-100 dark:hover:bg-white/5 touch-manipulation"
                onClick={() => setCommandOpen(true)}
                aria-label="Buscar"
            >
                <Search className="h-5 w-5 text-slate-500" />
            </Button>

            {/* Spacer — empuja acciones al extremo derecho */}
            <div className="flex-1" />

            {/* Actions — siempre a la derecha */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
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

        {/* Command Palette — búsqueda global inteligente */}
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
        </>
    )
}
