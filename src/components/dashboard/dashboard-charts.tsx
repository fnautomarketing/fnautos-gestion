'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { LineChart as LineIcon, BarChart3, Mountain } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY_CHART_TYPE = 'dashboard-chart-type'
export type ChartTypeValue = 'line' | 'bar' | 'area'

function getStoredChartType(): ChartTypeValue {
    try {
        const v = window.localStorage.getItem(STORAGE_KEY_CHART_TYPE)
        if (v === 'bar' || v === 'area') return v
    } catch {
        /* ignore */
    }
    return 'line'
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

interface DashboardChartsProps {
    fechaDesde: string
    fechaHasta: string
    empresaId?: string | null
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
                setFetchError(msg.includes('fetch') || msg.includes('Failed to fetch') ? 'Error de conexión. Comprueba tu conexión e intenta de nuevo.' : msg)
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

    if (loading) {
        return (
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 h-[320px] animate-pulse bg-slate-100 dark:bg-slate-800/50" />
                <Card className="h-[320px] animate-pulse bg-slate-100 dark:bg-slate-800/50" />
            </div>
        )
    }

    if (fetchError) {
        return (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="py-6 px-4 text-center">
                    <p className="text-amber-800 dark:text-amber-200 font-medium">{fetchError}</p>
                </CardContent>
            </Card>
        )
    }

    const estadoLabels: Record<string, string> = {
        pagada: 'Pagadas',
        emitida: 'Emitidas',
        borrador: 'Borradores',
    }

    const chartTooltipFormatter = (value: number) => [
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value),
        'Facturación',
    ]
    const commonChartProps = {
        data: evolucion,
        margin: { top: 5, right: 10, left: 0, bottom: 0 },
    }
    const commonAxis = (
        <>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis dataKey="periodo" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k€`} />
            <Tooltip
                formatter={(value: number) => chartTooltipFormatter(value)}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
        </>
    )

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 shadow-lg">
                <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                            Evolución de facturación
                        </CardTitle>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Ingresos por mes en el período seleccionado
                        </p>
                    </div>
                    <div role="group" aria-label="Tipo de gráfico" className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-0.5">
                        {([
                            { value: 'line' as const, icon: LineIcon, label: 'Línea' },
                            { value: 'bar' as const, icon: BarChart3, label: 'Barras' },
                            { value: 'area' as const, icon: Mountain, label: 'Área' },
                        ]).map(({ value, icon: Icon, label }) => (
                            <Button
                                key={value}
                                variant="ghost"
                                size="sm"
                                data-testid={`dashboard-chart-type-${value}`}
                                className={cn(
                                    'h-8 w-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-8 sm:w-9 p-0 rounded-md transition-all duration-200 active:scale-95',
                                    chartType === value ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-2 ring-primary/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                )}
                                onClick={() => handleChartTypeChange(value)}
                                title={label}
                                aria-label={`Tipo de gráfico: ${label}`}
                            >
                                <Icon className="h-4 w-4" />
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[260px] min-h-[200px] w-full min-w-0">
                        {evolucion.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                                {chartType === 'line' && (
                                    <LineChart {...commonChartProps}>
                                        {commonAxis}
                                        <Line type="monotone" dataKey="facturacion" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: 'hsl(var(--primary))', r: 4 }} activeDot={{ r: 6, strokeWidth: 2 }} />
                                    </LineChart>
                                )}
                                {chartType === 'bar' && (
                                    <BarChart {...commonChartProps}>
                                        {commonAxis}
                                        <Bar dataKey="facturacion" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                )}
                                {chartType === 'area' && (
                                    <AreaChart {...commonChartProps}>
                                        {commonAxis}
                                        <Area type="monotone" dataKey="facturacion" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                                    </AreaChart>
                                )}
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                                Sin datos de evolución en este período
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                        Facturas por estado
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Distribución en el período
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="h-[260px] min-h-[200px] w-full min-w-0">
                        {estados.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                                <PieChart>
                                    <Pie
                                        data={estados}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={3}
                                        dataKey="cantidad"
                                        nameKey="estado"
                                        label={({ estado, percent }) =>
                                            `${estadoLabels[estado] || estado} ${(percent * 100).toFixed(0)}%`
                                        }
                                    >
                                        {estados.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number, name: string) => [
                                            value,
                                            estadoLabels[name] || name,
                                        ]}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        formatter={(value) => estadoLabels[value] || value}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                                Sin facturas en este período
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
