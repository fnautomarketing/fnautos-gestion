'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { pagoSchema } from '@/lib/validations/pago-schema'
import { Pago } from '@/types/ventas'
import { getUserContext } from '@/app/actions/usuarios-empresas'

export async function registrarPagoAction(formData: FormData) {
    try {
        const { supabase, empresaId: contextEmpresaId, userId, rol } = await getUserContext()

        const rawData = Object.fromEntries(formData.entries())
        const dataToValidate = {
            ...rawData,
            importe: Number(rawData.importe),
            marcar_como_pagada: rawData.marcar_como_pagada === 'true',
            conciliado: rawData.conciliado === 'true',
        }

        const validated = pagoSchema.parse(dataToValidate)

        const isGlobal = !contextEmpresaId && rol === 'admin'

        let query = supabase
            .from('facturas')
            .select('id, total, pagado, cliente_id, numero, empresa_id')
            .eq('id', validated.factura_id)
            
        if (!isGlobal) {
            query = query.eq('empresa_id', contextEmpresaId!)
        }

        // Obtener factura: en Vision Global no filtrar por empresa; si no, filtrar
        const { data: factura } = await query.single() as unknown as { data: { id: string, total: number, pagado: number, cliente_id: string, numero: string, empresa_id: string } | null }

        if (!factura) {
            return { success: false, error: 'Factura no encontrada' }
        }

        const empresaId = isGlobal ? factura.empresa_id : contextEmpresaId!

        // Validar que el pago no excede el pendiente
        const totalPagado = Number(factura.pagado) || 0
        const pendiente = Number(factura.total) - totalPagado
        if (validated.importe > pendiente + 0.01) {
            return {
                success: false,
                error: `El importe del pago (${validated.importe}€) excede el pendiente (${pendiente.toFixed(2)}€)`
            }
        }

        // Registrar pago en pagos_factura (historial en detalle de factura)
        const { error: errorPago } = await supabase
            .from('pagos_factura')
            .insert({
                factura_id: validated.factura_id,
                importe: validated.importe,
                fecha_pago: validated.fecha_pago,
                metodo_pago: validated.metodo_pago,
                referencia: validated.referencia || null,
                cuenta_bancaria: validated.cuenta_bancaria || null,
                notas: validated.notas || null,
                empresa_id: empresaId,
            })

        if (errorPago) throw errorPago

        const { error: errorPagos } = await supabase
            .from('pagos')
            .insert({
                factura_id: validated.factura_id,
                importe: validated.importe,
                fecha_pago: validated.fecha_pago,
                metodo_pago: validated.metodo_pago,
                referencia: validated.referencia || null,
                cuenta_bancaria: validated.cuenta_bancaria || null,
                notas: validated.notas || null,
                empresa_id: empresaId,
                creado_por: userId,
                conciliado: validated.conciliado || false,
                anulado: false,
            })

        if (errorPagos) {
            console.error('[registrarPagoAction] Error inserting into pagos:', errorPagos)
        }

        // Actualizar total pagado en la factura
        const nuevoPagado = totalPagado + validated.importe
        const actualizacion: Record<string, unknown> = {
            pagado: nuevoPagado,
            updated_at: new Date().toISOString(),
        }

        // Actualizar estado: pagada si cubre total, parcial si hay pagos pero no cubre
        const facturaPagadaCompletamente = validated.marcar_como_pagada || nuevoPagado >= Number(factura.total) - 0.01
        if (facturaPagadaCompletamente) {
            actualizacion.estado = 'pagada'
        } else {
            actualizacion.estado = 'parcial'
        }

        const { error: errorUpdate } = await supabase
            .from('facturas')
            .update(actualizacion)
            .eq('id', validated.factura_id)
            .eq('empresa_id', empresaId)

        if (errorUpdate) {
            console.error('[registrarPagoAction] Error updating factura:', errorUpdate)
        }

        // Crear notificación (empresaId ya es el de la factura en Vision Global)
        // Crear notificación usando RPC para mantener el contexto de autenticación
        try {
            await supabase.rpc('crear_notificacion', {
                p_user_id: userId,
                p_empresa_id: empresaId,
                p_tipo: facturaPagadaCompletamente ? 'success' : 'info',
                p_categoria: 'pago',
                p_titulo: facturaPagadaCompletamente ? 'Factura pagada completamente' : 'Pago registrado',
                p_mensaje: facturaPagadaCompletamente
                    ? `La factura ${factura.numero} ha sido pagada completamente (${validated.importe.toFixed(2)}€).`
                    : `Se ha registrado un pago de ${validated.importe.toFixed(2)}€ para la factura ${factura.numero}.`,
                p_enlace: `/ventas/facturas/${validated.factura_id}`,
                p_metadata: {
                    factura_id: validated.factura_id,
                    numero: factura.numero,
                    importe: validated.importe,
                    pagada_completamente: facturaPagadaCompletamente
                }
            })
        } catch (notifError) {
            console.error('[registrarPagoAction] Error creando notificación:', notifError)
        }

        revalidatePath('/ventas/pagos')
        revalidatePath('/ventas/facturas')
        revalidatePath(`/ventas/facturas/${validated.factura_id}`)

        return { success: true }

    } catch (error: unknown) {
        console.error('[registrarPagoAction]', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0]?.message || 'Error de validación' }
        }
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

async function getEmpresaIdForPagos() {
    const { supabase, empresaId, rol, empresas } = await getUserContext()

    let empresaIdUsada = empresaId

    // Si no hay empresa activa:
    // - Para admin: usar la primera empresa disponible (mismo criterio que otras pantallas)
    // - Para no admin: error
    if (!empresaIdUsada) {
        if (rol === 'admin' && empresas && empresas.length > 0) {
            const primera = empresas[0]
            empresaIdUsada = primera.empresa_id
        } else {
            throw new Error('Usuario sin empresa activa para pagos')
        }
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()

    return { supabase, empresaId: empresaIdUsada, userId: user?.id }
}

export async function anularPagoAction(pagoId: string, motivo: string) {
    try {
        const { supabase, empresaId } = await getEmpresaIdForPagos()

        const { data, error } = await (supabase as unknown as import('@supabase/supabase-js').SupabaseClient)
            .from('pagos')
            .update({
                anulado: true,
                fecha_anulacion: new Date().toISOString(),
                motivo_anulacion: motivo,
            })
            .eq('id', pagoId)
            .eq('empresa_id', empresaId)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/ventas/pagos')
        revalidatePath('/ventas/facturas')

        return { success: true, data: data as Pago }
    } catch (error: unknown) {
        console.error('[anularPagoAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function toggleConciliadoAction(pagoId: string, conciliado: boolean) {
    try {
        const { supabase, empresaId } = await getEmpresaIdForPagos()

        const updateData: Partial<Pago> = { conciliado }
        if (conciliado) {
            updateData.fecha_conciliacion = new Date().toISOString()
        } else {
            updateData.fecha_conciliacion = null
        }

        const { error } = await (supabase as unknown as import('@supabase/supabase-js').SupabaseClient)
            .from('pagos')
            .update(updateData)
            .eq('id', pagoId)
            .eq('empresa_id', empresaId)

        if (error) throw error

        revalidatePath('/ventas/pagos')

        return { success: true }
    } catch (error: unknown) {
        console.error('[toggleConciliadoAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function subirComprobanteAction(pagoId: string, formData: FormData) {
    try {
        const { supabase, empresaId } = await getEmpresaIdForPagos()

        const file = formData.get('comprobante') as File
        if (!file) throw new Error('No se proporcionó archivo')

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Solo se permiten archivos PDF, JPG o PNG')
        }

        if (file.size > 5 * 1024 * 1024) {
            throw new Error('El archivo no puede superar 5MB')
        }

        const fileName = `${empresaId}/pagos/${pagoId}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
            .from('comprobantes')
            .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
            .from('comprobantes')
            .getPublicUrl(fileName)

        const { error: updateError } = await (supabase as unknown as import('@supabase/supabase-js').SupabaseClient)
            .from('pagos')
            .update({ comprobante_url: urlData.publicUrl })
            .eq('id', pagoId)
            .eq('empresa_id', empresaId)

        if (updateError) throw updateError

        revalidatePath('/ventas/pagos')

        return { success: true, data: { url: urlData.publicUrl } }
    } catch (error: unknown) {
        console.error('[subirComprobanteAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function getEstadisticasPagosAction() {
    try {
        const { supabase, empresaId, rol } = await getUserContext()

        const isGlobalAdmin = !empresaId && rol === 'admin'

        // Para acciones críticas (toggle/anular/subir comprobante) usamos empresaId concreto.
        // Pero en estadísticas, si estamos en Visión Global, queremos ver el agregado de TODAS las empresas.
        const filtroEmpresa = isGlobalAdmin ? null : empresaId

        const inicioMes = new Date()
        inicioMes.setDate(1)
        inicioMes.setHours(0, 0, 0, 0)

        // Pagos del mes (agregado o por empresa)
        let pagosQuery = (supabase as unknown as import('@supabase/supabase-js').SupabaseClient)
            .from('pagos')
            .select('importe')
            .eq('anulado', false)
            .gte('fecha_pago', inicioMes.toISOString().split('T')[0])
        if (filtroEmpresa) {
            pagosQuery = pagosQuery.eq('empresa_id', filtroEmpresa)
        }
        const { data: pagosMes } = await pagosQuery
        const totalCobradoMes = (pagosMes as Array<{ importe: number }> | null)?.reduce((sum: number, p) => sum + (p.importe || 0), 0) || 0

        // Facturas pendientes (emitidas / parciales)
        let facturasPendientesQuery = supabase
            .from('facturas')
            .select('total, pagado')
            .in('estado', ['emitida', 'parcial'])
        if (filtroEmpresa) {
            facturasPendientesQuery = facturasPendientesQuery.eq('empresa_id', filtroEmpresa)
        }
        const { data: facturasPendientes } = await facturasPendientesQuery
        const pendienteCobro = (facturasPendientes as Array<{ total: number, pagado: number }> | null)?.reduce((sum: number, f) =>
            sum + (f.total - (f.pagado || 0)), 0
        ) || 0

        const numFacturasPendientes = facturasPendientes?.length || 0

        const hoy = new Date()
        const finSemana = new Date(hoy)
        finSemana.setDate(hoy.getDate() + 7)

        // Facturas que vencen esta semana
        let facturasVencenSemanaQuery = supabase
            .from('facturas')
            .select('total, pagado')
            .in('estado', ['emitida', 'parcial'])
            .gte('fecha_vencimiento', hoy.toISOString().split('T')[0])
            .lte('fecha_vencimiento', finSemana.toISOString().split('T')[0])
        if (filtroEmpresa) {
            facturasVencenSemanaQuery = facturasVencenSemanaQuery.eq('empresa_id', filtroEmpresa)
        }
        const { data: facturasVencenSemana } = await facturasVencenSemanaQuery
        const venceSemana = (facturasVencenSemana as Array<{ total: number, pagado: number }> | null)?.reduce((sum: number, f) =>
            sum + (f.total - (f.pagado || 0)), 0
        ) || 0

        const numVencenSemana = facturasVencenSemana?.length || 0

        // Conteo de pagos totales
        let totalPagosQuery = (supabase as unknown as import('@supabase/supabase-js').SupabaseClient)
            .from('pagos')
            .select('id', { count: 'exact', head: true })
            .eq('anulado', false)
        if (filtroEmpresa) {
            totalPagosQuery = totalPagosQuery.eq('empresa_id', filtroEmpresa)
        }
        const { count: totalPagos } = await totalPagosQuery

        // Conteo de pagos conciliados
        let pagosConciliadosQuery = (supabase as unknown as import('@supabase/supabase-js').SupabaseClient)
            .from('pagos')
            .select('id', { count: 'exact', head: true })
            .eq('anulado', false)
            .eq('conciliado', true)
        if (filtroEmpresa) {
            pagosConciliadosQuery = pagosConciliadosQuery.eq('empresa_id', filtroEmpresa)
        }
        const { count: pagosConciliados } = await pagosConciliadosQuery

        return {
            success: true,
            data: {
                totalCobradoMes,
                pendienteCobro,
                numFacturasPendientes,
                venceSemana,
                numVencenSemana,
                totalPagos: totalPagos || 0,
                pagosConciliados: pagosConciliados || 0,
            }
        }
    } catch (error: unknown) {
        console.error('[getEstadisticasPagosAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

