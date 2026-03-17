'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { RegistrarPagoForm } from '@/components/ventas/pagos/registrar-pago-form'
import { ResumenFacturaPago } from '@/components/ventas/pagos/resumen-factura-pago'
import { HistorialPagosCard } from '@/components/ventas/pagos/historial-pagos-card'

interface PageProps {
    params: Promise<{ id: string }>
}

import { Factura, Pago } from '@/types/ventas'

interface FacturaWithCliente extends Factura {
    cliente: {
        nombre_fiscal: string
    }
}

export default function RegistrarPagoPage({ params }: PageProps) {
    const { id } = use(params)
    const router = useRouter()
    const [factura, setFactura] = useState<FacturaWithCliente | null>(null)
    const [pagos, setPagos] = useState<Pago[]>([])
    const [loading, setLoading] = useState(true)

    // State for realtime preview
    const [currentImporteInput, setCurrentImporteInput] = useState(0)

    const supabase = createClient()

    useEffect(() => {
        async function loadData() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: perfil } = await supabase
                    .from('perfiles')
                    .select('empresa_id, rol')
                    .eq('user_id', user.id)
                    .single()

                const { data: ue } = await supabase
                    .from('usuarios_empresas')
                    .select('empresa_activa, empresa_id')
                    .eq('user_id', user.id)

                const isAdmin = perfil?.rol === 'admin'
                const empresaActiva = ue?.find((x: any) => x.empresa_activa)
                const empresaId = empresaActiva?.empresa_id || perfil?.empresa_id
                const isGlobal = isAdmin && !empresaActiva

                let query = supabase
                    .from('facturas')
                    .select(`*, cliente:clientes(nombre_fiscal)`)
                    .eq('id', id)
                if (!isGlobal && empresaId) query = query.eq('empresa_id', empresaId)
                const { data: fac } = await query.single()

                if (fac) {
                    setFactura(fac)

                    // Set input default if not set
                    if (!fac.pagado) {
                        setCurrentImporteInput(prev => prev === 0 ? fac.total : prev)
                    }

                    // Fetch Payments History
                    const { data: p } = await supabase
                        .from('pagos')
                        .select('*')
                        .eq('factura_id', id)
                        .eq('anulado', false)
                        .order('fecha_pago', { ascending: false })

                    setPagos(p || [])
                }

            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [id, supabase])

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        )
    }

    if (!factura) return <div>Factura no encontrada</div>

    // Redirigir si la factura ya está pagada
    if (factura.estado === 'pagada') {
        router.replace(`/ventas/facturas/${id}`)
        return null
    }

    // Calculate generic accumulated payment (if not using 'pagado' column yet, calculate manually)
    const totalPagado = pagos.reduce((acc, p) => acc + (Number(p.importe) || 0), 0)
    const pendiente = Math.max(0, factura.total - totalPagado)

    return (
        <div className="space-y-6">
            {/* Breadcrumbs & Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-in slide-in-from-top-4 duration-500">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Link href="/ventas/facturas" className="hover:text-slate-900 transition-colors">Facturas</Link>
                        <span>›</span>
                        <Link href={`/ventas/facturas/${id}`} className="hover:text-slate-900 transition-colors">
                            {factura.serie}-{factura.numero}
                        </Link>
                        <span>›</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">Registrar Pago</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Registrar Pago
                    </h1>
                    <p className="text-slate-500">
                        {factura.serie}-{factura.numero} · {factura.cliente.nombre_fiscal}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link href={`/ventas/facturas/${id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Cancelar
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Form */}
                <div className="lg:col-span-7 space-y-6">
                    <RegistrarPagoForm
                        facturaId={factura.id}
                        empresaId={factura.empresa_id}
                        pendienteActual={pendiente}
                        onImporteChange={setCurrentImporteInput}
                    />
                </div>

                {/* Right Column: Summary & History */}
                <div className="lg:col-span-5 space-y-6">
                    <ResumenFacturaPago
                        factura={factura}
                        pagadoHastaHoy={totalPagado}
                        importePagoActual={currentImporteInput}
                    />
                    <HistorialPagosCard pagos={pagos} />
                </div>
            </div>
        </div>
    )
}
