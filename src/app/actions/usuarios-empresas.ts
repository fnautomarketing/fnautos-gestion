'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Helper para obtener el contexto del usuario con soporte multi-empresa
 */
export async function getUserContext() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('No autenticado')
    }

    // Obtener todas las empresas del usuario
    const { data: userEmpresas, error: ueError } = await supabase
        .from('usuarios_empresas')
        .select(`
            id,
            empresa_id,
            rol,
            empresa_activa,
            empresa:empresas(id, razon_social, nombre_comercial, logo_url, tipo_empresa)
        `)
        .eq('user_id', user.id)

    if (ueError) console.error('[getUserContext] Fetch Error:', JSON.stringify(ueError, null, 2))

    // Check if user is admin globally (from perfiles)
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('user_id', user.id)
        .single()

    const isAdmin = perfil?.rol === 'admin'
    let allEmpresas = userEmpresas || []

    // If Admin, fetch ALL companies and merge
    if (isAdmin) {
        const { data: todasLasEmpresas } = await supabase
            .from('empresas')
            .select('id, razon_social, nombre_comercial, logo_url, tipo_empresa')

        if (todasLasEmpresas) {
            const existingIds = new Set(allEmpresas.map((ue: any) => ue.empresa_id))
            const additionalEmpresas = todasLasEmpresas
                .filter((e: any) => !existingIds.has(e.id))
                .map((e: any) => ({
                    id: e.id, // Virtual ID using company ID
                    empresa_id: e.id,
                    rol: 'admin',
                    empresa_activa: false,
                    empresa: e
                }))

            allEmpresas = [...allEmpresas, ...additionalEmpresas]
        }
    }

    // Fallback logic if still empty
    if (!allEmpresas || allEmpresas.length === 0) {
        // ... (existing fallback logic kept implicitly or we can just return empty structure)
        const { data: perfilData } = await supabase
            .from('perfiles')
            .select('empresa_id, rol')
            .eq('user_id', user.id)
            .single()

        if (!perfilData?.empresa_id) throw new Error('Usuario sin empresa')

        return {
            supabase,
            userId: user.id,
            empresaId: perfilData.empresa_id,
            empresas: [],
            rol: perfilData.rol,
            isAdmin: perfilData.rol === 'admin',
        }
    }

    // Encontrar empresa activa
    // Encontrar empresa activa
    // Encontrar empresa activa
    const empresaActiva = allEmpresas.find((ue: any) => ue.empresa_activa)

    // Si ES admin y NO hay empresa activa, es MODO GLOBAL (return null)
    // Si NO es admin, forzamos la primera
    let activeId: string | null = empresaActiva?.empresa_id || null
    let activeRole = empresaActiva?.rol

    if (!activeId) {
        if (isAdmin) {
            // GLOBAL MODE
            activeId = null
            activeRole = 'admin'
        } else {
            // Force first one
            const first = allEmpresas[0]
            activeId = first.empresa_id
            activeRole = first.rol
        }
    }

    return {
        supabase,
        userId: user.id,
        empresaId: activeId, // Can be null for Global View
        empresas: allEmpresas,
        rol: activeRole,
        isAdmin,
    }
}

/**
 * Listar empresas del usuario actual
 */
export async function listarEmpresasUsuarioAction() {
    try {
        const { empresas, empresaId, rol, isAdmin } = await getUserContext()
        return {
            success: true,
            data: {
                empresas: empresas.filter((ue: any) => ue.empresa_id).map((ue: any) => ({
                    id: ue.empresa_id!,
                    razon_social: ue.empresa?.razon_social || 'Sin nombre',
                    nombre_comercial: ue.empresa?.nombre_comercial,
                    logo_url: ue.empresa?.logo_url,
                    tipo_empresa: ue.empresa?.tipo_empresa,
                    rol: ue.rol,
                    activa: ue.empresa_activa,
                })),
                empresaActivaId: empresaId,
                isGlobal: !empresaId && isAdmin,
                isAdmin
            }
        }
    } catch (error: any) {
        console.error('[listarEmpresasUsuarioAction]', error)
        return { success: false, error: error.message }
    }
}

/**
 * Cambiar empresa activa
 * @param nuevaEmpresaId ID de la empresa o 'ALL' para modo global
 */
export async function cambiarEmpresaActivaAction(nuevaEmpresaId: string) {
    try {
        const { supabase, userId } = await getUserContext()

        // 1. Desactivar todas las empresas del usuario (Reset state)
        const { error: resetError } = await supabase
            .from('usuarios_empresas')
            .update({ empresa_activa: false })
            .eq('user_id', userId)

        if (resetError) console.error('[Cambio Empresa] Error reset:', resetError)

        // Caso Modo Global
        if (nuevaEmpresaId === 'ALL') {
            revalidatePath('/', 'layout')
            return { success: true }
        }

        // 2. Intentar activar la empresa objetivo
        const { data, error } = await supabase
            .from('usuarios_empresas')
            .update({ empresa_activa: true })
            .eq('user_id', userId)
            .eq('empresa_id', nuevaEmpresaId)
            .select()

        if (error) throw error

        // Si se actualizó alguna fila, éxito
        if (data && data.length > 0) {
            revalidatePath('/', 'layout')
            return { success: true }
        }



        // 3. Si no se actualizó nada, verificamos si es Admin para crear el vínculo
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('user_id', userId)
            .single()

        if (perfil?.rol === 'admin') {
            // Es admin global pero no tiene vínculo: lo creamos activo
            const { error: insertError } = await supabase
                .from('usuarios_empresas')
                .insert({
                    user_id: userId,
                    empresa_id: nuevaEmpresaId,
                    rol: 'admin',
                    empresa_activa: true
                })

            if (insertError) {
                console.error('[Cambio Empresa] Insert Error:', insertError)
                throw insertError
            }

            revalidatePath('/', 'layout')
            return { success: true }
        }

        return { success: false, error: 'No tienes acceso a esta empresa' }

    } catch (error: any) {
        console.error('[cambiarEmpresaActivaAction]', error)
        return { success: false, error: error.message }
    }
}

/**
 * Obtener empresa activa con datos completos
 */
export async function getEmpresaActivaAction() {
    try {
        const { supabase, empresaId } = await getUserContext()

        if (!empresaId) throw new Error('No hay empresa activa seleccionada')

        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', empresaId)
            .single()

        if (error) throw error

        return { success: true, data }
    } catch (error: any) {
        console.error('[getEmpresaActivaAction]', error)
        return { success: false, error: error.message }
    }
}

/**
 * Añadir nueva empresa al usuario (crear y vincular)
 */
export async function crearNuevaEmpresaAction(formData: FormData) {
    try {
        const { supabase, userId } = await getUserContext()

        const datosEmpresa = {
            razon_social: formData.get('razon_social') as string,
            nombre_comercial: formData.get('nombre_comercial') as string || null,
            cif: formData.get('cif') as string,
            tipo_empresa: formData.get('tipo_empresa') as string || 'autonomo',
            direccion: formData.get('direccion') as string || null,
            codigo_postal: formData.get('codigo_postal') as string || null,
            ciudad: formData.get('ciudad') as string || null,
            provincia: formData.get('provincia') as string || null,
            pais: 'España',
            telefono: formData.get('telefono') as string || null,
            email: formData.get('email') as string || null,
            iva_predeterminado: 21,
            retencion_predeterminada: 0,
            regimen_iva: 'general',
            aplica_recargo_equivalencia: false,
            recargo_porcentaje: 5.2,
            dias_pago_predeterminados: 30,
            formato_numero_factura: '{serie}{numero}',
            idioma_predeterminado: 'es',
            zona_horaria: 'Europe/Madrid',
            formato_fecha: 'DD/MM/YYYY',
            separador_miles: '.',
            separador_decimales: ',',
            activo: true,
        }

        // Crear empresa
        const { data: nuevaEmpresa, error: empresaError } = await supabase
            .from('empresas')
            .insert(datosEmpresa)
            .select()
            .single()

        if (empresaError) throw empresaError

        // Vincular usuario como administrador
        const { error: vinculoError } = await supabase
            .from('usuarios_empresas')
            .insert({
                user_id: userId,
                empresa_id: nuevaEmpresa.id,
                rol: 'administrador',
                empresa_activa: false,
            })

        if (vinculoError) throw vinculoError

        revalidatePath('/configuracion/empresas')
        return { success: true, data: nuevaEmpresa }
    } catch (error: any) {
        console.error('[crearNuevaEmpresaAction]', error)
        return { success: false, error: error.message }
    }
}

const EMPRESA_VILLEGAS_ID = '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5'
const PLANTILLA_ESTANDAR_ID = '42c849e4-e1e2-4eaa-b719-9bb64ab1fabd'
const PLANTILLA_CORPORATIVA_ID = '5e63ff58-2cd5-4234-805a-fd93f50ee84c'

/**
 * Listar plantillas PDF de una empresa específica.
 * Villegas → solo Premium; otras empresas → solo Estándar; Vision Global (ALL) → ambas.
 */
export async function listarPlantillasEmpresaAction(empresaId?: string) {
    try {
        const context = await getUserContext()
        const targetEmpresaId = empresaId || context.empresaId

        if (!targetEmpresaId) return { success: true, data: [] }

        const isVillegas = targetEmpresaId === EMPRESA_VILLEGAS_ID
        const isVisionGlobal = targetEmpresaId === 'ALL'

        const nombreDisplay: Record<string, string> = {
            [PLANTILLA_ESTANDAR_ID]: 'Estándar (sin logo por defecto)',
            [PLANTILLA_CORPORATIVA_ID]: 'Premium (logo y colores marca)',
        }

        if (isVisionGlobal) {
            const { data, error } = await context.supabase
                .from('plantillas_pdf')
                .select('id, nombre, descripcion, predeterminada, activa, logo_url, color_primario')
                .in('id', [PLANTILLA_ESTANDAR_ID, PLANTILLA_CORPORATIVA_ID])
                .eq('activa', true)
                .order('predeterminada', { ascending: false })
            if (error) throw error
            const mapped = (data || []).map((p: any) => ({ ...p, nombre: nombreDisplay[p.id] ?? p.nombre }))
            return { success: true, data: mapped }
        }

        const { data, error } = await context.supabase
            .from('plantillas_pdf')
            .select('id, nombre, descripcion, predeterminada, activa, logo_url, color_primario')
            .eq('empresa_id', targetEmpresaId)
            .eq('activa', true)
            .order('predeterminada', { ascending: false })

        if (error) throw error

        let filtered = data || []
        if (isVillegas) {
            filtered = filtered.filter((p: any) => p.id === PLANTILLA_CORPORATIVA_ID)
            if (filtered.length === 0) {
                const { data: fallback } = await context.supabase
                    .from('plantillas_pdf')
                    .select('id, nombre, descripcion, predeterminada, activa, logo_url, color_primario')
                    .eq('id', PLANTILLA_CORPORATIVA_ID)
                    .single()
                if (fallback) filtered = [fallback]
            }
        } else {
            // Yenifer, Edison, etc.: usar plantillas de la empresa (excluir Premium si existiera)
            filtered = filtered.filter((p: any) => p.id !== PLANTILLA_CORPORATIVA_ID)
            if (filtered.length === 0) {
                // Fallback: crear virtual Estándar si no hay plantillas (no debería ocurrir tras migración)
                filtered = [{
                    id: PLANTILLA_ESTANDAR_ID,
                    nombre: 'Estándar (sin logo por defecto)',
                    descripcion: 'Plantilla estándar',
                    predeterminada: true,
                    activa: true,
                    logo_url: null,
                    color_primario: '#3b82f6',
                }]
            }
        }

        const dataWithNames = filtered.map((p: any) => ({
            ...p,
            nombre: nombreDisplay[p.id] ?? p.nombre,
        }))
        return { success: true, data: dataWithNames }
    } catch (error: any) {
        console.error('[listarPlantillasEmpresaAction]', error)
        return { success: false, error: error.message, data: [] }
    }
}
