'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { clienteSchema } from '@/lib/validations/cliente-schema'
import { z } from 'zod'

/** Obtiene IDs de empresas del usuario (para notificaciones y fallback) */
function getEmpresaIds(empresas: Array<{ empresa_id?: string | null }>): string[] {
    return empresas
        .filter((e) => e.empresa_id)
        .map((e) => e.empresa_id as string)
}

export async function crearClienteAction(formData: FormData) {
    try {
        const { supabase, userId, empresas } = await getUserContext()
        let empresaIds = getEmpresaIds(empresas as { empresa_id?: string }[])
        if (empresaIds.length === 0) {
            const { data: perfil } = await supabase.from('perfiles').select('empresa_id').eq('user_id', userId).single()
            if (perfil?.empresa_id) empresaIds = [perfil.empresa_id]
        }
        if (empresaIds.length === 0) return { success: false, error: 'Usuario sin empresa asignada' }

        const rawData = Object.fromEntries(formData.entries())

        const dataToValidate = {
            ...rawData,
            descuento_comercial: Number(rawData.descuento_comercial) || 0,
            iva_aplicable: Number(rawData.iva_aplicable) || 21,
            activo: rawData.activo === 'on',
        }

        const compartido = rawData.compartido === 'true'
        const empresasIdsRaw = rawData.empresas_ids
        const empresasIds: string[] = compartido
            ? empresaIds
            : (typeof empresasIdsRaw === 'string' ? (empresasIdsRaw ? empresasIdsRaw.split(',').filter(Boolean) : []) : [])

        if (!compartido && empresasIds.length === 0) {
            return { success: false, error: 'Selecciona al menos una empresa' }
        }

        const validated = clienteSchema.parse(dataToValidate)

        const insertData: Record<string, unknown> = { ...validated, empresa_id: null }
        for (const k of Object.keys(insertData)) {
            if (insertData[k] === '') insertData[k] = null
        }

        const adminClient = createAdminClient()
        const { data, error } = await adminClient
            .from('clientes')
            .insert({ ...insertData, empresa_id: null } as unknown as import('@/types/supabase').Database['public']['Tables']['clientes']['Insert'])
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            throw error
        }

        const idsToInsert = compartido ? empresaIds : empresasIds
        if (idsToInsert.length > 0) {
            const adminFlexible = adminClient as unknown as import('@supabase/supabase-js').SupabaseClient
            const { error: ceError } = await adminFlexible.from('clientes_empresas')
                .insert(idsToInsert.map((empresa_id: string) => ({ cliente_id: data.id, empresa_id })))

            if (ceError) {
                console.error('[crearClienteAction] Error clientes_empresas:', ceError)
                await adminClient.from('clientes').delete().eq('id', data.id)
                return { success: false, error: 'Error al asociar empresas: ' + ceError.message }
            }
        }

        const notifEmpresaId = empresaIds[0]
        try {
            if (notifEmpresaId) {
                await supabase.rpc('crear_notificacion', {
                    p_user_id: userId,
                    p_empresa_id: notifEmpresaId,
                    p_tipo: 'success',
                    p_categoria: 'cliente',
                    p_titulo: 'Nuevo cliente creado',
                    p_mensaje: `Se ha creado el cliente "${data.nombre_fiscal}" exitosamente.`,
                    p_enlace: `/ventas/clientes/${data.id}`,
                    p_metadata: { cliente_id: data.id, nombre: data.nombre_fiscal }
                })
            }
        } catch (notifError) {
            console.error('[crearClienteAction] Error creando notificación:', notifError)
        }

        revalidatePath('/ventas/clientes')
        return { success: true, data }
    } catch (error: unknown) {
        console.error('[crearClienteAction]', error)

        if (error instanceof z.ZodError) {
            const issues = error.issues
            if (issues && issues.length > 0) {
                return { success: false, error: issues[0].message }
            }
            return { success: false, error: 'Error de validación' }
        }

        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: errorMessage }
    }
}

export async function actualizarClienteAction(clienteId: string, formData: FormData) {
    try {
        const { supabase, userId, empresas } = await getUserContext()
        let empresaIds = getEmpresaIds(empresas as { empresa_id?: string }[])
        if (empresaIds.length === 0) {
            const { data: perfil } = await supabase.from('perfiles').select('empresa_id').eq('user_id', userId).single()
            if (perfil?.empresa_id) empresaIds = [perfil.empresa_id]
        }
        if (empresaIds.length === 0) return { success: false, error: 'Usuario sin empresa asignada' }

        const rawData = Object.fromEntries(formData.entries())
        const dataToValidate = {
            ...rawData,
            descuento_comercial: Number(rawData.descuento_comercial) || 0,
            iva_aplicable: Number(rawData.iva_aplicable) || 21,
            activo: rawData.activo === 'on',
        }

        const compartido = rawData.compartido === 'true'
        const empresasIdsRaw = rawData.empresas_ids
        const empresasIds: string[] = compartido
            ? empresaIds
            : (typeof empresasIdsRaw === 'string' ? (empresasIdsRaw ? empresasIdsRaw.split(',').filter(Boolean) : []) : [])

        if (!compartido && empresasIds.length === 0) {
            return { success: false, error: 'Selecciona al menos una empresa' }
        }

        const validated = clienteSchema.parse(dataToValidate)

        const adminClient = createAdminClient()
        const { data, error } = await adminClient
            .from('clientes')
            .update({ ...validated, empresa_id: null } as unknown as import('@/types/supabase').Database['public']['Tables']['clientes']['Update'])
            .eq('id', clienteId)
            .select()
            .single()

        if (error) throw error

        const adminFlexible = adminClient as unknown as import('@supabase/supabase-js').SupabaseClient
        await adminFlexible.from('clientes_empresas').delete().eq('cliente_id', clienteId)
        const idsToInsert = compartido ? empresaIds : empresasIds
        if (idsToInsert.length > 0) {
            const { error: ceError } = await adminFlexible.from('clientes_empresas')
                .insert(idsToInsert.map((empresa_id: string) => ({ cliente_id: clienteId, empresa_id })))

            if (ceError) {
                console.error('[actualizarClienteAction] Error clientes_empresas:', ceError)
                return { success: false, error: 'Error al actualizar empresas: ' + ceError.message }
            }
        }

        revalidatePath('/ventas/clientes')
        revalidatePath(`/ventas/clientes/${clienteId}`)
        return { success: true, data }
    } catch (error: unknown) {
        console.error('[actualizarClienteAction]', error)

        if (error instanceof z.ZodError) {
            const issues = error.issues
            if (issues && issues.length > 0) {
                return { success: false, error: issues[0].message }
            }
            return { success: false, error: 'Error de validación' }
        }

        const errorMessage = error instanceof Error ? error.message : 'Error al actualizar cliente'
        return { success: false, error: errorMessage }
    }
}

export async function eliminarClienteAction(clienteId: string) {
    try {
        const { supabase } = await getUserContext()

        const { count, error: countError } = await supabase
            .from('facturas')
            .select('id', { count: 'exact', head: true })
            .eq('cliente_id', clienteId)

        if (countError) {
            console.error('[eliminarClienteAction] Error checking facturas:', countError)
        }

        if (count && count > 0) {
            return { success: false, error: `No se puede eliminar: tiene ${count} factura(s) asociada(s). Elimina las facturas primero.` }
        }

        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', clienteId)

        if (error) {
            console.error('[eliminarClienteAction] Delete error:', error)
            // Handle FK constraint violation (client has invoices)
            if (error.message?.includes('violates foreign key constraint') || error.message?.includes('not-null constraint') || error.code === '23503') {
                return { success: false, error: 'No se puede eliminar: el cliente tiene facturas asociadas. Elimina las facturas primero.' }
            }
            return { success: false, error: `Error al eliminar: ${error.message}` }
        }

        revalidatePath('/ventas/clientes')
        return { success: true }
    } catch (error: unknown) {
        console.error('[eliminarClienteAction]', error)
        return { success: false, error: error instanceof Error ? error.message : 'Error al eliminar el cliente. Inténtalo de nuevo.' }
    }
}

export async function toggleActivoClienteAction(clienteId: string, activo: boolean) {
    try {
        const { supabase } = await getUserContext()

        const { error } = await supabase
            .from('clientes')
            .update({ activo })
            .eq('id', clienteId)

        if (error) throw error

        revalidatePath('/ventas/clientes')
        revalidatePath(`/ventas/clientes/${clienteId}`)
        return { success: true }
    } catch (error: unknown) {
        console.error('[toggleActivoClienteAction]', error)
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
}
