'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { conceptoSchema, importCSVSchema } from '@/lib/validations/concepto-schema'
import { z } from 'zod'

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

export async function crearConceptoAction(formData: FormData) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        // Convert FormData to object with correct types
        const rawData = Object.fromEntries(formData.entries())
        const dataToValidate = {
            ...rawData,
            precio_base: Number(rawData.precio_base) || 0,
            iva_porcentaje: Number(rawData.iva_porcentaje) || 21,
            coste_interno: rawData.coste_interno ? Number(rawData.coste_interno) : undefined,
            activo: rawData.activo === 'true' || rawData.activo === 'on',
            destacado: rawData.destacado === 'true' || rawData.destacado === 'on',
            // Ensure empty string for code is treated as undefined for auto-generation
            codigo: rawData.codigo === '' ? undefined : rawData.codigo,
        }

        // If validation fails, this will throw
        const validated = conceptoSchema.parse(dataToValidate)

        // Generar código automático si no se proporcionó
        let codigo = validated.codigo
        if (!codigo) {
            const { data: codigoGenerado, error: genError } = await (supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: string | null, error: unknown }> }).rpc('generar_codigo_concepto', {
                p_empresa_id: empresaId,
                p_categoria: validated.categoria
            })
            if (genError) throw genError
            codigo = codigoGenerado ?? undefined
        }

        const { data, error } = await supabase
            .from('conceptos_catalogo')
            .insert({
                ...validated,
                codigo: codigo!,
                empresa_id: empresaId,
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/ventas/configuracion/conceptos')
        return { success: true, data }
    } catch (error: unknown) {
        console.error('[crearConceptoAction]', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0]?.message }
        }
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function actualizarConceptoAction(conceptoId: string, formData: FormData) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        const rawData = Object.fromEntries(formData.entries())
        const dataToValidate = {
            ...rawData,
            precio_base: Number(rawData.precio_base) || 0,
            iva_porcentaje: Number(rawData.iva_porcentaje) || 21,
            coste_interno: rawData.coste_interno ? Number(rawData.coste_interno) : undefined,
            activo: rawData.activo === 'true' || rawData.activo === 'on',
            destacado: rawData.destacado === 'true' || rawData.destacado === 'on',
            // Ensure empty string for code is treated as undefined
            codigo: rawData.codigo === '' ? undefined : rawData.codigo,
        }

        const validated = conceptoSchema.parse(dataToValidate)

        const { data, error } = await supabase
            .from('conceptos_catalogo')
            .update(validated)
            .eq('id', conceptoId)
            .eq('empresa_id', empresaId)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/ventas/configuracion/conceptos')
        return { success: true, data }
    } catch (error: unknown) {
        console.error('[actualizarConceptoAction]', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0]?.message }
        }
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function eliminarConceptoAction(conceptoId: string) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        // Verificar que no se haya usado en facturas (lineas_factura)
        const { count, error: countError } = await supabase
            .from('lineas_factura') // Using correct table name
            .select('id', { count: 'exact', head: true })
            .eq('concepto_id', conceptoId)

        if (countError) throw countError

        if (count && count > 0) {
            return {
                success: false,
                error: `No se puede eliminar. El concepto se ha usado en ${count} línea(s) de factura`
            }
        }

        const { error } = await supabase
            .from('conceptos_catalogo')
            .delete()
            .eq('id', conceptoId)
            .eq('empresa_id', empresaId)

        if (error) throw error

        revalidatePath('/ventas/configuracion/conceptos')
        return { success: true }
    } catch (error: unknown) {
        console.error('[eliminarConceptoAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function duplicarConceptoAction(conceptoId: string) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        // Obtener concepto original
        const { data: original, error: fetchError } = await supabase
            .from('conceptos_catalogo')
            .select('*')
            .eq('id', conceptoId)
            .eq('empresa_id', empresaId)
            .single()

        if (fetchError || !original) throw new Error('Concepto no encontrado')

        // Generar nuevo código
        const { data: nuevoCodigo, error: genError } = await (supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: string | null, error: unknown }> }).rpc('generar_codigo_concepto', {
            p_empresa_id: empresaId,
            p_categoria: original.categoria
        })

        if (genError) throw genError

        // Crear duplicado
        const { data, error } = await supabase
            .from('conceptos_catalogo')
            .insert({
                ...original,
                id: undefined, // Let DB generate new ID
                codigo: nuevoCodigo ?? `COPIA-${Date.now()}`,
                nombre: `${original.nombre} (Copia)`,
                veces_usado: 0,
                ultima_vez_usado: null,
                created_at: undefined, // Let DB handle defaults
                updated_at: undefined,
            } as unknown as import('@/types/supabase').Database['public']['Tables']['conceptos_catalogo']['Insert'])
            .select()
            .single()

        if (error) throw error

        revalidatePath('/ventas/configuracion/conceptos')
        return { success: true, data }
    } catch (error: unknown) {
        console.error('[duplicarConceptoAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function importarCSVAction(csvData: string) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        // Parsear CSV (simplificado, usar librería como papaparse en producción)
        const lines = csvData.trim().split('\n')
        if (lines.length < 2) throw new Error('CSV vacío o sin cabecera')

        const headers = lines[0].split(',').map(h => h.trim())
        const conceptos = []

        // Limit to 100 max for safety
        const maxRows = Math.min(lines.length, 101)

        for (let i = 1; i < maxRows; i++) {
            if (!lines[i].trim()) continue;

            const values = lines[i].split(',').map(v => v.trim())
            const obj: Record<string, string> = {}
            headers.forEach((header, index) => {
                // Map header to schema keys if needed, assuming direct mapping for now
                if (values[index] !== undefined) {
                    obj[header] = values[index]
                }
            })

            // Validar con zod
            const validated = importCSVSchema.parse({
                ...obj,
                precio_base: parseFloat(obj.precio_base || '0'),
                iva_porcentaje: parseFloat(obj.iva_porcentaje || '21'),
            })

            conceptos.push({
                ...validated,
                empresa_id: empresaId,
            })
        }

        // Insertar en bulk
        const { data, error } = await supabase
            .from('conceptos_catalogo')
            .insert(conceptos)
            .select()

        if (error) throw error

        revalidatePath('/ventas/configuracion/conceptos')
        return { success: true, data, count: conceptos.length }
    } catch (error: unknown) {
        console.error('[importarCSVAction]', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Error de validación en el CSV' }
        }
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function getEstadisticasConceptosAction() {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        const { data: conceptos, error } = await supabase
            .from('conceptos_catalogo')
            .select('precio_base, veces_usado, nombre') // Added nombre for naming the most used
            .eq('empresa_id', empresaId)

        if (error) throw error
        if (!conceptos) return { success: false, error: 'No se encontraron conceptos' }

        const totalConceptos = conceptos.length
        const precioPromedio = totalConceptos > 0
            ? conceptos.reduce((sum: number, c) => sum + (c.precio_base || 0), 0) / totalConceptos
            : 0

        // Encontrar más usado
        const masUsado = totalConceptos > 0
            ? conceptos.reduce((max, c) => (c.veces_usado || 0) > (max.veces_usado || 0) ? c : max, conceptos[0])
            : null

        return {
            success: true,
            data: {
                totalConceptos,
                precioPromedio,
                masUsado,
            }
        }
    } catch (error: unknown) {
        console.error('[getEstadisticasConceptosAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}
