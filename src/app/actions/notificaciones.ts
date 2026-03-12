'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { NotificacionCreate, Notificacion } from '@/types/notificaciones'

/**
 * Crear una notificación para un usuario
 */
export async function crearNotificacionAction(data: NotificacionCreate) {
    try {
        const supabase = await createServerClient()

        const rpcArgs: Record<string, unknown> = {
            p_user_id: data.user_id ?? '',
            p_empresa_id: data.empresa_id ?? '',
            p_tipo: data.tipo,
            p_categoria: data.categoria,
            p_titulo: data.titulo,
            p_mensaje: data.mensaje,
            p_metadata: data.metadata ?? {}
        }
        if (data.enlace) rpcArgs.p_enlace = data.enlace
        const { error } = await (supabase as unknown as import("@supabase/supabase-js").SupabaseClient).rpc('crear_notificacion', rpcArgs)

        if (error) throw error

        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error: unknown) {
        console.error('[crearNotificacionAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

/**
 * Obtener notificaciones del usuario actual
 */
export async function obtenerNotificacionesAction(limite: number = 10, soloNoLeidas: boolean = false) {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            throw new Error('No autenticado')
        }

        let query = supabase
            .from('notificaciones')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limite)

        if (soloNoLeidas) {
            query = query.eq('leida', false)
        }

        const { data, error } = await query
        const typedData = (data || []) as Notificacion[]

        if (error) {
            console.error('[obtenerNotificacionesAction] Error:', error)
            throw error
        }

        return { success: true, data: typedData }
    } catch (error: unknown) {
        console.error('[obtenerNotificacionesAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message, data: [] }
    }
}

/**
 * Marcar notificación como leída
 */
export async function marcarNotificacionLeidaAction(notificacionId: string) {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) throw new Error('No autenticado')

        const { error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('id', notificacionId)
            .eq('user_id', user.id)

        if (error) throw error

        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error: unknown) {
        console.error('[marcarNotificacionLeidaAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function marcarTodasLeidasAction() {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) throw new Error('No autenticado')

        const { error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('user_id', user.id)
            .eq('leida', false)

        if (error) throw error

        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error: unknown) {
        console.error('[marcarTodasLeidasAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

/**
 * Eliminar notificación
 */
export async function eliminarNotificacionAction(notificacionId: string) {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) throw new Error('No autenticado')

        const { error } = await supabase
            .from('notificaciones')
            .delete()
            .eq('id', notificacionId)
            .eq('user_id', user.id)

        if (error) throw error

        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error: unknown) {
        console.error('[eliminarNotificacionAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

/**
 * Contar notificaciones no leídas
 */
export async function contarNotificacionesNoLeidasAction() {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: true, count: 0 }

        const { count, error } = await supabase
            .from('notificaciones')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('leida', false)

        if (error) throw error

        return { success: true, count: count || 0 }
    } catch (error: unknown) {
        console.error('[contarNotificacionesNoLeidasAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message, count: 0 }
    }
}
