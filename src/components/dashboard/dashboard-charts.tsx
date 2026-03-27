'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    getEvolucionFacturacionAction,
    getEstadoFacturasAction,
    type EvolucionData,
    type EstadoData,
} from '@/app/actions/informes'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts'
import { LineChart as LineIcon, BarChart3, Mountain, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY_CHART_TYPE = 'dashboard-chart-type'
export type ChartTypeValue = 'line' | 'bar' | 'area'

function getStoredChartType(): ChartTypeValue {
    try {
        if (typeof window !== 'undefined') {
            const v = window.localStorage.getItem(STORAGE_KEY_CHART_TYPE)
            if (v === 'bar' || v === 'area') return v
        }
    } catch {
        /* ignore */
    }
    return 'line'
}

const COLORS = [
    'hsl(var(--primary))',
    '#0ea5e9', // Sky 500
    '#10b981', // Emerald 500
    '#f59e0b', // Amber 500
    '#6366f1', // Indigo 500
    '#ec4899', // Pink 500
]

interface DashboardChartsProps {
    fechaDesde: string
    fechaHasta: string
    empresaId?: string | null
}

interface CustomTooltipProps {
    active?: boolean
    payload?: Array<{
        name: string
        value: number
        color?: string
        fill?: string
    }>
    label?: string | number
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-white/10 p-4 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                <div className="space-y-1.5">
                    {payload.map((entry, index: number) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                            <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(entry.value)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    return null
}

export function DashboardCharts({ fechaDesde, fechaHasta, empresaId }: DashboardChartsProps) {
    const [evolucion, setEvolucion] = useState<EvolucionData[]>([])
    const [estados, setEstados] = useState<EstadoData[]>([])
    const [loading, setLoading] = useState(true)
    const [chartType, setChartType] = useState<ChartTypeValue>('line')
    const [fetchError, setFetchError] = useState<string | null>(null)

    useEffect(() => {
        setChartType(getStoredChartType())
    }, [])

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setFetchError(null)
            try {
                const [evRes, estRes] = await Promise.all([
                    getEvolucionFacturacionAction(fechaDesde, fechaHasta, empresaId),
                    getEstadoFacturasAction(fechaDesde, fechaHasta, empresaId),
                ])
                if (evRes.success && evRes.data) setEvolucion(evRes.data)
                if (estRes.success && estRes.data) setEstados(estRes.data.filter((e) => e.estado !== 'anulada'))
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                setFetchError(msg.includes('fetch') ? 'Error de conexión.' : msg)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [fechaDesde, fechaHasta, empresaId])

    const handleChartTypeChange = useCallback((type: ChartTypeValue) => {
        setChartType(type)
        if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY_CHART_TYPE, type)
    }, [])

    const estadoLabels: Record<string, string> = {
        pagada: 'Pagadas',
        emitida: 'Emitidas',
        borrador: 'Borradores',
    }

    const commonChartProps = {
        data: evolucion,
        margin: { top: 20, right: 20, left: 0, bottom: 0 },
    }

    const commonAxis = (
        <>
            <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} stroke="#64748b" />
            <XAxis 
                dataKey="periodo" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
                fontFamily="inherit"
                fontWeight={500}
            />
            <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} 
                dx={-10}
                fontFamily="inherit"
                fontWeight={500}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }} />
        </>
    )

    if (loading) {
        return (
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 h-[400px] border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Analizando evolución...</p>
                    </div>
                </Card>
                <Card className="h-[400px] border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Distribuyendo estados...</p>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-primary/5 group">
                <CardHeader className="pb-4 flex flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">
                            Evolución de Ingresos
                        </CardTitle>
                        <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-[0.2em]">
                            Performance del período
                        </p>
                    </div>
                    
                    <div className="flex gap-1 p-1 bg-slate-900/5 dark:bg-white/5 rounded-2xl backdrop-blur-sm">
                        {[
                            { value: 'line' as const, icon: LineIcon, label: 'Línea' },
                            { value: 'bar' as const, icon: BarChart3, label: 'Barras' },
                            { value: 'area' as const, icon: Mountain, label: 'Área' },
                        ].map(({ value, icon: Icon, label }) => (
                            <Button
                                key={value}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    'h-8 w-8 p-0 rounded-xl transition-all duration-300',
                                    chartType === value 
                                        ? 'bg-white dark:bg-slate-800 text-primary shadow-lg ring-1 ring-black/5' 
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                )}
                                onClick={() => handleChartTypeChange(value)}
                                title={label}
                            >
                                <Icon className="h-4 w-4" />
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] sm:h-[300px] w-full">
                        {evolucion.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                {chartType === 'line' ? (
                                    <LineChart {...commonChartProps}>
                                        {commonAxis}
                                        <Line 
                                            type="monotone" 
                                            dataKey="facturacion" 
                                            stroke="hsl(var(--primary))" 
                                            strokeWidth={4} 
                                            dot={{ fill: 'hsl(var(--primary))', r: 5, strokeWidth: 2, stroke: '#fff' }} 
                                            activeDot={{ r: 8, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                                            animationDuration={2000}
                                            filter="url(#glow)"
                                        />
                                    </LineChart>
                                ) : chartType === 'bar' ? (
                                    <BarChart {...commonChartProps}>
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        {commonAxis}
                                        <Bar 
                                            dataKey="facturacion" 
                                            fill="url(#barGradient)" 
                                            radius={[10, 10, 0, 0]} 
                                            animationDuration={1500}
                                            className="transition-all duration-300 hover:opacity-80"
                                        />
                                    </BarChart>
                                ) : (
                                    <AreaChart {...commonChartProps}>
                                        <defs>
                                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        {commonAxis}
                                        <Area 
                                            type="monotone" 
                                            dataKey="facturacion" 
                                            stroke="hsl(var(--primary))" 
                                            strokeWidth={3}
                                            fill="url(#areaGradient)" 
                                            animationDuration={2000}
                                            filter="url(#glow)"
                                        />
                                    </AreaChart>
                                )}
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-2">
                                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center opacity-50">
                                    <LineIcon className="h-6 w-6" />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-50">Sin datos este período</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-primary/5 group">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">
                        Estados
                    </CardTitle>
                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-[0.2em]">
                        Mix de facturación
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        {estados.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={estados}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={8}
                                        dataKey="cantidad"
                                        nameKey="estado"
                                        animationDuration={1500}
                                        stroke="none"
                                    >
                                        {estados.map((_, i) => (
                                            <Cell 
                                                key={i} 
                                                fill={COLORS[i % COLORS.length]} 
                                                className="transition-all duration-300 hover:opacity-80 outline-none" 
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value: string) => (
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                                {estadoLabels[value] || value}
                                            </span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-2">
                                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center opacity-50">
                                    <Loader2 className="h-6 w-6" />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-50">Sin facturas</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
