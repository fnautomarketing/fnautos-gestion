'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, FileUp } from 'lucide-react'
import { toast } from 'sonner'

interface SeedPdfExternaButtonProps {
    facturaId: string
}

export function SeedPdfExternaButton({ facturaId }: SeedPdfExternaButtonProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleSeed = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/dev/seed-factura-externa?id=${facturaId}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Error')
            toast.success('PDF de prueba cargado. Puedes emitir la factura.')
            router.refresh()
        } catch (e) {
            const err = e as Error
            toast.error(err.message || 'Error al cargar PDF')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSeed}
            disabled={loading}
            className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/50"
        >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileUp className="h-4 w-4 mr-2" />}
            Cargar PDF de prueba
        </Button>
    )
}
