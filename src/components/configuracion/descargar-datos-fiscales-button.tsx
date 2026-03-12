'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
    empresaId: string
    nombreEmpresa: string
}

export function DescargarDatosFiscalesButton({ empresaId, nombreEmpresa }: Props) {
    const [descargando, setDescargando] = useState(false)

    const handleDescargar = async () => {
        setDescargando(true)
        try {
            const url = `/api/empresas/datos-fiscales/pdf?empresa_id=${encodeURIComponent(empresaId)}`
            const res = await fetch(url)

            if (!res.ok) {
                const msg = await res.text()
                throw new Error(msg || `Error ${res.status}`)
            }

            const blob = await res.blob()
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            const nombreSanitizado = nombreEmpresa.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-')
            link.download = `Datos-fiscales-${nombreSanitizado}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(link.href)

            toast.success('PDF de datos fiscales descargado')
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al generar el PDF'
            toast.error(message)
        } finally {
            setDescargando(false)
        }
    }

    return (
        <Button
            variant="outline"
            onClick={handleDescargar}
            disabled={descargando}
            className="flex items-center gap-2 min-h-[44px] w-full sm:w-auto border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
            data-testid="btn-descargar-datos-fiscales"
        >
            {descargando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4" />
            )}
            {descargando ? 'Generando PDF...' : 'Descargar datos fiscales'}
        </Button>
    )
}
