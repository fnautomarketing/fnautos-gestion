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
    const { empresaId } = await getUserContext()

    // Opcional: cargar clientes para un selector, igual que en facturas
    let query = adminClient.from('clientes').select('id, nombre_fiscal, nombre_comercial, cif, direccion, ciudad, codigo_postal, telefono:telefono_principal, email:email_principal').order('nombre_fiscal', { ascending: true })
    if (empresaId) {
        query = query.eq('empresa_id', empresaId)
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
            />
        </div>
    )
}
