'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getRankingConceptosAction, type RankingConceptoData } from '@/app/actions/informes'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
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

interface InformesRankingConceptosProps {
    fechaDesde?: string
    fechaHasta?: string
    empresaId?: string | null
    limite?: number
}

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)

export function InformesRankingConceptos({ fechaDesde, fechaHasta, empresaId, limite = 10 }: InformesRankingConceptosProps) {
    const [data, setData] = useState<RankingConceptoData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await getRankingConceptosAction(fechaDesde, fechaHasta, limite, empresaId ?? undefined)
                if (res.success && res.data) setData(res.data)
                else if (!res.success) setError(res.error ?? 'Error al cargar ranking')
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                setError(msg.includes('fetch') || msg.includes('Failed to fetch') ? 'Error de conexión. Comprueba tu conexión e intenta de nuevo.' : msg)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [fechaDesde, fechaHasta, empresaId, limite])

    if (error) {
        return (
            <Card className="border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="py-6 px-4 text-center">
                    <p className="text-amber-800 dark:text-amber-200 font-medium">{error}</p>
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <Card className="border border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        Ranking de conceptos
                        <SectionInfoButton
                            title="Ranking de conceptos"
                            description="Listado de conceptos o líneas de factura ordenados por ingresos en el período. Muestra qué productos o servicios facturados generan más ventas. Incluye categoría y porcentaje sobre el total."
                        />
                    </CardTitle>
                    <CardDescription>Conceptos con más ingresos en el período</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg" />
                </CardContent>
            </Card>
        )
    }

    if (!data.length) {
        return (
            <Card className="border border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        Ranking de conceptos
                        <SectionInfoButton
                            title="Ranking de conceptos"
                            description="Listado de conceptos o líneas de factura ordenados por ingresos en el período. Muestra qué productos o servicios facturados generan más ventas. Incluye categoría y porcentaje sobre el total."
                        />
                    </CardTitle>
                    <CardDescription>Conceptos con más ingresos en el período</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sin datos de conceptos en el período seleccionado.</p>
                </CardContent>
            </Card>
        )
    }

    const chartData = data.slice(0, 8).map((d, i) => ({
        name: d.concepto_nombre.length > 20 ? d.concepto_nombre.slice(0, 20) + '…' : d.concepto_nombre,
        ingresos: d.ingresos,
        fullName: d.concepto_nombre,
    }))

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border border-slate-200 dark:border-slate-700 overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        Ranking de conceptos
                        <SectionInfoButton
                            title="Ranking de conceptos"
                            description="Listado de conceptos o líneas de factura ordenados por ingresos en el período. Muestra qué productos o servicios facturados generan más ventas. Incluye categoría y porcentaje sobre el total."
                        />
                    </CardTitle>
                    <CardDescription>Top {limite} conceptos por ingresos</CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10 font-semibold">#</TableHead>
                                    <TableHead className="font-semibold min-w-0">Concepto</TableHead>
                                    <TableHead className="font-semibold hidden md:table-cell">Categoría</TableHead>
                                    <TableHead className="text-right font-semibold">Ingresos</TableHead>
                                    <TableHead className="text-right font-semibold">%</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((row, i) => (
                                    <TableRow key={row.concepto_id ?? `row-${i}`}>
                                        <TableCell className="font-medium text-slate-500">{i + 1}</TableCell>
                                        <TableCell className="truncate max-w-[180px]" title={row.concepto_nombre}>{row.concepto_nombre}</TableCell>
                                        <TableCell className="hidden md:table-cell text-slate-500">{row.categoria || '—'}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(row.ingresos)}</TableCell>
                                        <TableCell className="text-right text-slate-500">{row.porcentaje.toFixed(1)}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <Card className="border border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-base flex items-center">
                        Top 8 por ingresos
                        <SectionInfoButton
                            title="Top 8 por ingresos"
                            description="Gráfico de barras con los 8 conceptos que más ingresos han generado. Sirve para una comparativa visual rápida sin revisar la tabla completa."
                        />
                    </CardTitle>
                    <CardDescription>Comparativa visual</CardDescription>
                </CardHeader>
                <CardContent className="overflow-hidden">
                    <div className="h-[280px] min-w-0 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                            <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 70, top: 8, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" fontSize={10} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="name" width={90} fontSize={10} tick={{ fontSize: 10 }} />
                                <Tooltip formatter={(v: unknown) => [formatCurrency(v as number), 'Ingresos']} />
                                <Bar dataKey="ingresos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                                    <LabelList position="right" formatter={(v: unknown) => formatCurrency(v as number)} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
