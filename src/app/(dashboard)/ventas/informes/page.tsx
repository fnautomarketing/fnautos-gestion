'use client'

import { useState, useCallback, useEffect } from 'react'
import { startOfMonth, endOfMonth, format, subMonths, startOfQuarter, endOfQuarter, subYears } from 'date-fns'
import { es } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'
import { DatePickerWithRange } from '@/components/date-range-picker'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Download, BarChart3, TrendingUp, Users, Receipt, Info } from 'lucide-react'
import { exportarInformeExcelAction } from '@/app/actions/informes'
import { listarEmpresasUsuarioAction } from '@/app/actions/usuarios-empresas'
import { clientConfig } from '@/config/clients'
import { toast } from 'sonner'
import { InformesTabResumen } from '@/components/informes/informes-tab-resumen'
import { InformesTabVentas } from '@/components/informes/informes-tab-ventas'
import { InformesTabClientes } from '@/components/informes/informes-tab-clientes'
import { InformesDesgloseIVA } from '@/components/informes/informes-desglose-iva'
import { InformesKPIs } from '@/components/informes/informes-kpis'
import { InformesFiltroCliente } from '@/components/informes/informes-filtro-cliente'

const PRESETS = [
    { label: 'Este mes', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
    { label: 'Mes anterior', getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
    { label: 'Este trimestre', getValue: () => ({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }) },
    { label: 'Últimos 12 meses', getValue: () => ({ from: subYears(new Date(), 1), to: new Date() }) },
]

function PageInfoButton() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full h-6 w-6 sm:h-7 sm:w-7 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition-colors ml-1.5 shrink-0"
                    aria-label="Información sobre Informes y analítica"
                >
                    <Info className="h-3.5 w-4 sm:h-4 sm:w-4" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 max-w-[90vw]" align="start">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Informes y analítica</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Consulta cuánto se ha facturado por período y por cliente. La empresa se selecciona en el header (arriba). Filtra por fechas y por cliente para ver KPIs, evolución, top clientes, ventas por categoría y desglose IVA. Exporta el informe en Excel con el botón &quot;Exportar Excel&quot;.
                </p>
            </PopoverContent>
        </Popover>
    )
}

export default function InformesPage() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    })
    const [exporting, setExporting] = useState(false)
    const [activeTab, setActiveTab] = useState('resumen')
    const [empresaId, setEmpresaId] = useState<string | null>(null)
    const [empresaNombre, setEmpresaNombre] = useState<string>('')
    const [clienteFilter, setClienteFilter] = useState<{ id: string; label: string } | null>(null)

    // Empresa viene del header (selector global). No duplicamos selector aquí.
    useEffect(() => {
        listarEmpresasUsuarioAction()
            .then((res) => {
                if (res.success && res.data) {
                    const activaId = res.data.empresaActivaId ?? null
                    setEmpresaId(activaId)
                    if (activaId && res.data.empresas) {
                        const emp = res.data.empresas.find((e: { id: string; razon_social?: string; nombre_comercial?: string }) => e.id === activaId)
                        setEmpresaNombre(emp?.nombre_comercial || emp?.razon_social || '')
                    } else if (res.data.isGlobal) {
                        setEmpresaNombre('Todas las empresas')
                    }
                }
            })
            .catch(() => {
                toast.error('Error de conexión al cargar contexto')
            })
    }, [])

    const handleExport = useCallback(async () => {
        if (!date?.from || !date?.to) {
            toast.error('Selecciona un rango de fechas')
            return
        }
        try {
            setExporting(true)
            const from = format(date.from, 'yyyy-MM-dd')
            const to = format(date.to, 'yyyy-MM-dd')
            const result = await exportarInformeExcelAction(
                from,
                to,
                empresaId,
                clienteFilter?.id ?? null,
                empresaNombre || null,
                clienteFilter?.label ?? null
            )
            if (result.success && result.data) {
                const link = document.createElement('a')
                link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data}`
                link.download = `informe_ventas_${from}_${to}.xlsx`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                toast.success('Informe descargado correctamente')
            } else {
                toast.error('Error al generar el informe: ' + (result.error ?? ''))
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error)
            toast.error(msg.includes('fetch') || msg.includes('Failed to fetch') ? 'Error de conexión. Comprueba tu conexión e intenta de nuevo.' : 'Error al exportar')
            console.error(error)
        } finally {
            setExporting(false)
        }
    }, [date?.from, date?.to, empresaId, empresaNombre, clienteFilter])

    const formattedDateFrom = date?.from ? format(date.from, 'yyyy-MM-dd') : undefined
    const formattedDateTo = date?.to ? format(date.to, 'yyyy-MM-dd') : undefined

    return (
        <div className="w-full space-y-6 pb-8 px-2 sm:px-4 min-w-0 overflow-x-hidden">
            {/* Cabecera y filtros */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center flex-wrap gap-1">
                            Informes y analítica
                            <PageInfoButton />
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
                            Analítica de ventas, clientes y fiscal. {clientConfig.nombreCorto} ERP.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <div className="flex flex-wrap gap-2">
                            {PRESETS.map((p) => (
                                <Button
                                    key={p.label}
                                    variant="outline"
                                    size="sm"
                                    className="min-h-[40px] sm:min-h-[36px] text-xs sm:text-sm"
                                    onClick={() => setDate(p.getValue())}
                                >
                                    {p.label}
                                </Button>
                            ))}
                        </div>
                        <DatePickerWithRange date={date} setDate={setDate} className="w-full min-w-0 sm:w-auto" />
                        <Button
                            onClick={handleExport}
                            disabled={exporting}
                            className="w-full sm:w-auto min-h-[44px]"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            {exporting ? 'Exportando…' : 'Exportar Excel'}
                        </Button>
                    </div>
                </div>

                {/* Resumen de filtros activos */}
                {(date?.from || date?.to) && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400 px-1" data-testid="informes-filter-summary">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Mostrando:</span>
                        <span>
                            {date.from && date.to
                                ? `${format(date.from, 'd MMM yyyy', { locale: es })} – ${format(date.to, 'd MMM yyyy', { locale: es })}`
                                : date.from
                                  ? format(date.from, 'd MMM yyyy', { locale: es })
                                  : ''}
                        </span>
                        <span>·</span>
                        <span>{empresaNombre || 'Todas las empresas'}</span>
                        <span>·</span>
                        <span>{clienteFilter?.label ?? 'Todos los clientes'}</span>
                    </div>
                )}

                {/* Filtro Cliente (empresa viene del header) */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1 sm:max-w-[280px]">
                        <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            Cliente
                        </Label>
                        <InformesFiltroCliente
                            value={clienteFilter?.id ?? null}
                            label={clienteFilter?.label ?? ''}
                            onChange={(id, lbl) =>
                                setClienteFilter(id ? { id, label: lbl } : null)
                            }
                            empresaId={empresaId}
                            placeholder="Todos los clientes"
                            className="w-full min-h-[44px] sm:min-h-[40px]"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full flex flex-wrap h-auto gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                    <TabsTrigger value="resumen" className="flex-1 min-w-[100px] min-h-[44px] sm:min-h-[40px] py-2.5 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-lg gap-2 text-sm font-medium">
                        <TrendingUp className="h-4 w-4 shrink-0" />
                        Resumen
                    </TabsTrigger>
                    <TabsTrigger value="ventas" className="flex-1 min-w-[100px] min-h-[44px] sm:min-h-[40px] py-2.5 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-lg gap-2 text-sm font-medium">
                        <BarChart3 className="h-4 w-4 shrink-0" />
                        Ventas
                    </TabsTrigger>
                    <TabsTrigger value="clientes" className="flex-1 min-w-[100px] min-h-[44px] sm:min-h-[40px] py-2.5 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-lg gap-2 text-sm font-medium">
                        <Users className="h-4 w-4 shrink-0" />
                        Clientes
                    </TabsTrigger>
                    <TabsTrigger value="fiscal" className="flex-1 min-w-[100px] min-h-[44px] sm:min-h-[40px] py-2.5 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-lg gap-2 text-sm font-medium">
                        <Receipt className="h-4 w-4 shrink-0" />
                        Desglose IVA
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="resumen" className="mt-6">
                    <InformesTabResumen
                        fechaDesde={formattedDateFrom}
                        fechaHasta={formattedDateTo}
                        empresaId={empresaId}
                        clienteId={clienteFilter?.id ?? null}
                    />
                </TabsContent>
                <TabsContent value="ventas" className="mt-6 space-y-6">
                    <InformesKPIs fechaDesde={formattedDateFrom} fechaHasta={formattedDateTo} empresaId={empresaId} clienteId={clienteFilter?.id ?? null} />
                    <InformesTabVentas
                        fechaDesde={formattedDateFrom}
                        fechaHasta={formattedDateTo}
                        empresaId={empresaId}
                        clienteId={clienteFilter?.id ?? null}
                    />
                </TabsContent>
                <TabsContent value="clientes" className="mt-6 space-y-6">
                    <InformesKPIs fechaDesde={formattedDateFrom} fechaHasta={formattedDateTo} empresaId={empresaId} clienteId={clienteFilter?.id ?? null} />
                    <InformesTabClientes
                        fechaDesde={formattedDateFrom}
                        fechaHasta={formattedDateTo}
                        empresaId={empresaId}
                        clienteId={clienteFilter?.id ?? null}
                    />
                </TabsContent>
                <TabsContent value="fiscal" className="mt-6 space-y-6">
                    <InformesKPIs fechaDesde={formattedDateFrom} fechaHasta={formattedDateTo} empresaId={empresaId} clienteId={clienteFilter?.id ?? null} />
                    <InformesDesgloseIVA
                        fechaDesde={formattedDateFrom}
                        fechaHasta={formattedDateTo}
                        empresaId={empresaId}
                        clienteId={clienteFilter?.id ?? null}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
