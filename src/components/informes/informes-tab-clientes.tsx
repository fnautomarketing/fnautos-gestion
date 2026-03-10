'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    getTopClientesAction,
    getFacturacionPorCategoriaAction,
    type TopClienteData,
    type CategoriaData,
} from '@/app/actions/informes'
import { InformesRankingConceptos } from './informes-ranking-conceptos'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, PieChart, Pie, Cell, Legend } from 'recharts'
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

interface InformesTabClientesProps {
    fechaDesde?: string
    fechaHasta?: string
    empresaId?: string | null
    clienteId?: string | null
}

const COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export function InformesTabClientes({ fechaDesde, fechaHasta, empresaId, clienteId }: InformesTabClientesProps) {
    const [topClientes, setTopClientes] = useState<TopClienteData[]>([])
    const [categorias, setCategorias] = useState<CategoriaData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const [topRes, catRes] = await Promise.all([
                    getTopClientesAction(fechaDesde, fechaHasta, 10, empresaId, clienteId),
                    getFacturacionPorCategoriaAction(fechaDesde, fechaHasta, empresaId, clienteId),
                ])
                if (topRes.success && topRes.data) setTopClientes(Array.isArray(topRes.data) ? topRes.data : [])
                else if (!topRes.success) setError(topRes.error ?? 'Error al cargar top clientes')
                if (catRes.success && catRes.data) setCategorias(Array.isArray(catRes.data) ? catRes.data : [])
                else if (!catRes.success) setError((prev) => prev || (catRes.error ?? 'Error al cargar categorías'))
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
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{error}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                        Los datos se filtran por la empresa y el cliente seleccionados. Comprueba los filtros o contacta con soporte técnico si el problema persiste.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const emptyClientes = !topClientes?.length
    const emptyCategorias = !categorias?.length

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                            Top clientes por facturación
                            <SectionInfoButton
                                title="Top clientes por facturación"
                                description="Clientes ordenados por importe total facturado en el período. Ayuda a identificar los clientes que más ingresos generan y a priorizar la relación comercial."
                            />
                        </CardTitle>
                        <CardDescription>Clientes con mayor facturación en el período</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6 overflow-hidden">
                        <div className="h-[260px] min-[480px]:h-[300px] sm:h-[340px] min-w-0 w-full flex items-center justify-center">
                            {emptyClientes ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center px-4">
                                    No hay facturas de clientes en el período seleccionado. Prueba con otro rango de fechas o con &quot;Todas las empresas&quot;.
                                </p>
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                                        <BarChart data={topClientes} layout="vertical" margin={{ left: 4, right: 56, top: 8, bottom: 8 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,0.4)" />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="cliente_nombre"
                                                type="category"
                                                width={90}
                                                tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip formatter={(v: number) => [new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v), 'Facturado']} />
                                            <Bar dataKey="facturacion" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={20} name="Facturado">
                                                <LabelList position="right" formatter={(v: number) => new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 }).format(v) + '€'} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2 text-right">
                                        Total top 10: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(topClientes.reduce((a, c) => a + c.facturacion, 0))}
                                    </p>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-slate-200 dark:border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                            Ventas por categoría
                            <SectionInfoButton
                                title="Ventas por categoría"
                                description="Reparto de la facturación por categoría de producto o servicio. Muestra qué líneas de negocio o tipos de producto generan más ingresos en el período."
                            />
                        </CardTitle>
                        <CardDescription>Distribución de ingresos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[260px] min-[480px]:h-[300px] sm:h-[320px] min-w-0 flex items-center justify-center">
                            {emptyCategorias ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center px-4">
                                    No hay ventas por categoría en el período. Ajusta las fechas o los filtros.
                                </p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                                    <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                        <Pie
                                            data={categorias}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius="35%"
                                            outerRadius="55%"
                                            dataKey="facturacion"
                                            nameKey="categoria"
                                        >
                                            {categorias.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => [new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(v)), 'Ingresos']} />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={48}
                                            formatter={(value) => {
                                                const item = categorias.find((c) => c.categoria === value)
                                                const val = item?.facturacion ?? 0
                                                const total = categorias.reduce((a, c) => a + (c.facturacion ?? 0), 0)
                                                const pct = total > 0 ? ((val / total) * 100).toFixed(0) : ''
                                                const fmt = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 }).format(val) + '€'
                                                return `${value}: ${fmt}${pct ? ` (${pct}%)` : ''}`
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <InformesRankingConceptos
                fechaDesde={fechaDesde}
                fechaHasta={fechaHasta}
                empresaId={empresaId}
                limite={10}
            />
        </div>
    )
}
