import { Metadata } from 'next'
import { ContratoForm } from '@/components/contratos/contrato-form'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext } from '@/app/actions/usuarios-empresas'

export const metadata: Metadata = {
    title: 'Nuevo Contrato | FN Autos',
    description: 'Crear un nuevo contrato de compra o venta',
}

export const dynamic = 'force-dynamic'

export default async function NuevoContratoPage() {
    const adminClient = createAdminClient()
    const { empresaId, empresas } = await getUserContext()
    const empresasIds = (empresas || []).map((e: { empresa_id: string }) => e.empresa_id).filter(Boolean)

    // Opcional: cargar clientes para un selector, igual que en facturas
    let query = adminClient.from('clientes').select('id, nombre_fiscal, nombre_comercial, cif, direccion, ciudad, codigo_postal, telefono:telefono_principal, email:email_principal').order('nombre_fiscal', { ascending: true })
    
    if (empresaId) {
        const { data: ces } = await adminClient
            .from('clientes_empresas')
            .select('cliente_id')
            .eq('empresa_id', empresaId)
        const clienteIds = (ces || []).map((c: { cliente_id: string }) => c.cliente_id)
        if (clienteIds.length > 0) {
            query = query.in('id', clienteIds)
        } else {
            query = query.eq('id', '00000000-0000-0000-0000-000000000000') // Forzar sin resultados si no hay clientes asociados
        }
    }

    const { data: clientes } = await query
    
    // Cargar datos de la empresa para autocompletar vendedor/comprador
    const { data: empresa } = await adminClient
        .from('empresas')
        .select('*')
        .eq('id', empresaId || '')
        .single()

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">Nuevo Contrato</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Crea un contrato digital de compra o venta de vehículos.
                </p>
            </div>
            <ContratoForm 
                clientes={clientes || []} 
                empresa={empresa || undefined}
                empresasIds={empresasIds}
            />
        </div>
    )
}
