'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { Calendar, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { getRangeForPeriodo, type PeriodoValue, type VistaValue } from '@/lib/dashboard-period'

export type { PeriodoValue, VistaValue }

const PERIODO_OPTIONS: { value: PeriodoValue; label: string }[] = [
    { value: 'actual', label: 'Mes actual' },
    { value: 'anterior', label: 'Mes anterior' },
    { value: 'trimestre', label: 'Este trimestre' },
    { value: 'ytd', label: 'Año hasta hoy' },
    { value: 'ultimo_anio', label: 'Últimos 12 meses' },
    { value: 'custom', label: 'Rango personalizado' },
]

interface DashboardPeriodSelectorProps {
    periodo: PeriodoValue
    desde: string
    hasta: string
    vista?: VistaValue
    className?: string
}

export function DashboardPeriodSelector({ periodo, desde, hasta, vista = 'mes', className }: DashboardPeriodSelectorProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [customDesde, setCustomDesde] = useState(desde)
    const [customHasta, setCustomHasta] = useState(hasta)
    const [open, setOpen] = useState(false)
    const [isApplying, setIsApplying] = useState(false)

    // Sincronizar con props cuando cambian (ej. tras navegación)
    useEffect(() => {
        setCustomDesde(desde)
        setCustomHasta(hasta)
    }, [desde, hasta])

    const applyParams = useCallback(
        (p: PeriodoValue, d?: string, h?: string) => {
            const range = getRangeForPeriodo(p, d, h)
            const params = new URLSearchParams(searchParams.toString())
            params.set('periodo', p)
            params.set('desde', range.desde)
            params.set('hasta', range.hasta)
            params.set('vista', vista)
            setIsApplying(true)
            router.push(`/dashboard?${params.toString()}`)
            setOpen(false)
            router.refresh()
            setTimeout(() => setIsApplying(false), 800)
        },
        [router, searchParams, vista]
    )

    const handlePeriodoChange = (value: string) => {
        const p = value as PeriodoValue
        if (p === 'custom') {
            setCustomDesde(desde)
            setCustomHasta(hasta)
        } else {
            applyParams(p)
        }
    }

    const handleApplyCustom = () => {
        if (customDesde && customHasta && customDesde <= customHasta) {
            applyParams('custom', customDesde, customHasta)
        }
    }

    const periodLabel =
        periodo === 'custom'
            ? `${desde} – ${hasta}`
            : periodo === 'actual'
                ? 'Mes actual'
                : periodo === 'anterior'
                    ? 'Mes anterior'
                    : periodo === 'trimestre'
                        ? 'Este trimestre'
                        : periodo === 'ytd'
                            ? 'Año hasta hoy'
                            : periodo === 'ultimo_anio'
                                ? 'Últimos 12 meses'
                                : periodo

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    data-testid="dashboard-period-btn"
                    disabled={isApplying}
                    className={cn(
                        'min-w-[180px] sm:min-w-[220px] justify-start gap-2 font-medium border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800',
                        isApplying && 'opacity-70',
                        className
                    )}
                >
                    <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="truncate text-left flex-1 min-w-0">{isApplying ? 'Aplicando…' : periodLabel}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-4" align="end">
                <div className="space-y-4">
                    <div>
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Período</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {PERIODO_OPTIONS.filter((o) => o.value !== 'custom').map((opt) => (
                                <Button
                                    key={opt.value}
                                    variant={periodo === opt.value ? 'default' : 'ghost'}
                                    size="sm"
                                    className={cn(
                                        'h-8 min-h-[44px] sm:min-h-[32px] text-xs transition-colors duration-200 active:scale-[0.98]',
                                        periodo === opt.value && 'ring-2 ring-primary/30'
                                    )}
                                    onClick={() => handlePeriodoChange(opt.value)}
                                >
                                    {periodo === opt.value && <Check className="mr-1 h-3 w-3" />}
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Rango personalizado
                        </Label>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="desde" className="text-xs text-slate-500">Desde</Label>
                                <Input
                                    id="desde"
                                    type="date"
                                    value={customDesde}
                                    onChange={(e) => setCustomDesde(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="hasta" className="text-xs text-slate-500">Hasta</Label>
                                <Input
                                    id="hasta"
                                    type="date"
                                    value={customHasta}
                                    onChange={(e) => setCustomHasta(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <Button
                                className="col-span-2"
                                onClick={handleApplyCustom}
                                disabled={!customDesde || !customHasta || customDesde > customHasta}
                            >
                                Aplicar rango
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
