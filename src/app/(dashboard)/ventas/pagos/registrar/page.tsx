import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PagoForm } from '@/components/pagos/pago-form'

export default async function RegistrarPagoPage() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

    if (!perfil) throw new Error('Usuario sin empresa')

    // Cargar facturas pendientes
    const { data: facturas } = await supabase
        .from('facturas')
        .select(`
      id, 
      serie, 
      numero, 
      total, 
      pagado, 
      fecha_emision,
      cliente:clientes(nombre_fiscal)
    `)
        .eq('empresa_id', perfil.empresa_id)
        .in('estado', ['emitida', 'parcial'])
        .order('fecha_emision', { ascending: false })

    return (
        <div className="w-full py-8">
            <div className="mb-8">
                <Link href="/ventas/pagos" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Volver a Pagos
                </Link>
                <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Registrar Nuevo Pago</h1>
                <p className="text-slate-600 dark:text-slate-400">Selecciona una factura pendiente y registra el cobro</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6">
                <PagoForm facturas={(facturas || []) as any} />
            </div>
        </div>
    )
}
