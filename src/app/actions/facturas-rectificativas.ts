'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getEmpresaId() {
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No autenticado')

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('empresa_id')
        .eq('user_id', session.user.id)
        .single()

    if (!perfil?.empresa_id) throw new Error('Usuario sin empresa')
    return { supabase, empresaId: perfil.empresa_id }
}

export async function getFacturaParaRectificarAction(facturaId: string) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        // Obtener factura con cliente
        const { data: factura, error } = await supabase
            .from('facturas')
            .select(`
        *,
        cliente:clientes(nombre_fiscal),
        lineas:lineas_factura(*)
      `)
            .eq('id', facturaId)
            .eq('empresa_id', empresaId)
            .single()

        if (error) throw error

        // Validaciones
        if (factura.estado === 'anulada') {
            return { success: false, error: 'No se puede rectificar una factura anulada' }
        }

        if (factura.es_rectificativa) {
            return { success: false, error: 'No se puede rectificar una factura que ya es rectificativa' }
        }

        return { success: true, data: factura }
    } catch (error: any) {
        console.error('[getFacturaParaRectificarAction]', error)
        return { success: false, error: error.message }
    }
}

import { facturaRectificativaSchema, type FacturaRectificativaFormData } from '@/lib/validations/factura-rectificativa-schema'
import { z } from 'zod'

export async function crearFacturaRectificativaAction(datos: FacturaRectificativaFormData) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        // Validación Zod (Server Action Standard)
        const validated = facturaRectificativaSchema.safeParse(datos)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        const {
            factura_original_id,
            tipo_rectificativa,
            motivo,
            lineas_a_rectificar,
            generar_abono
        } = validated.data

        // Verificar que la factura pertenece a la empresa
        const { data: factura } = await supabase
            .from('facturas')
            .select('empresa_id, estado, es_rectificativa')
            .eq('id', factura_original_id)
            .single()

        if (!factura || factura.empresa_id !== empresaId) {
            return { success: false, error: 'Factura no encontrada' }
        }

        if (factura.estado === 'anulada') {
            return { success: false, error: 'No se puede rectificar una factura anulada' }
        }

        if (factura.es_rectificativa) {
            return { success: false, error: 'No se puede rectificar una factura rectificativa' }
        }

        // Llamar a la función PL/pgSQL
        const { data: rectificativaId, error } = await supabase.rpc(
            'crear_factura_rectificativa',
            {
                p_factura_original_id: factura_original_id,
                p_tipo_rectificativa: tipo_rectificativa,
                p_motivo: motivo,
                p_lineas_a_rectificar: lineas_a_rectificar,
                p_generar_abono: generar_abono,
            }
        )

        if (error) throw error

        revalidatePath('/ventas/facturas')
        revalidatePath(`/ventas/facturas/${factura_original_id}`)

        return {
            success: true,
            data: { id: rectificativaId },
            message: 'Factura rectificativa creada correctamente'
        }
    } catch (error: any) {
        console.error('[crearFacturaRectificativaAction]', error)
        return { success: false, error: error.message }
    }
}

export async function getRectificativasDeFacturaAction(facturaId: string) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        const { data, error } = await supabase
            .from('facturas')
            .select('*')
            .eq('factura_rectificada_id', facturaId)
            .eq('empresa_id', empresaId)
            .eq('es_rectificativa', true)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, data: data || [] }
    } catch (error: any) {
        console.error('[getRectificativasDeFacturaAction]', error)
        return { success: false, error: error.message }
    }
}

export async function getListadoRectificativasAction(params?: {
    page?: number
    limit?: number
    search?: string
}) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        const page = params?.page || 1
        const limit = params?.limit || 20
        const offset = (page - 1) * limit

        let query = supabase
            .from('vista_facturas_rectificativas')
            .select('*', { count: 'exact' })
            .eq('empresa_id', empresaId)

        if (params?.search) {
            query = query.or(
                `rectificativa_numero.ilike.%${params.search}%,` +
                `original_numero.ilike.%${params.search}%,` +
                `cliente_nombre.ilike.%${params.search}%`
            )
        }

        const { data, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false })

        if (error) throw error

        return {
            success: true,
            data: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        }
    } catch (error: any) {
        console.error('[getListadoRectificativasAction]', error)
        return { success: false, error: error.message }
    }
}
