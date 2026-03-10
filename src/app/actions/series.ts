'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { serieSchema } from '@/lib/validations/serie-schema'
import { getUserContext } from '@/app/actions/usuarios-empresas'

const ANO_ACTUAL = new Date().getFullYear()

/**
 * Obtiene o crea la serie del año actual para una empresa.
 * Al cambiar de año (2027), crea V2027, Y2027, E2027 automáticamente.
 */
export async function obtenerOCrearSerieAnualAction(empresaId: string) {
    try {
        const adminClient = createAdminClient()
        const { data: empresa } = await adminClient
            .from('empresas')
            .select('id, razon_social, nombre_comercial, prefijo_serie')
            .eq('id', empresaId)
            .single()

        if (!empresa) return { success: false, error: 'Empresa no encontrada' }

        const emp = empresa as { prefijo_serie?: string; razon_social: string; nombre_comercial?: string }
        const prefijo = emp.prefijo_serie || (emp.razon_social ? emp.razon_social[0].toUpperCase() : 'F')
        const codigoAnual = `${prefijo}${ANO_ACTUAL}`

        const { data: existente } = await adminClient
            .from('series_facturacion')
            .select('id, codigo, nombre, predeterminada, empresa_id')
            .eq('empresa_id', empresaId)
            .eq('codigo', codigoAnual)
            .eq('activa', true)
            .single()

        if (existente) return { success: true, data: existente }

        // Crear serie del año actual (admin bypassa RLS)
        await adminClient.from('series_facturacion').update({ predeterminada: false }).eq('empresa_id', empresaId)

        const { data: nueva, error } = await adminClient
            .from('series_facturacion')
            .insert({
                empresa_id: empresaId,
                codigo: codigoAnual,
                nombre: `Facturación ${emp.nombre_comercial || emp.razon_social} ${ANO_ACTUAL}`,
                prefijo: '',
                sufijo: '',
                digitos: 4,
                numero_inicial: 1,
                numero_actual: 1,
                facturas_emitidas: 0,
                reseteo: 'anual',
                activa: true,
                predeterminada: true,
            })
            .select('id, codigo, nombre, predeterminada, empresa_id')
            .single()

        if (error) throw error
        revalidatePath('/ventas/facturas/nueva')
        revalidatePath('/ventas/configuracion/series')
        return { success: true, data: nueva }
    } catch (error: any) {
        console.error('[obtenerOCrearSerieAnualAction]', error)
        return { success: false, error: error.message }
    }
}

async function getSerieEmpresaId(supabase: Awaited<ReturnType<typeof createServerClient>>, serieId: string): Promise<string> {
    const { data: serie, error } = await supabase
        .from('series_facturacion')
        .select('empresa_id')
        .eq('id', serieId)
        .single()
    if (error || !serie?.empresa_id) throw new Error('Serie no encontrada')
    return serie.empresa_id
}

export async function crearSerieAction(formData: FormData) {
    try {
        const { supabase, empresaId, empresas } = await getUserContext()
        const empresaIdFinal = empresaId || (empresas as any[])?.[0]?.empresa_id
        if (!empresaIdFinal) throw new Error('Usuario sin empresa asignada')

        const rawData = Object.fromEntries(formData.entries())
        const dataToValidate = {
            ...rawData,
            numero_inicial: Number(rawData.numero_inicial) || 1,
            digitos: Number(rawData.digitos) || 3,
            activa: rawData.activa === 'on' || rawData.activa === 'true',
            predeterminada: rawData.predeterminada === 'on' || rawData.predeterminada === 'true',
        }

        const validated = serieSchema.parse(dataToValidate)

        // Si se marca como predeterminada, desactivar otras
        if (validated.predeterminada) {
            await supabase
                .from('series_facturacion')
                .update({ predeterminada: false })
                .eq('empresa_id', empresaIdFinal)
        }

        const { data, error } = await supabase
            .from('series_facturacion')
            .insert({
                ...validated,
                empresa_id: empresaIdFinal,
                numero_actual: validated.numero_inicial
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/ventas/configuracion/series')
        return { success: true, data }
    } catch (error: any) {
        console.error('[crearSerieAction]', error)
        const message = error.errors ? error.errors[0].message : error.message
        return { success: false, error: message }
    }
}

export async function actualizarSerieAction(serieId: string, formData: FormData) {
    try {
        const { supabase } = await getUserContext()
        const empresaIdFinal = await getSerieEmpresaId(supabase, serieId)

        const rawData = Object.fromEntries(formData.entries())
        const dataToValidate = {
            ...rawData,
            numero_inicial: Number(rawData.numero_inicial) || 1,
            digitos: Number(rawData.digitos) || 3,
            activa: rawData.activa === 'on' || rawData.activa === 'true',
            predeterminada: rawData.predeterminada === 'on' || rawData.predeterminada === 'true',
        }

        const validated = serieSchema.parse(dataToValidate)

        const numeroActualRaw = rawData.numero_actual
        const numeroActual = numeroActualRaw ? Number(numeroActualRaw) : undefined

        if (numeroActual !== undefined && numeroActual >= 1) {
            const { data: facturas } = await supabase
                .from('facturas')
                .select('numero')
                .eq('serie_id', serieId)
                .eq('estado', 'emitida')
            const maxNum = (facturas ?? []).reduce((max, f) => {
                const n = parseInt(String(f.numero).replace(/\D/g, '') || '0', 10)
                return n > max ? n : max
            }, 0)
            if (numeroActual <= maxNum) {
                return { success: false, error: `Verifactu: el próximo número (${numeroActual}) no puede ser ≤ al último emitido (${maxNum}). Use ${maxNum + 1} o superior.` }
            }
        }

        if (validated.predeterminada) {
            await supabase
                .from('series_facturacion')
                .update({ predeterminada: false })
                .eq('empresa_id', empresaIdFinal)
                .neq('id', serieId)
        }

        const updateData: Record<string, unknown> = { ...validated }
        if (numeroActual !== undefined) updateData.numero_actual = numeroActual

        const { data, error } = await supabase
            .from('series_facturacion')
            .update(updateData)
            .eq('id', serieId)
            .eq('empresa_id', empresaIdFinal)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/ventas/configuracion/series')
        return { success: true, data }
    } catch (error: any) {
        console.error('[actualizarSerieAction]', error)
        const message = error.errors ? error.errors[0].message : error.message
        return { success: false, error: message }
    }
}

export async function eliminarSerieAction(serieId: string) {
    try {
        const { supabase } = await getUserContext()
        const empresaIdFinal = await getSerieEmpresaId(supabase, serieId)

        const { count } = await supabase
            .from('facturas')
            .select('id', { count: 'exact', head: true })
            .eq('serie_id', serieId)

        if (count && count > 0) {
            return { success: false, error: `Serie tiene ${count} factura(s) asociada(s)` }
        }

        const { error } = await supabase
            .from('series_facturacion')
            .delete()
            .eq('id', serieId)
            .eq('empresa_id', empresaIdFinal)

        if (error) throw error

        revalidatePath('/ventas/configuracion/series')
        return { success: true }
    } catch (error: any) {
        console.error('[eliminarSerieAction]', error)
        return { success: false, error: error.message }
    }
}

export async function toggleActivaSerieAction(serieId: string, activa: boolean) {
    try {
        const { supabase } = await getUserContext()
        const empresaIdFinal = await getSerieEmpresaId(supabase, serieId)

        const { error } = await supabase
            .from('series_facturacion')
            .update({ activa })
            .eq('id', serieId)
            .eq('empresa_id', empresaIdFinal)

        if (error) throw error

        revalidatePath('/ventas/configuracion/series')
        return { success: true }
    } catch (error: any) {
        console.error('[toggleActivaSerieAction]', error)
        return { success: false, error: error.message }
    }
}

export async function establecerPredeterminadaAction(serieId: string) {
    try {
        const { supabase } = await getUserContext()
        const empresaIdFinal = await getSerieEmpresaId(supabase, serieId)

        await supabase
            .from('series_facturacion')
            .update({ predeterminada: false })
            .eq('empresa_id', empresaIdFinal)

        const { error } = await supabase
            .from('series_facturacion')
            .update({ predeterminada: true })
            .eq('id', serieId)
            .eq('empresa_id', empresaIdFinal)

        if (error) throw error

        revalidatePath('/ventas/configuracion/series')
        return { success: true }
    } catch (error: any) {
        console.error('[establecerPredeterminadaAction]', error)
        return { success: false, error: error.message }
    }
}

export async function resetearNumeracionAction(serieId: string) {
    try {
        const { supabase } = await getUserContext()
        const empresaIdFinal = await getSerieEmpresaId(supabase, serieId)

        const { data: serie } = await supabase
            .from('series_facturacion')
            .select('numero_inicial')
            .eq('id', serieId)
            .eq('empresa_id', empresaIdFinal)
            .single()

        if (!serie) throw new Error('Serie no encontrada')

        const { error } = await supabase
            .from('series_facturacion')
            .update({ numero_actual: serie.numero_inicial })
            .eq('id', serieId)
            .eq('empresa_id', empresaIdFinal)

        if (error) throw error

        revalidatePath('/ventas/configuracion/series')
        return { success: true }
    } catch (error: any) {
        console.error('[resetearNumeracionAction]', error)
        return { success: false, error: error.message }
    }
}
