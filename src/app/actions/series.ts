'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { serieSchema } from '@/lib/validations/serie-schema'

const ANO_ACTUAL = new Date().getFullYear()

/**
 * Obtiene o crea la serie del año actual para una empresa.
 * NO crea nuevas series si ya existe al menos una activa general del año actual.
 */
export async function obtenerOCrearSerieAnualAction(empresaId: string) {
    try {
        const adminClient = createAdminClient()

        // Comprobar si ya existe al menos una serie general activa para este año
        const { data: seriesExistentes } = await adminClient
            .from('series_facturacion')
            .select('id, codigo, predeterminada')
            .eq('empresa_id', empresaId)
            .eq('activa', true)
            .neq('tipo', 'rectificativa')

        // Si ya hay series activas de tipo general para este año, no crear más
        const seriesAnuales = (seriesExistentes || []).filter((s) =>
            s.codigo.includes(String(ANO_ACTUAL))
        )
        if (seriesAnuales.length > 0) {
            // Asegurar que al menos una es predeterminada
            const hayPredeterminada = seriesAnuales.some((s) => s.predeterminada)
            if (!hayPredeterminada) {
                await adminClient.from('series_facturacion')
                    .update({ predeterminada: true })
                    .eq('id', seriesAnuales[0].id)
            }
            return { success: true, data: seriesAnuales[0] }
        }

        // Si no hay ninguna serie del año actual, crear F{AÑO}
        const codigoAnual = `F${ANO_ACTUAL}`

        await adminClient.from('series_facturacion').update({ predeterminada: false }).eq('empresa_id', empresaId)

        const { data: nueva, error } = await adminClient
            .from('series_facturacion')
            .insert({
                empresa_id: empresaId,
                codigo: codigoAnual,
                nombre: `Facturación ${ANO_ACTUAL}`,
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
    } catch (error: unknown) {
        console.error('[obtenerOCrearSerieAnualAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

/**
 * Helper interno: obtiene el empresa_id de una serie usando adminClient (bypass RLS).
 */
async function getSerieEmpresaId(serieId: string): Promise<string> {
    const adminClient = createAdminClient()
    const { data: serie, error } = await adminClient
        .from('series_facturacion')
        .select('empresa_id')
        .eq('id', serieId)
        .single()
    if (error || !serie?.empresa_id) throw new Error('Serie no encontrada')
    return serie.empresa_id
}

export async function crearSerieAction(formData: FormData) {
    try {
        const { getUserContext } = await import('@/app/actions/usuarios-empresas')
        const { empresaId, empresas } = await getUserContext()
        const adminClient = createAdminClient()

        const empresaIdFinal = empresaId || empresas?.[0]?.empresa_id
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
            await adminClient
                .from('series_facturacion')
                .update({ predeterminada: false })
                .eq('empresa_id', empresaIdFinal)
        }

        const { data, error } = await adminClient
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
    } catch (error: unknown) {
        console.error('[crearSerieAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function actualizarSerieAction(serieId: string, formData: FormData) {
    try {
        const adminClient = createAdminClient()
        const empresaIdFinal = await getSerieEmpresaId(serieId)

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
            const { data: facturas } = await adminClient
                .from('facturas')
                .select('numero')
                .eq('serie_id', serieId)
                .eq('estado', 'emitida')
            const maxNum = (facturas ?? []).reduce((max: number, f: { numero: string | null }) => {
                const n = parseInt(String(f.numero).replace(/\D/g, '') || '0', 10)
                return n > max ? n : max
            }, 0)
            if (numeroActual <= maxNum) {
                return { success: false, error: `Verifactu: el próximo número (${numeroActual}) no puede ser ≤ al último emitido (${maxNum}). Use ${maxNum + 1} o superior.` }
            }
        }

        if (validated.predeterminada) {
            await adminClient
                .from('series_facturacion')
                .update({ predeterminada: false })
                .eq('empresa_id', empresaIdFinal)
                .neq('id', serieId)
        }

        const updateData: Record<string, unknown> = { ...validated }
        if (numeroActual !== undefined) updateData.numero_actual = numeroActual

        const { data, error } = await adminClient
            .from('series_facturacion')
            .update(updateData)
            .eq('id', serieId)
            .eq('empresa_id', empresaIdFinal)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/ventas/configuracion/series')
        return { success: true, data }
    } catch (error: unknown) {
        console.error('[actualizarSerieAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function eliminarSerieAction(serieId: string) {
    try {
        const adminClient = createAdminClient()
        const empresaIdFinal = await getSerieEmpresaId(serieId)

        const { count } = await adminClient
            .from('facturas')
            .select('id', { count: 'exact', head: true })
            .eq('serie_id', serieId)

        if (count && count > 0) {
            return { success: false, error: `Serie tiene ${count} factura(s) asociada(s)` }
        }

        const { error } = await adminClient
            .from('series_facturacion')
            .delete()
            .eq('id', serieId)
            .eq('empresa_id', empresaIdFinal)

        if (error) throw error

        revalidatePath('/ventas/configuracion/series')
        return { success: true }
    } catch (error: unknown) {
        console.error('[eliminarSerieAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function toggleActivaSerieAction(serieId: string, activa: boolean) {
    try {
        const adminClient = createAdminClient()
        const empresaIdFinal = await getSerieEmpresaId(serieId)

        const { error } = await adminClient
            .from('series_facturacion')
            .update({ activa })
            .eq('id', serieId)
            .eq('empresa_id', empresaIdFinal)

        if (error) throw error

        revalidatePath('/ventas/configuracion/series')
        return { success: true }
    } catch (error: unknown) {
        console.error('[toggleActivaSerieAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function establecerPredeterminadaAction(serieId: string) {
    try {
        const adminClient = createAdminClient()
        const empresaIdFinal = await getSerieEmpresaId(serieId)

        await adminClient
            .from('series_facturacion')
            .update({ predeterminada: false })
            .eq('empresa_id', empresaIdFinal)

        const { error } = await adminClient
            .from('series_facturacion')
            .update({ predeterminada: true })
            .eq('id', serieId)
            .eq('empresa_id', empresaIdFinal)

        if (error) throw error

        revalidatePath('/ventas/configuracion/series')
        return { success: true }
    } catch (error: unknown) {
        console.error('[establecerPredeterminadaAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function resetearNumeracionAction(serieId: string) {
    try {
        const adminClient = createAdminClient()
        const empresaIdFinal = await getSerieEmpresaId(serieId)

        const { data: serie } = await adminClient
            .from('series_facturacion')
            .select('numero_inicial')
            .eq('id', serieId)
            .eq('empresa_id', empresaIdFinal)
            .single()

        if (!serie) throw new Error('Serie no encontrada')

        const { error } = await adminClient
            .from('series_facturacion')
            .update({ numero_actual: serie.numero_inicial })
            .eq('id', serieId)
            .eq('empresa_id', empresaIdFinal)

        if (error) throw error

        revalidatePath('/ventas/configuracion/series')
        return { success: true }
    } catch (error: unknown) {
        console.error('[resetearNumeracionAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}
