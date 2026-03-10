import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GestionEmpresasClient } from '@/components/configuracion/gestion-empresas-client'
import { clientConfig } from '@/config/clients'
import type { Empresa } from '@/types/empresa'

export default async function GestionEmpresasPage() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // En modo single-empresa, redirigir directamente a la configuración de esa empresa
    if (!clientConfig.multiEmpresa) {
        redirect('/ventas/configuracion/empresa')
    }

    // Verificar que el usuario es admin
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('user_id', user.id)
        .single()

    if (perfil?.rol !== 'admin') {
        redirect('/dashboard')
    }

    // Cargar todas las empresas
    const { data: empresasRaw } = await supabase
        .from('empresas')
        .select('*')
        .is('deleted_at', null)
        .order('razon_social')

    // Normalizar datos de Supabase (created_at/updated_at pueden ser null)
    type EmpresaRow = NonNullable<typeof empresasRaw>[number]
    const empresas: Empresa[] = (empresasRaw || []).map((e: EmpresaRow) => ({
        ...e,
        created_at: e.created_at ?? '',
        updated_at: e.updated_at ?? '',
    })) as Empresa[]

    return (
        <div className="space-y-6">
            <div className="text-sm text-slate-500">Configuración › Empresas</div>

            <div>
                <h1 className="text-2xl sm:text-4xl font-serif font-bold">Gestión de Empresas</h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                    Administra todas las empresas del sistema
                </p>
            </div>

            <GestionEmpresasClient empresas={empresas} />
        </div>
    )
}
