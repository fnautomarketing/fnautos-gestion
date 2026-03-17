'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    getEvolucionFacturacionAction,
    getEstadoFacturasAction,
    getTopClientesAction,
    getFacturacionPorCategoriaAction,
    type EvolucionData,
    type EstadoData,
    type TopClienteData,
    type CategoriaData
} from '@/app/actions/informes'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area
} from 'recharts'
import { Loader2, TrendingUp, Users, PieChart as PieIcon, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InformesGraficosProps {
    fechaDesde?: string
    fechaHasta?: string
}

const COLORS = [
    'hsl(var(--primary))',
    '#0ea5e9', // Sky 500
    '#10b981', // Emerald 500
    '#f59e0b', // Amber 500
    '#6366f1', // Indigo 500
    '#ec4899', // Pink 500
]

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-white/10 p-4 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                <div className="space-y-1.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">{entry.name}</span>
                                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(entry.value)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    return null
}

export function InformesGraficos({ fechaDesde, fechaHasta }: InformesGraficosProps) {
    const [evolucion, setEvolucion] = useState<EvolucionData[]>([])
    const [estados, setEstados] = useState<EstadoData[]>([])
    const [topClientes, setTopClientes] = useState<TopClienteData[]>([])
    const [categorias, setCategorias] = useState<CategoriaData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            try {
                const [evolucionRes, estadosRes, topClientesRes, categoriasRes] = await Promise.all([
                    getEvolucionFacturacionAction(fechaDesde, fechaHasta),
                    getEstadoFacturasAction(fechaDesde, fechaHasta),
                    getTopClientesAction(fechaDesde, fechaHasta, 5),
                    getFacturacionPorCategoriaAction(fechaDesde, fechaHasta)
                ])

                if (evolucionRes.success && evolucionRes.data) setEvolucion(evolucionRes.data)
                if (estadosRes.success && estadosRes.data) setEstados(estadosRes.data.filter(e => e.estado !== 'anulada'))
                if (topClientesRes.success && topClientesRes.data) setTopClientes(topClientesRes.data)
                if (categoriasRes.success && categoriasRes.data) setCategorias(categoriasRes.data)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [fechaDesde, fechaHasta])

    const estadoLabels: Record<string, string> = {
        pagada: 'Pagadas',
        emitida: 'Emitidas',
        borrador: 'Borradores',
    }

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-7 lg:col-span-4 h-[400px] border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </Card>
                <Card className="col-span-7 lg:col-span-3 h-[400px] border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </Card>
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            {/* Evolución de Facturación */}
            <Card className="col-span-7 lg:col-span-4 border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden group">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Evolución de Facturación</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Volumen de ingresos en el tiempo</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={evolucion}>
                                <defs>
                                    <filter id="glowInforme" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="4" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                    <linearGradient id="areaGradientInforme" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} stroke="#64748b" />
                                <XAxis 
                                    dataKey="periodo" 
                                    stroke="#64748b" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    dy={10}
                                />
                                <YAxis 
                                    stroke="#64748b" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} 
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area 
                                    type="monotone" 
                                    dataKey="facturacion" 
                                    name="Facturación"
                                    stroke="hsl(var(--primary))" 
                                    strokeWidth={4} 
                                    fill="url(#areaGradientInforme)" 
                                    filter="url(#glowInforme)"
                                    animationDuration={2500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Estado de Facturas */}
            <Card className="col-span-7 lg:col-span-3 border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden group">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                            <PieIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Estado de Facturas</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Mix de cartera actual</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[320px]">
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
                                            key={`cell-${i}`} 
                                            fill={COLORS[i % COLORS.length]} 
                                            className="transition-all duration-300 hover:opacity-80 outline-none" 
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
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
                    </div>
                </CardContent>
            </Card>

            {/* Top Clientes */}
            <Card className="col-span-7 lg:col-span-4 border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden group">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Top Creación de Valor</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Clientes más relevantes por volumen</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topClientes} layout="vertical" margin={{ left: 20, right: 40 }}>
                                <defs>
                                    <linearGradient id="barGradientTop" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="cliente_nombre"
                                    type="category"
                                    width={120}
                                    fontSize={10}
                                    fontWeight={700}
                                    tick={{ fill: '#64748b' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar 
                                    dataKey="facturacion" 
                                    name="Facturado"
                                    fill="url(#barGradientTop)" 
                                    radius={[0, 12, 12, 0]} 
                                    barSize={20}
                                    animationDuration={2000}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Ventas por Categoría */}
            <Card className="col-span-7 lg:col-span-3 border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden group">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Ventas por Categoría</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Segmentación de cartera</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categorias}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={95}
                                    dataKey="facturacion"
                                    nameKey="categoria"
                                    animationDuration={1500}
                                    stroke="none"
                                >
                                    {categorias.map((_, i) => (
                                        <Cell 
                                            key={`cell-${i}`} 
                                            fill={COLORS[i % COLORS.length]} 
                                            className="transition-all duration-300 hover:opacity-80 outline-none shadow-lg" 
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value: string) => (
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                            {value}
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
