'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getDesgloseIVAAction, type DesgloseIVAData } from '@/app/actions/informes'
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

interface InformesDesgloseIVAProps {
    fechaDesde?: string
    fechaHasta?: string
    empresaId?: string | null
    clienteId?: string | null
}

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)

export function InformesDesgloseIVA({ fechaDesde, fechaHasta, empresaId, clienteId }: InformesDesgloseIVAProps) {
    const [data, setData] = useState<DesgloseIVAData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await getDesgloseIVAAction(fechaDesde, fechaHasta, empresaId, clienteId)
                if (res.success && res.data) setData(Array.isArray(res.data) ? res.data : [])
                else if (!res.success) setError(res.error ?? 'Error al cargar desglose IVA')
                else setData([])
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
            <Card className="border border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        Desglose por IVA
                        <SectionInfoButton
                            title="Desglose por IVA"
                            description="Desglose fiscal de la facturación por tipo de IVA (21%, 10%, 4%, 0%, etc.): base imponible, cuota de IVA y total. Útil para declaraciones y contabilidad. El % del total indica el peso de cada tipo en la facturación."
                        />
                    </CardTitle>
                    <CardDescription>Base, cuota y total por tipo impositivo</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg" />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="py-8 px-4 text-center">
                    <p className="text-amber-800 dark:text-amber-200 font-medium mb-1">Error al cargar el desglose IVA</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                        Comprueba el rango de fechas y los filtros de empresa y cliente. Si el problema persiste, contacta con soporte técnico.
                    </p>
                </CardContent>
            </Card>
        )
    }

    if (!data.length) {
        return (
            <Card className="border border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        Desglose por IVA
                        <SectionInfoButton
                            title="Desglose por IVA"
                            description="Desglose fiscal de la facturación por tipo de IVA (21%, 10%, 4%, 0%, etc.): base imponible, cuota de IVA y total. Útil para declaraciones y contabilidad. El % del total indica el peso de cada tipo en la facturación."
                        />
                    </CardTitle>
                    <CardDescription>Base, cuota y total por tipo impositivo</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
                        No hay facturas con desglose de IVA en el período seleccionado. Prueba con otro rango (por ejemplo &quot;Últimos 12 meses&quot;) o con &quot;Todas las empresas&quot;.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const chartData = data.map((d) => ({
        name: `${d.tipo_iva}%`,
        total: d.total,
        base: d.base_imponible,
        cuota: d.cuota_iva,
    }))

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-700 overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        Desglose por IVA
                        <SectionInfoButton
                            title="Desglose por IVA"
                            description="Desglose fiscal de la facturación por tipo de IVA (21%, 10%, 4%, 0%, etc.): base imponible, cuota de IVA y total. Útil para declaraciones y contabilidad. El % del total indica el peso de cada tipo en la facturación."
                        />
                    </CardTitle>
                    <CardDescription>Base imponible, cuota y total por tipo impositivo</CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    <div className="overflow-x-auto -mx-2 sm:mx-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <Table className="min-w-[480px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-semibold">Tipo IVA</TableHead>
                                    <TableHead className="text-right font-semibold">Base</TableHead>
                                    <TableHead className="text-right font-semibold">Cuota</TableHead>
                                    <TableHead className="text-right font-semibold">Total</TableHead>
                                    <TableHead className="text-right font-semibold">% total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{row.tipo_iva}%</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.base_imponible)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.cuota_iva)}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(row.total)}</TableCell>
                                        <TableCell className="text-right text-slate-500">{row.porcentaje_del_total.toFixed(1)}%</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-slate-50 dark:bg-slate-800/50 font-semibold border-t-2">
                                    <TableCell>Total</TableCell>
                                    <TableCell className="text-right">{formatCurrency(data.reduce((a, r) => a + r.base_imponible, 0))}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(data.reduce((a, r) => a + r.cuota_iva, 0))}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(data.reduce((a, r) => a + r.total, 0))}</TableCell>
                                    <TableCell className="text-right">100%</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <Card className="border border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-base flex items-center">
                        Total por tipo
                        <SectionInfoButton
                            title="Total por tipo"
                            description="Gráfico de barras con el total facturado por cada tipo de IVA. Permite comparar de un vistazo qué tipos impositivos concentran más ingresos en el período."
                        />
                    </CardTitle>
                    <CardDescription>Comparativa de totales</CardDescription>
                </CardHeader>
                <CardContent className="overflow-hidden">
                    <div className="h-[220px] min-[480px]:h-[260px] sm:h-[280px] min-w-0 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                            <BarChart data={chartData} margin={{ top: 12, right: 12, left: 8, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.4)" />
                                <XAxis dataKey="name" fontSize={12} tick={{ fill: 'hsl(var(--foreground))' }} tickLine={false} axisLine={false} />
                                <YAxis fontSize={11} tick={{ fill: 'hsl(var(--foreground))' }} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
                                <Tooltip formatter={(v: unknown) => [formatCurrency(v as number), 'Total']} />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={28}>
                                    <LabelList position="top" formatter={(v: unknown) => formatCurrency(v as number)} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
