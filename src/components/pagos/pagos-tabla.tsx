'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { toggleConciliadoAction } from '@/app/actions/pagos'
import { toast } from 'sonner'

interface Pago {
    id: string
    factura_id: string
    serie: string
    numero: number
    cliente_nombre: string
    fecha_vencimiento: string
    factura_total: number
    pendiente: number
    metodo_pago: string | null
    factura_estado: string
    conciliado: boolean
    /** true = fila de factura pendiente (sin pago aún); no mostrar checkbox conciliado */
    esFacturaRow?: boolean
}

interface PagosTablaProps {
    pagos: Pago[]
    tab: string
    search?: string
    metodo?: string
}

export function PagosTabla({ pagos, tab, search = '', metodo = 'todos' }: PagosTablaProps) {
    const router = useRouter()
    const [searchValue, setSearchValue] = useState(search)

    const handleToggleConciliado = async (pagoId: string, conciliado: boolean) => {
        const result = await toggleConciliadoAction(pagoId, !conciliado)
        if (result.success) {
            toast.success(conciliado ? 'Pago desmarcado' : 'Pago conciliado')
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    const getEstadoBadge = (estado: string) => {
        if (estado === 'pagada') {
            return <Badge className="bg-green-100 text-green-700">✅ Pagado</Badge>
        }
        if (estado === 'parcial') {
            return <Badge className="bg-yellow-100 text-yellow-700">🟡 Parcial</Badge>
        }
        return <Badge className="bg-blue-100 text-blue-700">⏳ Pendiente</Badge>
    }

    const buildUrl = (nextTab: string, nextSearch: string, nextMetodo: string) => {
        const params = new URLSearchParams()
        if (nextTab && nextTab !== 'todos') params.set('tab', nextTab)
        if (nextSearch.trim()) params.set('search', nextSearch.trim())
        if (nextMetodo && nextMetodo !== 'todos') params.set('metodo', nextMetodo)
        const qs = params.toString()
        return `/ventas/pagos${qs ? `?${qs}` : ''}`
    }

    const handleTabChange = (value: string) => {
        router.push(buildUrl(value, searchValue, metodo))
    }

    const handleSearchChange = (value: string) => {
        setSearchValue(value)
        router.push(buildUrl(tab, value, metodo))
    }

    const handleMetodoChange = (value: string) => {
        router.push(buildUrl(tab, searchValue, value))
    }

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <Tabs value={tab} onValueChange={handleTabChange}>
                <TabsList>
                    <TabsTrigger value="todos">Todos los Pagos</TabsTrigger>
                    <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
                    <TabsTrigger value="cobrados">Cobrados</TabsTrigger>
                    <TabsTrigger value="vencidos">Vencidos</TabsTrigger>
                    <TabsTrigger value="parciales">Parciales</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Filtros */}
            <div className="flex flex-wrap gap-4 items-center">
                <Input
                    placeholder="Buscar factura, cliente o referencia..."
                    className="max-w-md"
                    value={searchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                />
                <select
                    className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                    value={metodo}
                    onChange={(e) => handleMetodoChange(e.target.value)}
                >
                    <option value="todos">Todos los métodos</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="domiciliacion">Domiciliación</option>
                    <option value="cheque">Cheque</option>
                    <option value="otro">Otro</option>
                </select>
            </div>

            {/* Tabla */}
            <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>
                            <th className="p-4 text-left text-xs font-semibold uppercase">Factura</th>
                            <th className="p-4 text-left text-xs font-semibold uppercase">Cliente</th>
                            <th className="p-4 text-left text-xs font-semibold uppercase">Vencimiento</th>
                            <th className="p-4 text-right text-xs font-semibold uppercase">Total</th>
                            <th className="p-4 text-right text-xs font-semibold uppercase">Pagado</th>
                            <th className="p-4 text-right text-xs font-semibold uppercase">Pendiente</th>
                            <th className="p-4 text-center text-xs font-semibold uppercase">Método</th>
                            <th className="p-4 text-center text-xs font-semibold uppercase">Estado</th>
                            <th className="p-4 text-center text-xs font-semibold uppercase">Conciliado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {pagos.map((pago) => (
                            <tr key={pago.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-mono font-semibold">
                                    <Link href={`/ventas/facturas/${pago.factura_id}`} className="hover:text-primary">
                                        {pago.serie}-{pago.numero}
                                    </Link>
                                </td>
                                <td className="p-4">{pago.cliente_nombre}</td>
                                <td className="p-4 text-sm">{new Date(pago.fecha_vencimiento).toLocaleDateString('es-ES')}</td>
                                <td className="p-4 text-right font-bold">{pago.factura_total.toFixed(2)}€</td>
                                <td className="p-4 text-right text-green-600 font-semibold">{(pago.factura_total - pago.pendiente).toFixed(2)}€</td>
                                <td className="p-4 text-right text-red-600 font-semibold">{pago.pendiente.toFixed(2)}€</td>
                                <td className="p-4 text-center text-sm">{pago.metodo_pago || '-'}</td>
                                <td className="p-4 text-center">{getEstadoBadge(pago.factura_estado)}</td>
                                <td className="p-4 text-center">
                                    {pago.esFacturaRow ? (
                                        <span className="text-slate-400 text-sm">—</span>
                                    ) : (
                                        <Checkbox
                                            checked={pago.conciliado}
                                            onCheckedChange={() => handleToggleConciliado(pago.id, pago.conciliado)}
                                        />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-sm text-slate-500">Mostrando {pagos.length} pagos</p>
        </div>
    )
}
