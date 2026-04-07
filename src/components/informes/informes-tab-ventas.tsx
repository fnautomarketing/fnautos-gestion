'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    getEvolucionFacturacionAction,
    getEstadoFacturasAction,
    type EvolucionData,
    type EstadoData,
} from '@/app/actions/informes'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
    PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Info } from 'lucide-react'

function SectionInfoButton({ title, description }: { title: string; description: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full h-5 w-5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition-colors ml-1 shrink-0"
                    aria-label={`Información sobre ${title}`}
                >
                    <Info className="h-3 w-3" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4 max-w-[90vw]" align="start">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
            </PopoverContent>
        </Popover>
    )
}

interface InformesTabVentasProps {
    fechaDesde?: string
    fechaHasta?: string
    empresaId?: string | null
    clienteId?: string | null
}

const COLORS = [
    'hsl(var(--primary))',    // Color principal dinámico
    'hsl(var(--secondary))',  // Color secundario
    '#475569',                // Neutro Slate
    '#94a3b8',                // Neutro suave
    'hsla(var(--primary), 0.7)', // Variante traslúcida
    'hsla(var(--secondary), 0.7)'
]

export function InformesTabVentas({ fechaDesde, fechaHasta, empresaId, clienteId }: InformesTabVentasProps) {
    const [evolucion, setEvolucion] = useState<EvolucionData[]>([])
    const [estados, setEstados] = useState<EstadoData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const [evRes, estRes] = await Promise.all([
                    getEvolucionFacturacionAction(fechaDesde, fechaHasta, empresaId, clienteId),
                    getEstadoFacturasAction(fechaDesde, fechaHasta, empresaId, clienteId),
                ])
                if (evRes.success && evRes.data) setEvolucion(Array.isArray(evRes.data) ? evRes.data : [])
                else if (!evRes.success) setError(evRes.error ?? 'Error al cargar evolución')
                if (estRes.success && estRes.data) setEstados((Array.isArray(estRes.data) ? estRes.data : []).filter((e) => e.estado !== 'anulada'))
                else if (!estRes.success) setError((prev) => prev || (estRes.error ?? 'Error al cargar estado de facturas'))
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                setError(msg.includes('fetch') || msg.includes('Failed to fetch') ? 'Error de conexión. Comprueba tu conexión e intenta de nuevo.' : msg)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [fechaDesde, fechaHasta, empresaId, clienteId])

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="h-[320px] animate-pulse bg-slate-100 dark:bg-slate-800" />
                <Card className="h-[320px] animate-pulse bg-slate-100 dark:bg-slate-800" />
            </div>
        )
    }

    if (error) {
        return (
            <Card className="border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="py-8 px-4 text-center">
                    <p className="text-amber-800 dark:text-amber-200 font-medium mb-1">Error al cargar los datos</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                        Comprueba los filtros de empresa y cliente. Si el problema persiste, contacta con soporte técnico.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const emptyEvolucion = !evolucion?.length
    const emptyEstados = !estados?.length
    const estadoLabels: Record<string, string> = { pagada: 'Pagadas', emitida: 'Emitidas', borrador: 'Borradores', parcial: 'Parciales' }

    return (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 min-w-0">
            <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        Evolución de facturación
                        <SectionInfoButton
                            title="Evolución de facturación"
                            description="Comparativa de la facturación mes a mes (o por trimestre) en el rango seleccionado. Sirve para identificar tendencias, estacionalidad y meses con más o menos ingresos."
                        />
                    </CardTitle>
                    <CardDescription>Comparativa mensual de ingresos</CardDescription>
                </CardHeader>
                <CardContent className="pl-2 pr-2 sm:pr-6 overflow-hidden">
                    <div className="h-[260px] min-[480px]:h-[300px] sm:h-[340px] min-h-[200px] min-w-[200px] w-full flex items-center justify-center">
                        {emptyEvolucion ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center px-4">
                                No hay facturas en el período seleccionado. Prueba con otro rango de fechas (por ejemplo &quot;Últimos 12 meses&quot;) o revisa los filtros de empresa y cliente.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                                <LineChart data={evolucion} margin={{ top: 24, right: 12, left: 4, bottom: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.4)" />
                                    <XAxis dataKey="periodo" stroke="hsl(var(--foreground))" fontSize={11} tick={{ fill: 'hsl(var(--foreground))' }} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--foreground))" fontSize={11} tick={{ fill: 'hsl(var(--foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} width={44} />
                                    <Tooltip formatter={(value: string | number | undefined) => [new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(value || 0)), 'Facturación']} />
                                    <Line type="monotone" dataKey="facturacion" stroke="hsl(var(--primary))" strokeWidth={2.5} activeDot={{ r: 10 }}>
                                        <LabelList position="top" formatter={(v: string | number | boolean | null | undefined) => new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(v || 0)) + '€'} />
                                    </Line>
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </CardContent>
            </Card>
            <Card className="border border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        Estado de facturas
                        <SectionInfoButton
                            title="Estado de facturas"
                            description="Distribución del número de facturas según su estado: pagada, emitida, parcial, etc. Las facturas anuladas no se incluyen. Útil para ver cuánto está por cobrar."
                        />
                    </CardTitle>
                    <CardDescription>Distribución por estado</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 overflow-hidden">
                    <div className="h-[260px] min-[480px]:h-[300px] sm:h-[340px] min-h-[200px] min-w-[200px] w-full flex items-center justify-center">
                        {emptyEstados ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center px-4">
                                No hay facturas en el período seleccionado. Ajusta las fechas o los filtros.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                                <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                    <Pie
                                        data={estados}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius="40%"
                                        outerRadius="55%"
                                        paddingAngle={4}
                                        dataKey="cantidad"
                                        nameKey="estado"
                                    >
                                        {estados.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v: string | number | undefined) => [Number(v || 0), 'Facturas']} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={56}
                                        wrapperStyle={{ fontSize: 12 }}
                                        formatter={(value) => {
                                            const item = estados.find((e) => e.estado === value)
                                            const cant = item?.cantidad ?? 0
                                            const total = estados.reduce((a, e) => a + e.cantidad, 0)
                                            const pct = total > 0 ? ((cant / total) * 100).toFixed(0) : ''
                                            return `${estadoLabels[value] || value}: ${cant}${pct ? ` (${pct}%)` : ''}`
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
