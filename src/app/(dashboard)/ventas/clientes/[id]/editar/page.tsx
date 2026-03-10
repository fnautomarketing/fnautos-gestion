import { createServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ClienteForm } from '@/components/clientes/cliente-form'
import { getUserContext } from '@/app/actions/usuarios-empresas'

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { supabase, empresas } = await getUserContext()

    const { data: cliente } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single()

    if (!cliente) notFound()

    const { data: ces } = await supabase
        .from('clientes_empresas')
        .select('empresa_id')
        .eq('cliente_id', id)
    const empresasCliente = (ces || []).map((c: { empresa_id: string }) => c.empresa_id)

    const empresasOptions = (empresas as { empresa_id: string; empresa?: { razon_social: string; nombre_comercial?: string } }[])
        .filter((e: any) => e.empresa_id)
        .map((e: any) => ({
            id: e.empresa_id,
            razon_social: e.empresa?.razon_social || 'Sin nombre',
            nombre_comercial: e.empresa?.nombre_comercial,
        }))

    return (
        <div className="space-y-6 w-full">
            <div>
                <div className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                    <span className="opacity-50">Ventas</span>
                    <span>›</span>
                    <span className="opacity-50">Clientes</span>
                    <span>›</span>
                    <span className="opacity-50">{cliente.nombre_fiscal}</span>
                    <span>›</span>
                    <span className="text-primary">Editar</span>
                </div>
                <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white">Editar Cliente</h1>
                <div className="flex items-center gap-3 mt-2">
                    <p className="text-slate-600 dark:text-slate-400 font-medium">{cliente.nombre_fiscal}</p>
                    <span className="h-1 w-1 bg-slate-500 rounded-full"></span>
                    <p className="text-slate-500 font-mono text-sm bg-white/5 px-2 py-0.5 rounded border border-white/10">{cliente.cif}</p>
                </div>
            </div>
            <ClienteForm
                clienteId={id}
                defaultValues={cliente as unknown as any}
                empresas={empresasOptions}
                empresasCliente={empresasCliente}
            />
        </div>
    )
}
