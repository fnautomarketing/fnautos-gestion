'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { reenviarContratoFirmadoAction } from '@/app/actions/contratos'

export function BotonReenviarFirmado({ contratoId }: { contratoId: string }) {
  const [loading, setLoading] = useState(false)

  const handleReenviar = async () => {
    setLoading(true)
    try {
      const result = await reenviarContratoFirmadoAction(contratoId)
      if (result.success) {
        toast.success('Copia del contrato reenviada por email')
      } else {
        toast.error(result.error || 'Error al reenviar el contrato')
      }
    } catch (error) {
      toast.error('Error inesperado al reenviar el contrato')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
        variant="outline" 
        onClick={handleReenviar} 
        disabled={loading}
        className="rounded-xl border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400 shadow-sm"
    >
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
        Reenviar Copia Firmada
    </Button>
  )
}
