'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    getEvolucionFacturacionAction,
    getEstadoFacturasAction,
    getTopClientesAction,
    getFacturacionPorCategoriaAction,
    EvolucionData,
    EstadoData,
    TopClienteData,
    CategoriaData
} from '@/app/actions/informes'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'

interface InformesGraficosProps {
    fechaDesde?: string
    fechaHasta?: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export function InformesGraficos({ fechaDesde, fechaHasta }: InformesGraficosProps) {
    const [evolucion, setEvolucion] = useState<EvolucionData[]>([])
    const [estados, setEstados] = useState<EstadoData[]>([])
    const [topClientes, setTopClientes] = useState<TopClienteData[]>([])
    const [categorias, setCategorias] = useState<CategoriaData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            const [evolucionRes, estadosRes, topClientesRes, categoriasRes] = await Promise.all([
                getEvolucionFacturacionAction(fechaDesde, fechaHasta),
                getEstadoFacturasAction(fechaDesde, fechaHasta),
                getTopClientesAction(fechaDesde, fechaHasta, 5),
                getFacturacionPorCategoriaAction(fechaDesde, fechaHasta)
            ])

            if (evolucionRes.success && evolucionRes.data) setEvolucion(evolucionRes.data)
            if (estadosRes.success && estadosRes.data) setEstados(estadosRes.data)
            if (topClientesRes.success && topClientesRes.data) setTopClientes(topClientesRes.data)
            if (categoriasRes.success && categoriasRes.data) setCategorias(categoriasRes.data)
            setLoading(false)
        }
        loadData()
    }, [fechaDesde, fechaHasta])

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-2 h-[300px] animate-pulse bg-slate-100" />
                <Card className="h-[300px] animate-pulse bg-slate-100" />
                <Card className="h-[300px] animate-pulse bg-slate-100" />
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Evolución Temporal - Line Chart */}
            <Card className="col-span-7 lg:col-span-4">
                <CardHeader>
                    <CardTitle>Evolución de Facturación</CardTitle>
                    <CardDescription>Comparativa mensual de ingresos</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                            <LineChart data={evolucion}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="periodo"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}€`}
                                />
                                <Tooltip
                                    formatter={(value: any) => [`${Number(value).toFixed(2)}€`, 'Facturación']}
                                    labelStyle={{ color: 'black' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="facturacion"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Estado Facturas - Pie/Donut Chart */}
            <Card className="col-span-7 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Estado de Facturas</CardTitle>
                    <CardDescription>Distribución por estado actual</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                            <PieChart>
                                <Pie
                                    data={estados}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="cantidad"
                                    nameKey="estado"
                                >
                                    {estados.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Top Clientes - Bar Chart */}
            <Card className="col-span-7 lg:col-span-4">
                <CardHeader>
                    <CardTitle>Top Creación de Valor</CardTitle>
                    <CardDescription>Clientes con mayor facturación</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                            <BarChart data={topClientes} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="cliente_nombre"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip formatter={(value: any) => [`${Number(value).toFixed(2)}€`, 'Facturado']} />
                                <Bar dataKey="facturacion" fill="#adfa1d" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Categorías - Simple List or Pie */}
            <Card className="col-span-7 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Ventas por Categoría</CardTitle>
                    <CardDescription>Distribución de ingresos por tipo</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                            <PieChart>
                                <Pie
                                    data={categorias}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="facturacion"
                                    nameKey="categoria"
                                    label={({ categoria, percent }: any) => `${categoria} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {categorias.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => [`${Number(value).toFixed(2)}€`, 'Ingresos']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
