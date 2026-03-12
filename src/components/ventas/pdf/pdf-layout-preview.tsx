'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Empresa, PdfOptions } from './pdf-document'
// Factura se usa en Props
import { FacturaPdfDocument, FacturaWithRelations } from './pdf-document'
import { clientConfig } from '@/config/clients'
import { Loader2, AlertCircle } from 'lucide-react'

interface PdfLayoutPreviewProps {
    factura: FacturaWithRelations
    empresa: Empresa
    options: PdfOptions
}

export function PdfLayoutPreview({ factura, empresa, options }: PdfLayoutPreviewProps) {
    const [url, setUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true
        let objectUrl: string | null = null

        const generatePdf = async () => {
            try {
                setLoading(true)
                setError(null)

                // Dynamically load the renderer to ensure it runs only on client
                const { pdf } = await import('@react-pdf/renderer')

                // Logo PNG - usar el logo configurado
                const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}${clientConfig.logoPath}` : undefined

                // Prepare the document instance
                const doc = (
                    <FacturaPdfDocument
                        factura={factura}
                        empresa={empresa}
                        options={options}
                        logoUrl={logoUrl}
                    />
                )

                // Generate blob
                const blob = await pdf(doc).toBlob()
                objectUrl = URL.createObjectURL(blob)

                if (isMounted) {
                    setUrl(objectUrl)
                }
            } catch (err) {
                const e = err as Error
                console.error('PDF Generation failed:', e)
                if (isMounted) {
                    setError(e.message || 'Error desconocido al generar PDF')
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        // Debounce slightly to avoid rapid regenerations if props change fast? 
        // For now direct call.
        generatePdf()

        return () => {
            isMounted = false
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl)
            }
        }
    }, [factura, empresa, options]) // Re-run when props change

    // Initial server render placeholder
    if (loading && !url && !error) {
        return <div className="w-full h-[700px] bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center"><Skeleton className="w-full h-full" /></div>
    }

    return (
        <div className="w-full h-[700px] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-sm relative group">
            {loading && (
                <div className="absolute inset-0 z-10 bg-white/50 dark:bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-2">Generando vista previa...</span>
                </div>
            )}

            {error ? (
                <div className="flex flex-col items-center justify-center h-full text-red-500 gap-4 p-8 text-center">
                    <AlertCircle className="h-12 w-12" />
                    <div>
                        <h3 className="font-bold text-lg mb-1">Error de previsualización</h3>
                        <p className="text-sm opacity-80">{error}</p>
                    </div>
                </div>
            ) : (
                url && (
                    <iframe
                        src={url}
                        className="w-full h-full border-none bg-white"
                        title="PDF Preview"
                    />
                )
            )}
        </div>
    )
}
