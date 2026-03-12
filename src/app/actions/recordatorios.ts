'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { recordatorioSchema } from '@/lib/validations/recordatorio-schema'

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
    return { supabase, empresaId: perfil.empresa_id, userId: session.user.id }
}

export async function enviarRecordatorioAction(formData: FormData) {
    try {
        const { supabase, empresaId, userId } = await getEmpresaId()

        const rawData = Object.fromEntries(formData.entries())

        // Parsear facturas (pueden ser múltiples)
        let facturasIds: string[]
        const facturaIdRaw = rawData.factura_id as string
        if (facturaIdRaw) {
            try {
                facturasIds = JSON.parse(facturaIdRaw)
            } catch {
                facturasIds = [facturaIdRaw]
            }
        } else {
            facturasIds = []
        }

        const dataToValidate = {
            ...rawData,
            factura_id: facturasIds,
            adjuntar_factura: rawData.adjuntar_factura === 'true',
            emails_cc: rawData.emails_cc ? JSON.parse(rawData.emails_cc as string) : [],
        }

        const validated = recordatorioSchema.parse(dataToValidate)

        // Crear recordatorio para cada factura
        const recordatorios = []

        for (const facturaId of facturasIds) {
            // Obtener datos de la factura
            const { data: factura } = await (supabase as unknown as import("@supabase/supabase-js").SupabaseClient)
                .from('facturas')
                .select('*, clientes(*)')
                .eq('id', facturaId)
                .eq('empresa_id', empresaId)
                .single()

            if (!factura) continue

            // Reemplazar variables en el contenido
            const contenidoFinal = validated.contenido
                .replace(/{cliente_nombre}/g, factura.clientes.nombre_fiscal)
                .replace(/{factura_numero}/g, `${factura.serie}-${factura.numero}`)
                .replace(/{importe}/g, `${factura.total.toFixed(2)}€`)
                .replace(/{dias_vencido}/g, String(Math.floor((new Date().getTime() - new Date(factura.fecha_vencimiento).getTime()) / (1000 * 60 * 60 * 24))))

            const recordatorio = {
                ...validated,
                factura_id: facturaId,
                empresa_id: empresaId,
                creado_por: userId,
                contenido: contenidoFinal,
                email_destinatario: validated.email_destinatario || factura.clientes.email_principal,
                telefono_destinatario: validated.telefono_destinatario || factura.clientes.telefono_principal,
                estado: validated.fecha_programado ? 'pendiente' : 'enviado',
                fecha_envio: validated.fecha_programado ? null : new Date().toISOString(),
            }

            recordatorios.push(recordatorio)
        }

        // Insertar recordatorios
        const { data, error } = await (supabase as unknown as import("@supabase/supabase-js").SupabaseClient)
            .from('recordatorios')
            .insert(recordatorios)
            .select()

        if (error) throw error

        // TODO: Integrar con servicio de email real (Resend, SendGrid, etc)
        // Aquí se enviaría el email real

        revalidatePath('/ventas/facturas-vencidas')

        return { success: true, data, count: recordatorios.length }
    } catch (error: unknown) {
        console.error('[enviarRecordatorioAction]', error)
        let message = 'Error desconocido'
        if (error instanceof Error) {
            const zodErr = error as Error & { issues?: { message: string }[] }
            message = zodErr.issues?.[0]?.message ?? error.message
        }
        return { success: false, error: message }
    }
}

export async function registrarLlamadaAction(formData: FormData) {
    try {
        const { supabase, empresaId, userId } = await getEmpresaId()

        const rawData = Object.fromEntries(formData.entries())

        const recordatorio = {
            empresa_id: empresaId,
            factura_id: rawData.factura_id,
            tipo: 'llamada',
            contenido: rawData.notas || 'Llamada registrada',
            resultado_llamada: rawData.resultado_llamada,
            persona_contactada: rawData.persona_contactada,
            fecha_compromiso_pago: rawData.fecha_compromiso_pago || null,
            siguiente_accion: rawData.siguiente_accion,
            notas: rawData.notas,
            creado_por: userId,
            estado: 'enviado',
            fecha_envio: rawData.fecha_hora_llamada || new Date().toISOString(),
        }

        const { data, error } = await (supabase as unknown as import("@supabase/supabase-js").SupabaseClient)
            .from('recordatorios')
            .insert(recordatorio)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/ventas/facturas-vencidas')

        return { success: true, data }
    } catch (error: unknown) {
        console.error('[registrarLlamadaAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function getHistorialRecordatoriosAction(facturaId: string) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        const { data, error } = await (supabase as unknown as import("@supabase/supabase-js").SupabaseClient)
            .from('recordatorios')
            .select('*, perfiles!recordatorios_creado_por_fkey(nombre)')
            .eq('factura_id', facturaId)
            .eq('empresa_id', empresaId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, data }
    } catch (error: unknown) {
        console.error('[getHistorialRecordatoriosAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function marcarEmailAbierto(recordatorioId: string) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        const { error } = await (supabase as unknown as import("@supabase/supabase-js").SupabaseClient)
            .from('recordatorios')
            .update({
                estado: 'abierto',
                fecha_apertura: new Date().toISOString(),
            })
            .eq('id', recordatorioId)
            .eq('empresa_id', empresaId)

        if (error) throw error

        return { success: true }
    } catch (error: unknown) {
        console.error('[marcarEmailAbierto]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function getEstadisticasVencidasAction() {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        // Llamada a la función RPC
        const { data, error } = await (supabase as unknown as import("@supabase/supabase-js").SupabaseClient).rpc('get_estadisticas_vencidas', {
            p_empresa_id: empresaId
        })

        if (error) throw error

        return { success: true, data }
    } catch (error: unknown) {
        console.error('[getEstadisticasVencidasAction]', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}
