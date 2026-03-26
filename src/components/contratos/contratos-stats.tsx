'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FileSignature, Clock, BadgeCheck, FileText, Info } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'

interface ContratosStatsProps {
    stats: {
        totalVentas: number // Total de compras (facturas de clientes a favor)
        totalCompras: number // Total de compras de concesionario (a favor del cliente)
        firmados: number // Conteo de contratos en estado "firmado"
        pendientesFirma: number // Conteo
    }
}

function AnimateNumber({ value, formatter = (v: number) => String(v), duration = 800 }: { value: number, formatter?: (v: number) => string, duration?: number }) {
    const [displayValue, setDisplayValue] = useState(0)

    useEffect(() => {
        let startTimestamp: number | null = null
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp
            const progress = Math.min((timestamp - startTimestamp) / duration, 1)
            setDisplayValue(progress * value)
            if (progress < 1) {
                window.requestAnimationFrame(step)
            } else {
                setDisplayValue(value)
            }
        }
        window.requestAnimationFrame(step)
    }, [value, duration])

    return <>{formatter(displayValue)}</>
}

function KpiInfoButton({ title, description }: { title: string; description: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full h-5 w-5 bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 hover:bg-primary/10 hover:text-primary transition-all duration-300 ml-1.5 shrink-0"
                    aria-label={`Información sobre ${title}`}
                >
                    <Info className="h-3 w-3" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-white/20 dark:border-white/10 shadow-2xl rounded-2xl" align="start">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
            </PopoverContent>
        </Popover>
    )
}

export function ContratosStats({ stats }: ContratosStatsProps) {
    const items = [
        {
            id: 'ventas',
            label: 'Total Ventas',
            description: "Suma del importe de los contratos donde vendiste vehículos.",
            value: stats.totalVentas,
            formatter: formatCurrency,
            icon: FileText,
            color: 'text-primary',
            bg: 'bg-primary/10',
            glow: 'from-primary/20 to-transparent',
            delay: '0ms'
        },
        {
            id: 'compras',
            label: 'Total Compras',
            description: "Suma del importe de los contratos donde compraste vehículos.",
            value: stats.totalCompras,
            formatter: formatCurrency,
            icon: FileText,
            color: 'text-zinc-500',
            bg: 'bg-zinc-500/10',
            glow: 'from-zinc-500/20 to-transparent',
            delay: '100ms'
        },
        {
            id: 'firmados',
            label: 'Contratos Firmados',
            description: "Cantidad de contratos que han sido firmados electrónicamente.",
            value: stats.firmados,
            formatter: (v: number) => Math.round(v).toString(),
            icon: BadgeCheck,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            glow: 'from-emerald-500/20 to-transparent',
            delay: '200ms'
        },
        {
            id: 'pendientes',
            label: 'Pendiente Firma',
            description: "Cantidad de contratos emitidos que faltan por firmar.",
            value: stats.pendientesFirma,
            formatter: (v: number) => Math.round(v).toString(),
            icon: FileSignature,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            glow: 'from-amber-500/20 to-transparent',
            delay: '300ms'
        }
    ]

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
                <Card 
                    key={item.id}
                    className="group relative overflow-hidden border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-2xl hover:shadow-primary/5 transition-all duration-500 rounded-3xl animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: item.delay }}
                >
                    <div className={cn(
                        "absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-full",
                        item.glow
                    )} />

                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center">
                                    {item.label}
                                    <KpiInfoButton title={item.label} description={item.description} />
                                </p>
                                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                    <AnimateNumber value={item.value} formatter={item.formatter} />
                                </div>
                            </div>
                            <div className={cn(
                                "p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner",
                                item.bg
                            )}>
                                <item.icon className={cn("h-6 w-6", item.color)} />
                            </div>
                        </div>
                        
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/50">
                            <div 
                                className={cn("h-full transition-all duration-1000 ease-out rounded-full", item.color.replace('text-', 'bg-'))}
                                style={{ width: '40%' }}
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
