'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VistaValue } from '@/lib/dashboard-period'

const VISTA_OPTIONS: { value: VistaValue; label: string }[] = [
    { value: 'semana', label: 'Semana' },
    { value: 'mes', label: 'Mes' },
]

interface DashboardVistaSelectorProps {
    vista: VistaValue
    className?: string
}

export function DashboardVistaSelector({ vista, className }: DashboardVistaSelectorProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const setVista = useCallback(
        (v: VistaValue) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set('vista', v)
            router.push(`/dashboard?${params.toString()}`)
            router.refresh()
        },
        [router, searchParams]
    )

    return (
        <div
            role="group"
            aria-label="Vista de período"
            className={cn('inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 p-0.5', className)}
        >
            {VISTA_OPTIONS.map((opt) => (
                <Button
                    key={opt.value}
                    variant="ghost"
                    size="sm"
                    data-testid={`dashboard-vista-${opt.value}`}
                    className={cn(
                        'h-8 min-h-[44px] sm:min-h-[32px] min-w-[72px] rounded-md text-xs font-medium transition-colors duration-200 active:scale-[0.98]',
                        vista === opt.value
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    )}
                    onClick={() => setVista(opt.value)}
                >
                    {opt.label}
                </Button>
            ))}
        </div>
    )
}
