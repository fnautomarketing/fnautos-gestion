'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { crearContratoSchema } from '@/lib/validations/contrato-schema'
import {
    generarNumeroContrato,
    extraerSecuencialContrato,
    calcularIVA,
    precioEnLetras,
} from '@/lib/utils/contrato-utils'
import type { Contrato, EstadoContrato, TipoOperacion } from '@/types/contratos'

// ╔══════════════════════════════════════════════════════════╗
// ║  Server Actions — Contratos de compraventa              ║
// ╚══════════════════════════════════════════════════════════╝

// ── Helpers ──────────────────────────────────────────────

async function getAuthContext() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { empresaId } = await getUserContext()

    // Obtener empresa_id del perfil si no la tenemos del contexto
    let empresa_id = empresaId
    if (!empresa_id) {
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('empresa_id')
            .eq('user_id', user.id)
            .single()
        empresa_id = perfil?.empresa_id ?? null
    }

    if (!empresa_id) throw new Error('Usuario sin empresa asignada')

    return { user, empresa_id, supabase }
}

async function obtenerSiguienteNumeroContrato(empresaId: string): Promise<string> {
    const admin = createAdminClient()
    const currentYear = new Date().getFullYear()

    // Obtener el último número de contrato del año actual para esta empresa
    const { data } = await admin
        .from('contratos')
        .select('numero_contrato')
        .eq('empresa_id', empresaId)
        .like('numero_contrato', `CV-${currentYear}-%`)
        .order('numero_contrato', { ascending: false })
        .limit(1)

    const ultimoNumero = data?.[0]
        ? extraerSecuencialContrato(data[0].numero_contrato)
        : 0

    return generarNumeroContrato(ultimoNumero, currentYear)
}

// ── CREAR CONTRATO ──────────────────────────────────────

export async function crearContratoAction(input: z.infer<typeof crearContratoSchema>) {
    try {
        const { user, empresa_id } = await getAuthContext()
        const admin = createAdminClient()

        // Validar datos
        const validatedData = crearContratoSchema.parse(input)

        // Generar número secuencial
        const numeroContrato = await obtenerSiguienteNumeroContrato(empresa_id)

        // Calcular IVA y totales
        const { ivaImporte, totalConIva } = calcularIVA(
            validatedData.precio_venta,
            validatedData.iva_porcentaje
        )
        const precioLetras = precioEnLetras(totalConIva)



        // Insertar contrato
        const insertData: Record<string, unknown> = {
            empresa_id,
            numero_contrato: numeroContrato,
            tipo_operacion: validatedData.tipo_operacion,
            estado: 'borrador',

            // Comprador
            comprador_nombre: validatedData.comprador_nombre,
            comprador_nif: validatedData.comprador_nif,
            comprador_direccion: validatedData.comprador_direccion,
            comprador_ciudad: validatedData.comprador_ciudad,
            comprador_codigo_postal: validatedData.comprador_codigo_postal,
            comprador_telefono: validatedData.comprador_telefono,
            comprador_email: validatedData.comprador_email || null,

            // Vendedor
            vendedor_nombre: validatedData.vendedor_nombre,
            vendedor_nif: validatedData.vendedor_nif,
            vendedor_direccion: validatedData.vendedor_direccion,
            vendedor_ciudad: validatedData.vendedor_ciudad,
            vendedor_codigo_postal: validatedData.vendedor_codigo_postal,
            vendedor_telefono: validatedData.vendedor_telefono,
            vendedor_email: validatedData.vendedor_email || null,

            // Vehículo
            vehiculo_marca: validatedData.vehiculo_marca,
            vehiculo_modelo: validatedData.vehiculo_modelo,
            vehiculo_version: validatedData.vehiculo_version,
            vehiculo_matricula: validatedData.vehiculo_matricula.toUpperCase(),
            vehiculo_bastidor: validatedData.vehiculo_bastidor.toUpperCase(),
            vehiculo_fecha_matriculacion: validatedData.vehiculo_fecha_matriculacion || null,
            vehiculo_kilometraje: validatedData.vehiculo_kilometraje,
            vehiculo_color: validatedData.vehiculo_color,
            vehiculo_combustible: validatedData.vehiculo_combustible,

            // Económico
            precio_venta: validatedData.precio_venta,
            precio_letras: precioLetras,
            forma_pago: validatedData.forma_pago,
            iva_porcentaje: validatedData.iva_porcentaje,
            iva_importe: ivaImporte,
            total_con_iva: totalConIva,

            // Declaraciones
            vehiculo_estado_declarado: validatedData.vehiculo_estado_declarado,
            vehiculo_libre_cargas: validatedData.vehiculo_libre_cargas,
            documentacion_entregada: validatedData.documentacion_entregada,
            clausulas_adicionales: validatedData.clausulas_adicionales,

            // Relaciones
            cliente_id: validatedData.cliente_id,
            creado_por: user.id,
            notas_internas: validatedData.notas_internas,
        }

        const { data: contrato, error } = await admin
            .from('contratos')
            .insert(insertData as never)
            .select()
            .single()

        if (error || !contrato) {
            console.error('Error creando contrato:', error)
            throw new Error('Error al crear contrato: ' + error?.message)
        }

        revalidatePath('/ventas/contratos')

        return {
            success: true,
            data: {
                id: (contrato as Contrato).id,
                numero: (contrato as Contrato).numero_contrato,
            },
        }
    } catch (error: unknown) {
        console.error('Error en crearContratoAction:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

// ── OBTENER CONTRATOS (Lista) ───────────────────────────

interface FiltrosContratos {
    estado?: EstadoContrato | 'todos'
    tipo?: TipoOperacion | 'todos'
    busqueda?: string
}

export async function obtenerContratosAction(filtros?: FiltrosContratos) {
    try {
        const { empresa_id } = await getAuthContext()
        const admin = createAdminClient()

        let query = admin
            .from('contratos')
            .select('*')
            .eq('empresa_id', empresa_id)
            .order('created_at', { ascending: false })

        if (filtros?.estado && filtros.estado !== 'todos') {
            query = query.eq('estado', filtros.estado)
        }

        if (filtros?.tipo && filtros.tipo !== 'todos') {
            query = query.eq('tipo_operacion', filtros.tipo)
        }

        if (filtros?.busqueda && filtros.busqueda.trim()) {
            const busqueda = `%${filtros.busqueda.trim()}%`
            query = query.or(
                `comprador_nombre.ilike.${busqueda},vendedor_nombre.ilike.${busqueda},vehiculo_matricula.ilike.${busqueda},vehiculo_marca.ilike.${busqueda},numero_contrato.ilike.${busqueda}`
            )
        }

        const { data, error } = await query

        if (error) {
            console.error('Error obteniendo contratos:', error)
            throw new Error('Error al obtener contratos')
        }

        return { success: true, data: (data || []) as Contrato[] }
    } catch (error: unknown) {
        console.error('Error en obtenerContratosAction:', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message, data: [] as Contrato[] }
    }
}

// ── OBTENER CONTRATO (Detalle) ──────────────────────────

export async function obtenerContratoAction(id: string) {
    try {
        const { empresa_id } = await getAuthContext()
        const admin = createAdminClient()

        const { data, error } = await admin
            .from('contratos')
            .select('*')
            .eq('id', id)
            .eq('empresa_id', empresa_id)
            .single()

        if (error || !data) {
            return { success: false, error: 'Contrato no encontrado' }
        }

        return { success: true, data: data as unknown as Contrato }
    } catch (error: unknown) {
        console.error('Error en obtenerContratoAction:', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

// ── ACTUALIZAR CONTRATO ─────────────────────────────────

export async function actualizarContratoAction(
    id: string,
    input: z.infer<typeof crearContratoSchema>
) {
    try {
        const { empresa_id } = await getAuthContext()
        const admin = createAdminClient()

        // Verificar que el contrato existe y está en borrador
        const { data: existente } = await admin
            .from('contratos')
            .select('id, estado')
            .eq('id', id)
            .eq('empresa_id', empresa_id)
            .single()

        if (!existente) throw new Error('Contrato no encontrado')
        if ((existente as unknown as Contrato).estado !== 'borrador') {
            throw new Error('Solo se pueden editar contratos en borrador')
        }

        // Validar datos
        const validatedData = crearContratoSchema.parse(input)

        // Recalcular IVA y totales
        const { ivaImporte, totalConIva } = calcularIVA(
            validatedData.precio_venta,
            validatedData.iva_porcentaje
        )
        const precioLetras = precioEnLetras(totalConIva)

        const updateData: Record<string, unknown> = {
            tipo_operacion: validatedData.tipo_operacion,
            comprador_nombre: validatedData.comprador_nombre,
            comprador_nif: validatedData.comprador_nif,
            comprador_direccion: validatedData.comprador_direccion,
            comprador_ciudad: validatedData.comprador_ciudad,
            comprador_codigo_postal: validatedData.comprador_codigo_postal,
            comprador_telefono: validatedData.comprador_telefono,
            comprador_email: validatedData.comprador_email || null,
            vendedor_nombre: validatedData.vendedor_nombre,
            vendedor_nif: validatedData.vendedor_nif,
            vendedor_direccion: validatedData.vendedor_direccion,
            vendedor_ciudad: validatedData.vendedor_ciudad,
            vendedor_codigo_postal: validatedData.vendedor_codigo_postal,
            vendedor_telefono: validatedData.vendedor_telefono,
            vendedor_email: validatedData.vendedor_email || null,
            vehiculo_marca: validatedData.vehiculo_marca,
            vehiculo_modelo: validatedData.vehiculo_modelo,
            vehiculo_version: validatedData.vehiculo_version,
            vehiculo_matricula: validatedData.vehiculo_matricula.toUpperCase(),
            vehiculo_bastidor: validatedData.vehiculo_bastidor.toUpperCase(),
            vehiculo_fecha_matriculacion: validatedData.vehiculo_fecha_matriculacion || null,
            vehiculo_kilometraje: validatedData.vehiculo_kilometraje,
            vehiculo_color: validatedData.vehiculo_color,
            vehiculo_combustible: validatedData.vehiculo_combustible,
            precio_venta: validatedData.precio_venta,
            precio_letras: precioLetras,
            forma_pago: validatedData.forma_pago,
            iva_porcentaje: validatedData.iva_porcentaje,
            iva_importe: ivaImporte,
            total_con_iva: totalConIva,
            vehiculo_estado_declarado: validatedData.vehiculo_estado_declarado,
            vehiculo_libre_cargas: validatedData.vehiculo_libre_cargas,
            documentacion_entregada: validatedData.documentacion_entregada,
            clausulas_adicionales: validatedData.clausulas_adicionales,
            cliente_id: validatedData.cliente_id,
            notas_internas: validatedData.notas_internas,
        }

        const { error } = await admin
            .from('contratos')
            .update(updateData as never)
            .eq('id', id)
            .eq('empresa_id', empresa_id)

        if (error) {
            console.error('Error actualizando contrato:', error)
            throw new Error('Error al actualizar contrato: ' + error.message)
        }

        revalidatePath(`/ventas/contratos/${id}`)
        revalidatePath('/ventas/contratos')

        return { success: true }
    } catch (error: unknown) {
        console.error('Error en actualizarContratoAction:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

// ── ENVIAR CONTRATO (cambiar a pendiente_firma + email) ─

export async function enviarContratoAction(id: string) {
    try {
        const { empresa_id } = await getAuthContext()
        const admin = createAdminClient()

        // Obtener contrato
        const { data: contrato, error: fetchError } = await admin
            .from('contratos')
            .select('*')
            .eq('id', id)
            .eq('empresa_id', empresa_id)
            .single()

        if (fetchError || !contrato) throw new Error('Contrato no encontrado')

        const c = contrato as unknown as Contrato
        if (c.estado !== 'borrador' && c.estado !== 'pendiente_firma') {
            throw new Error('Solo se pueden enviar contratos en borrador o pendientes de firma')
        }

        // Determinar email del destinatario
        const emailDestinatario = c.tipo_operacion === 'venta'
            ? c.comprador_email
            : c.vendedor_email

        if (!emailDestinatario) {
            throw new Error('No se ha especificado el email del destinatario. Edita el contrato para añadir el email.')
        }

        // Generar nuevo token y expiración (7 días)
        const tokenExpira = new Date()
        tokenExpira.setDate(tokenExpira.getDate() + 7)

        // Actualizar estado y token
        const { data: updated, error: updateError } = await admin
            .from('contratos')
            .update({
                estado: 'pendiente_firma',
                token_firma: typeof crypto !== 'undefined' && crypto.randomUUID 
                    ? crypto.randomUUID() 
                    : Math.random().toString(36).substring(2) + Date.now().toString(36),
                token_firma_expira: tokenExpira.toISOString(),
            } as never)
            .eq('id', id)
            .select('token_firma')
            .single()

        if (updateError) {
            console.error('Error actualizando contrato:', updateError)
            throw new Error('Error al enviar contrato')
        }

        const token = (updated as unknown as { token_firma: string }).token_firma

        // Enviar email de invitación a firmar
        try {
            // Obtenemos el host actual para armar el link correctamente en producción (Hostinger)
            const headersList = await headers()
            const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000'
            const proto = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
            const requestBaseUrl = `${proto}://${host}`

            const { enviarEmailInvitacionFirma } = await import('@/app/actions/contratos-email')
            await enviarEmailInvitacionFirma({
                contrato: { ...c, token_firma: token } as Contrato,
                emailDestinatario,
                empresaId: empresa_id,
                baseUrl: requestBaseUrl,
            })
        } catch (emailError) {
            console.error('Error enviando email de invitación:', emailError)
            // No revertimos el estado, pero informamos al usuario
            return {
                success: true,
                warning: 'Contrato enviado pero hubo un error al enviar el email. Puedes reenviar desde el detalle del contrato.',
            }
        }

        revalidatePath(`/ventas/contratos/${id}`)
        revalidatePath('/ventas/contratos')

        return { success: true }
    } catch (error: unknown) {
        console.error('Error en enviarContratoAction:', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function enviarContratoConEmailAction(id: string, email: string) {
    try {
        const { empresa_id } = await getAuthContext()
        const admin = createAdminClient()

        // 1. Obtener contrato para saber qué campo actualizar
        const { data: contrato } = await admin
            .from('contratos')
            .select('tipo_operacion')
            .eq('id', id)
            .eq('empresa_id', empresa_id)
            .single()

        if (!contrato) throw new Error('Contrato no encontrado')

        // 2. Actualizar el email del cliente
        const campoEmail = contrato.tipo_operacion === 'venta' 
            ? 'comprador_email' 
            : 'vendedor_email'

        const { error: updateError } = await admin
            .from('contratos')
            .update({ [campoEmail]: email } as never)
            .eq('id', id)

        if (updateError) {
            console.error('Error actualizando email:', updateError)
            throw new Error('No se pudo actualizar el email del contrato')
        }

        // 3. Proceder con el envío normal
        return await enviarContratoAction(id)

    } catch (error: unknown) {
        console.error('Error en enviarContratoConEmailAction:', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

// ── REENVIAR CONTRATO FIRMADO ───────────────────────────

export async function reenviarContratoFirmadoAction(id: string) {
    try {
        const { empresa_id } = await getAuthContext()
        const admin = createAdminClient()

        // 1. Obtener contrato
        const { data: contrato, error: fetchError } = await admin
            .from('contratos')
            .select('*')
            .eq('id', id)
            .eq('empresa_id', empresa_id)
            .single()

        if (fetchError || !contrato) throw new Error('Contrato no encontrado')

        const c = contrato as unknown as Contrato
        if (c.estado !== 'firmado') {
            throw new Error('Solo se pueden reenviar contratos ya firmados')
        }

        // 2. Determinar email del destinatario
        const emailDestinatario = c.tipo_operacion === 'venta'
            ? c.comprador_email
            : c.vendedor_email

        if (!emailDestinatario) {
            throw new Error('El contrato no tiene un email de destinatario configurado')
        }

        // 3. Obtener baseUrl
        const headersList = await headers()
        const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000'
        const proto = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
        const requestBaseUrl = `${proto}://${host}`

        // 4. Obtener pdf de borrador/firmado e invocar enviarEmailCopiaFirmada
        const { enviarEmailCopiaFirmada } = await import('@/app/actions/contratos-email')
        
        const urlDescarga = c.pdf_firmado_url || c.pdf_borrador_url
        if (!urlDescarga) {
            throw new Error('No se encontró el PDF firmado para este contrato')
        }
        
        // Obtener el PDF real de storage
        const { data: pdfData, error: downloadError } = await admin
            .storage
            .from('contratos')
            .download(urlDescarga)

        if (downloadError || !pdfData) {
            console.error('Error descargando PDF:', downloadError)
            throw new Error('Error al acceder al documento PDF firmado')
        }

        const pdfBuffer = await pdfData.arrayBuffer()
        const base64Pdf = Buffer.from(pdfBuffer).toString('base64')

        await enviarEmailCopiaFirmada({
            contrato: c,
            emailDestinatario,
            empresaId: empresa_id,
            pdfBuffer: Buffer.from(base64Pdf, 'base64'),
            baseUrl: requestBaseUrl,
        })

        return { success: true }
    } catch (error: unknown) {
        console.error('Error en reenviarContratoFirmadoAction:', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

// ── ANULAR CONTRATO ─────────────────────────────────────

export async function anularContratoAction(id: string) {
    try {
        const { empresa_id } = await getAuthContext()
        const admin = createAdminClient()

        // Verificar estado
        const { data: contrato } = await admin
            .from('contratos')
            .select('id, estado')
            .eq('id', id)
            .eq('empresa_id', empresa_id)
            .single()

        if (!contrato) throw new Error('Contrato no encontrado')

        const c = contrato as unknown as Contrato
        if (c.estado === 'firmado') {
            throw new Error('No se puede anular un contrato ya firmado')
        }
        if (c.estado === 'anulado') {
            throw new Error('Este contrato ya está anulado')
        }

        const { error } = await admin
            .from('contratos')
            .update({ estado: 'anulado' } as never)
            .eq('id', id)

        if (error) throw new Error('Error al anular contrato: ' + error.message)

        revalidatePath(`/ventas/contratos/${id}`)
        revalidatePath('/ventas/contratos')

        return { success: true }
    } catch (error: unknown) {
        console.error('Error en anularContratoAction:', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

// ── OBTENER CONTRATO POR TOKEN (público, sin auth) ──────

export async function obtenerContratoPorTokenAction(token: string) {
    try {
        const admin = createAdminClient()

        const { data, error } = await admin
            .from('contratos')
            .select('*')
            .eq('token_firma', token)
            .single()

        if (error || !data) {
            return { success: false, error: 'invalid_token' as const }
        }

        const contrato = data as unknown as Contrato

        if (contrato.estado === 'firmado') {
            return {
                success: false,
                error: 'already_signed' as const,
                firmado_en: contrato.firmado_en,
            }
        }

        if (contrato.estado !== 'pendiente_firma') {
            return { success: false, error: 'invalid_token' as const }
        }

        if (contrato.token_firma_expira && new Date(contrato.token_firma_expira) < new Date()) {
            return { success: false, error: 'expired_token' as const }
        }

        // Devolver contrato completo ya que la vista pública espera un tipo Contrato
        return {
            success: true,
            data: contrato,
        }
    } catch (error: unknown) {
        console.error('Error en obtenerContratoPorTokenAction:', error)
        return { success: false, error: 'invalid_token' as const }
    }
}
