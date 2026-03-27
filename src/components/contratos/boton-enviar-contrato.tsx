'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { enviarContratoConEmailAction } from '@/app/actions/contratos'

interface BotonEnviarContratoProps {
  contratoId: string
  emailInicial: string | null
  tipoOperacion: string
  label?: string
}

export function BotonEnviarContrato({ 
  contratoId, 
  emailInicial, 
  tipoOperacion,
  label = 'Enviar para Firma'
}: BotonEnviarContratoProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(emailInicial || '')
  const [loading, setLoading] = useState(false)

  const handleEnviar = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Por favor, introduce un email válido')
      return
    }

    setLoading(true)
    try {
      const result = await enviarContratoConEmailAction(contratoId, email)
      if (result.success) {
        toast.success(result.warning || 'Contrato enviado correctamente')
        setOpen(false)
      } else {
        toast.error(result.error || 'Error al enviar el contrato')
      }
    } catch (error) {
      toast.error('Error inesperado al enviar el contrato')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Send className="w-4 h-4 mr-2" />
            {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif font-bold">Enviar Contrato para Firma</DialogTitle>
          <DialogDescription className="text-slate-500">
            Confirma el email del {tipoOperacion === 'venta' ? 'comprador' : 'vendedor'}. Se le enviará un enlace de firma digital a esta dirección.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500">Email del Destinatario</Label>
            <Input
              id="email"
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
            />
            {!emailInicial && (
              <p className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg flex items-center gap-1.5 border border-amber-100 dark:border-amber-900/40">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Email no especificado en el borrador.
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)} 
            disabled={loading}
            className="rounded-xl border-slate-200 dark:border-slate-800"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleEnviar} 
            disabled={loading}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Confirmar y Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
