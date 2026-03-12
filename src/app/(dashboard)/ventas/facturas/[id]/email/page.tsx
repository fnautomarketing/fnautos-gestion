'use client'

import { useState, use, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmailSendForm } from '@/components/ventas/email/email-send-form'
import { EmailSummaryCard } from '@/components/ventas/email/email-summary-card'
import { EmailActivityCard } from '@/components/ventas/email/email-activity-card'
import { EmailTemplatesPanel } from '@/components/ventas/email/email-templates-panel'
import { listarEmpresasUsuarioAction } from '@/app/actions/usuarios-empresas'
import { clientConfig } from '@/config/clients'

interface PageProps {
    params: Promise<{ id: string }>
}

import { Factura, Cliente, LineaFactura } from '@/types/ventas'
import { Tables } from '@/types/supabase'

type EmailFactura = Tables<'emails_factura'>

interface FacturaWithDetails extends Factura {
    cliente: Cliente
    lineas: LineaFactura[]
    empresa?: { razon_social: string | null; nombre_comercial: string | null } | null
}

export default function FacturaEmailPage({ params }: PageProps) {
    const { id } = use(params)
    const [factura, setFactura] = useState<FacturaWithDetails | null>(null)
    const [history, setHistory] = useState<EmailFactura[]>([])
    const [loading, setLoading] = useState(true)

    // Template State
    const [template, setTemplate] = useState('estandar')
    const [includeLogo, setIncludeLogo] = useState(true)
    const [message, setMessage] = useState('')

    const supabase = createClient()

    // Generate welcome message based on template
    useEffect(() => {
        if (!factura) return

        const getTemplateMessage = () => {
            const clienteName = factura.cliente.nombre_fiscal || 'Cliente'
            const invoiceRef = `${factura.serie}-${factura.numero}`
            const total = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(factura.total)

            switch (template) {
                case 'informal':
                    return `Hola ${clienteName},\n\nTe adjunto la factura ${invoiceRef} por valor de ${total}.\n\nCualquier cosa me dices.\n\nSaludos,\n${clientConfig.nombre}`
                case 'recordatorio':
                    return `Estimado cliente,\n\nLe recordamos que la factura ${invoiceRef} con importe ${total} está pendiente de pago.\n\nAgradeceríamos que realizara el abono lo antes posible.\n\nAtentamente,\nDepartamento de Facturación`
                case 'estandar':
                default:
                    return `Estimados ${clienteName},\n\nAdjuntamos la factura ${invoiceRef} correspondiente a los servicios prestados, por un importe total de ${total}.\n\nQuedamos a su disposición para cualquier consulta.\n\nAtentamente,\n${clientConfig.nombre}`
            }
        }
        setMessage(getTemplateMessage())
    }, [template, factura])


    useEffect(() => {
        async function loadData() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const [empresasResult, { data: perfil }] = await Promise.all([
                    listarEmpresasUsuarioAction(),
                    supabase.from('perfiles').select('empresa_id').eq('user_id', user.id).single()
                ])

                const isGlobal = empresasResult.success && empresasResult.data?.isGlobal
                const activaId = empresasResult.success ? empresasResult.data?.empresaActivaId ?? null : null
                const empresaFiltro = isGlobal ? undefined : (activaId || perfil?.empresa_id)
                if (!empresaFiltro && !isGlobal) return

                let query = supabase
                    .from('facturas')
                    .select(`
                *,
                cliente:clientes(*),
                lineas:lineas_factura(*),
                empresa:empresas(razon_social, nombre_comercial)
            `)
                    .eq('id', id)
                if (empresaFiltro) query = query.eq('empresa_id', empresaFiltro)
                const { data: fac } = await query.single()

                if (fac) {
                    setFactura(fac)

                    // Fetch Email History
                    const { data: emails } = await supabase
                        .from('emails_factura')
                        .select('*')
                        .eq('factura_id', id)
                        .order('created_at', { ascending: false })
                        .limit(5)

                    setHistory(emails || [])
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

    if (!factura) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <p className="text-slate-600 dark:text-slate-400">Factura no encontrada o sin acceso.</p>
                <Button variant="outline" asChild>
                    <Link href="/ventas/facturas">Volver a Facturas</Link>
                </Button>
            </div>
        )
    }

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
                        <span className="font-medium text-slate-900 dark:text-slate-100">Enviar por Email</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Enviar Documento
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link href={`/ventas/facturas/${id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Cancelar y Volver
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-6">
                    <EmailSendForm
                        factura={factura}
                        cliente={factura.cliente}
                        empresaNombre={factura?.empresa?.razon_social || factura?.empresa?.nombre_comercial || clientConfig.nombre}
                        messageTemplate={message}
                        incluirLogo={includeLogo}
                        plantilla={template}
                    />
                </div>
                <div className="lg:col-span-5 space-y-6">
                    <EmailSummaryCard factura={factura} />
                    <EmailTemplatesPanel
                        onTemplateChange={setTemplate}
                        incluirLogo={includeLogo}
                        onLogoChange={setIncludeLogo}
                    />
                    <EmailActivityCard historial={history} />
                </div>
            </div>
        </div>
    )
}
