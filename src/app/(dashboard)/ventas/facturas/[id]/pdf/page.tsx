'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PdfLayoutPreview } from '@/components/ventas/pdf/pdf-layout-preview'
import { PdfOptionsPanel, PdfOptions, getPlantillasDisponibles } from '@/components/ventas/pdf/pdf-options-panel'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, FileDown, FileText } from 'lucide-react'
import type { Empresa } from '@/components/ventas/pdf/pdf-document'
import { FacturaWithRelations, FacturaPdfDocument } from '@/components/ventas/pdf/pdf-document'
import { listarEmpresasUsuarioAction } from '@/app/actions/usuarios-empresas'
import { clientConfig } from '@/config/clients'

const EMPRESA_VILLEGAS_ID = '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5'
const EMPRESA_YENIFER_ID = 'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a'
const EMPRESA_EDISON_ID = 'af15f25a-7ade-4de8-9241-a42e1b8407da'

interface PageProps {
    params: Promise<{ id: string }>
}

export default function FacturaPdfPage({ params }: PageProps) {
    const { id } = use(params)
    const [factura, setFactura] = useState<FacturaWithRelations | null>(null)
    const [empresa, setEmpresa] = useState<Empresa | null>(null)
    const [empresaActivaId, setEmpresaActivaId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)
    const [options, setOptions] = useState<PdfOptions>({
        plantilla: 'estandar',
        idioma: 'es',
        incluirLogo: false,
        notasPie: 'Gracias por su confianza.',
        incluirDatosBancarios: true
    })

    const supabase = createClient()

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
                const empresaIds = (empresasResult.success && empresasResult.data?.empresas)
                    ? (empresasResult.data.empresas as { id: string }[]).map((e) => e.id)
                    : perfil?.empresa_id ? [perfil.empresa_id] : []

                setEmpresaActivaId(activaId ?? null)

                const { data: fac, error } = await supabase
                    .from('facturas')
                    .select(`
                *,
                cliente:clientes(*),
                lineas:lineas_factura(*)
            `)
                    .eq('id', id)
                    .single()

                if (error || !fac) {
                    console.error('Error loading invoice', error)
                    return
                }
                const tieneAcceso = isGlobal || empresaIds.includes(fac.empresa_id)
                if (!tieneAcceso) return

                setFactura(fac)

                const plantillas = getPlantillasDisponibles(activaId ?? null)

                // Plantilla por defecto según empresa de la factura:
                // - Villegas: Premium (logo y colores marca)
                // - Yenifer / Edison: Estándar (sin logo por defecto)
                // - Otras: la primera disponible según empresa activa / visión global
                let defaultPlantilla = plantillas[0]?.value ?? 'estandar'
                if (fac.empresa_id === EMPRESA_VILLEGAS_ID && plantillas.some(p => p.value === 'premium')) {
                    defaultPlantilla = 'premium'
                } else if (fac.empresa_id === EMPRESA_YENIFER_ID || fac.empresa_id === EMPRESA_EDISON_ID) {
                    defaultPlantilla = 'estandar'
                }

                setOptions(prev => ({ ...prev, plantilla: defaultPlantilla }))

                const { data: emp } = await supabase
                    .from('empresas')
                    .select('razon_social, nombre_comercial, direccion, ciudad, codigo_postal, provincia, pais, cif, email, iban, banco, pie_factura')
                    .eq('id', fac.empresa_id)
                    .single()

                if (emp) {
                    setEmpresa({
                        nombre_fiscal: emp.razon_social || emp.nombre_comercial || 'Empresa',
                        direccion: emp.direccion || '',
                        ciudad: emp.ciudad || '',
                        codigo_postal: emp.codigo_postal || '',
                        cif: emp.cif || '',
                        email: emp.email || undefined,
                        iban: emp.iban || undefined,
                        banco: emp.banco || undefined,
                        pie_factura: emp.pie_factura || undefined,
                    })
                } else {
                    setEmpresa({
                        nombre_fiscal: 'Empresa',
                        direccion: '',
                        ciudad: '',
                        codigo_postal: '',
                        cif: '',
                    })
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [id, supabase])

    const handleDownloadTemplate = async () => {
        if (!factura || !empresa) return
        setDownloading(true)
        try {
            // Generar el mismo PDF que la vista previa (mismo componente y datos) para que el archivo guardado sea idéntico
            const { pdf } = await import('@react-pdf/renderer')
            const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}${clientConfig.logoPath}` : undefined
            const doc = (
                <FacturaPdfDocument
                    factura={factura}
                    empresa={empresa}
                    options={options}
                    logoUrl={logoUrl}
                />
            )
            const blob = await pdf(doc).toBlob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${factura.serie ?? 'FAC'}-${factura.numero ?? id}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (e) {
            console.error(e)
        } finally {
            setDownloading(false)
        }
    }

    const handleDownloadOriginal = () => {
        if ((factura as any)?.archivo_url) {
            window.open((factura as any).archivo_url, '_blank')
        }
    }

    const esExterna = !!(factura as any)?.es_externa
    const tieneArchivoOriginal = !!(factura as any)?.archivo_url

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        )
    }

    if (!factura) {
        return <div>Factura no encontrada o acceso denegado.</div>
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
                        <span className="font-medium text-slate-900 dark:text-slate-100">Generar PDF</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Generar Documento
                    </h1>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button variant="outline" asChild className="w-full sm:w-auto min-h-[44px]">
                        <Link href={`/ventas/facturas/${id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Link>
                    </Button>
                    {tieneArchivoOriginal && (
                        <Button variant="outline" onClick={handleDownloadOriginal} className="w-full sm:w-auto min-h-[44px]">
                            <FileDown className="mr-2 h-4 w-4" />
                            Descargar PDF original
                        </Button>
                    )}
                    <Button onClick={handleDownloadTemplate} disabled={downloading} className="w-full sm:w-auto min-h-[44px]">
                        {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        {downloading ? 'Generando...' : (tieneArchivoOriginal ? 'Generar PDF con plantilla' : 'Descargar PDF')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* Left: Preview (8 cols) */}
                <div className="lg:col-span-8 space-y-4">
                    <PdfLayoutPreview
                        factura={factura}
                        empresa={empresa || { nombre_fiscal: 'Empresa', direccion: '', ciudad: '', codigo_postal: '', cif: '' }}
                        options={options}
                    />
                </div>

                {/* Right: Options (4 cols) */}
                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
                    {tieneArchivoOriginal && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 space-y-2">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                PDF original disponible
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                Puedes descargar el PDF subido (histórico/importado) o generar uno nuevo con la plantilla de la empresa.
                            </p>
                        </div>
                    )}
                    <PdfOptionsPanel
                        options={options}
                        onChange={setOptions}
                        onDownload={handleDownloadTemplate}
                        esExterna={esExterna}
                        tieneArchivoOriginal={tieneArchivoOriginal}
                        empresaActivaId={empresaActivaId}
                        facturaId={id}
                    />
                </div>
            </div>
        </div>
    )
}
