import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface EmpresaContext {
    userId: string
    empresaId: string
    rol: string
}

/**
 * Helper reutilizable para obtener el contexto empresa del usuario.
 * Soporta tanto el modelo legacy (perfiles.empresa_id) como el nuevo (usuarios_empresas).
 * RFC-025: Multi-Company Support
 */
export async function getEmpresaContext(): Promise<EmpresaContext> {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('No autenticado')
    }

    // Intentar primero el nuevo modelo (usuarios_empresas)
    // Note: using 'any' cast because usuarios_empresas isn't in generated types yet (pending migration)
    // FIX: Usamos createAdminClient para evitar bloqueo por falta de RLS policies en esta tabla crítica
    const adminClient = createAdminClient()
    const { data: userEmpresas } = await (adminClient
        .from('usuarios_empresas' as 'perfiles') as any)
        .select('empresa_id, rol, empresa_activa')
        .eq('user_id', user.id)
        .eq('empresa_activa', true)
        .single()

    if ((userEmpresas as any)?.empresa_id) {
        return {
            userId: user.id,
            empresaId: (userEmpresas as any).empresa_id,
            rol: (userEmpresas as any).rol,
        }
    }

    // Fallback al modelo legacy (perfiles)
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('empresa_id, rol')
        .eq('user_id', user.id)
        .single()

    if (!perfil?.empresa_id) {
        throw new Error('Usuario sin empresa asignada')
    }

    return {
        userId: user.id,
        empresaId: perfil.empresa_id,
        rol: perfil.rol || 'operador',
    }
}

/**
 * Obtener todas las empresas del usuario para el selector.
 */
export async function getAllUserEmpresas() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Intentar nuevo modelo
    const { data: userEmpresas } = await supabase
        .from('usuarios_empresas' as any)
        .select(`
            empresa_id,
            rol,
            empresa_activa,
            empresa:empresas(id, razon_social, nombre_comercial, logo_url, tipo_empresa)
        `)
        .eq('user_id', user.id)

    if (userEmpresas && userEmpresas.length > 0) {
        return userEmpresas.map((ue: any) => ({
            id: ue.empresa_id,
            razon_social: ue.empresa?.razon_social || 'Sin nombre',
            nombre_comercial: ue.empresa?.nombre_comercial,
            logo_url: ue.empresa?.logo_url,
            tipo_empresa: ue.empresa?.tipo_empresa,
            rol: ue.rol,
            activa: ue.empresa_activa,
        }))
    }

    // Fallback: devolver solo la empresa del perfil
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('empresa_id, rol')
        .eq('user_id', user.id)
        .single()

    if (!perfil?.empresa_id) return []

    const { data: empresa } = await supabase
        .from('empresas')
        .select('id, razon_social, nombre_comercial, logo_url, tipo_empresa')
        .eq('id', perfil.empresa_id)
        .single()

    if (!empresa) return []

    return [{
        ...empresa,
        rol: perfil.rol || 'operador',
        activa: true,
    }]
}
