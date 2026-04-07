'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { Factura, LineaFactura as LineaFacturaDB } from '@/types/ventas'
import { z } from 'zod'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { GuardarBorradorSchema, CrearFacturaSchema, EditarFacturaSchema, AnularFacturaSchema, DuplicarFacturaSchema, LineaFacturaSchema } from '@/lib/validations/ventas'

type LineaFactura = z.infer<typeof LineaFacturaSchema>

// Obtener número de factura mediante RPC (atómico)
// Retorna { numero, serieCodigo } - el RPC devuelve "V2026-0001", parseamos a numero="0001", serieCodigo="V2026"
async function obtenerSiguienteNumero(empresaId: string, serieId: string): Promise<{ numero: string; serieCodigo: string }> {
    const admin = createAdminClient()
    const { data: resultado, error } = await admin
        .rpc('obtener_siguiente_numero_serie', {
            p_serie_id: serieId
        })
    if (error) {
        console.error('Error al obtener número de serie:', error)
        throw new Error(`Error al generar número: ${error.message}`)
    }
    const full = (resultado as string) || ''
    const parts = full.split('-')
    // El RPC devuelve PREFIJO-NUMERO. Si no hay guion, asumimos que no hay prefijo.
    const numero = parts.length > 1 ? parts[parts.length - 1] : full || '0001'
    const serieCodigoFromFull = parts.length > 1 ? parts.slice(0, -1).join('-') : ''

    // Obtener el código de la serie real de la tabla para asegurar consistencia
    const { data: serie } = await admin
        .from('series_facturacion')
        .select('codigo')
        .eq('id', serieId)
        .single()

    return { 
        numero, 
        serieCodigo: serie?.codigo || serieCodigoFromFull 
    }
}

// Liberar número reservado cuando se elimina borrador externa
async function liberarNumeroSerie(serieId: string) {
    const admin = createAdminClient()
    const { error } = await (admin as any).rpc('liberar_numero_serie', { p_serie_id: serieId })
    if (error) {
        console.error('[liberarNumeroSerie] Error:', error)
    }
}

/** Preview del próximo número de factura (solo lectura, no consume el número). */
export async function obtenerProximoNumeroPreviewAction(serieId: string | null): Promise<string | null> {
    if (!serieId) return null
    try {
        const admin = createAdminClient()
        const { data, error } = await (admin as any).rpc('obtener_proximo_numero_preview', { p_serie_id: serieId })
        if (error) {
            console.error('[obtenerProximoNumeroPreview] Error:', error)
            return null
        }
        return (data as string) || null
    } catch (error: unknown) {
        console.error('[obtenerProximoNumeroPreview] Unexpected error:', error)
        return null
    }
}

// Guardar borrador
export async function guardarBorradorAction(formData: FormData) {
    try {
        const supabase = await createServerClient()
        const admin = createAdminClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('No autenticado')

        // Parse and validate data
        const rawData = {
            empresa_id: formData.get('empresa_id'),
            serie: formData.get('serie'),
            cliente_id: formData.get('cliente_id'),
            fecha_emision: formData.get('fecha_emision'),
            plantilla_pdf_id: formData.get('plantilla_pdf_id') || undefined,
            forma_pago: formData.get('forma_pago'),
            descuento_tipo: formData.get('descuento_tipo') || 'porcentaje',
            descuento_valor: parseFloat(formData.get('descuento_valor') as string) || 0,
            recargo_equivalencia: formData.get('recargo_equivalencia') === 'true',
            recargo_porcentaje: parseFloat(formData.get('recargo_porcentaje') as string) || 5.2,
            retencion_porcentaje: parseFloat(formData.get('retencion_porcentaje') as string) || 0,
            importe_descuento: parseFloat(formData.get('importe_descuento') as string) || 0,
            importe_retencion: parseFloat(formData.get('importe_retencion') as string) || 0,
            subtotal: parseFloat(formData.get('subtotal') as string) || 0,
            base_imponible: parseFloat(formData.get('base_imponible') as string) || 0,
            iva: parseFloat(formData.get('iva') as string) || 0,
            total: parseFloat(formData.get('total') as string) || 0,
            lineas: JSON.parse(formData.get('lineas') as string || '[]'),
            notas: formData.get('notas'),
            divisa: formData.get('divisa') || 'EUR',
            tipo_cambio: parseFloat(formData.get('tipo_cambio') as string) || 1.0,
            es_externa: formData.get('es_externa') === 'true',
            numero_manual: formData.get('numero_manual') as string || undefined,
            archivo_url: formData.get('archivo_url') as string || undefined
        }

        const validatedData = GuardarBorradorSchema.parse(rawData)

        // Obtener número y serie para borrador
        let numero = '000'
        let serieCodigo = ''

        if (validatedData.es_externa) {
            if (!validatedData.serie) throw new Error('La serie es obligatoria para facturas externas')
            // Borrador externa: RESERVAR número ahora (para enviarlo a empresa externa)
            const { numero: numReservado, serieCodigo: cod } = await obtenerSiguienteNumero(
                validatedData.empresa_id,
                validatedData.serie
            )
            numero = numReservado
            serieCodigo = cod
        }

        // Insertar factura
        const { data: factura, error: errorFactura } = await admin.from('facturas')
            .insert({
                empresa_id: validatedData.empresa_id,
                numero: numero,
                serie: (serieCodigo || null) as any, 
                serie_id: (validatedData.serie || null) as any,
                cliente_id: validatedData.cliente_id,
                fecha_emision: validatedData.fecha_emision,
                subtotal: validatedData.subtotal,
                plantilla_pdf_id: (validatedData.plantilla_pdf_id || null) as any,
                descuento_tipo: validatedData.descuento_tipo as any,
                descuento_valor: validatedData.descuento_valor,
                recargo_equivalencia: validatedData.recargo_equivalencia,
                recargo_porcentaje: validatedData.recargo_porcentaje,
                retencion_porcentaje: validatedData.retencion_porcentaje,
                es_externa: validatedData.es_externa,
                numero_manual: (validatedData.numero_manual || null) as any,
                archivo_url: (validatedData.archivo_url || null) as any,
                base_imponible: validatedData.base_imponible,
                iva: validatedData.iva,
                total: validatedData.total,
                importe_descuento: validatedData.importe_descuento ?? 0,
                importe_retencion: validatedData.importe_retencion ?? 0,
                divisa: validatedData.divisa as any,
                tipo_cambio: validatedData.tipo_cambio,
                estado: 'borrador' as any,
                notas: validatedData.notas as any,
            } as any)
            .select()
            .single()

        if (errorFactura || !factura) {
            console.error('Error insertando factura:', errorFactura)
            throw new Error('Error al crear factura: ' + errorFactura?.message)
        }

        // Insertar líneas
        const lineasConFacturaId = validatedData.lineas.map((linea) => ({
            factura_id: factura.id,
            concepto: linea.concepto,
            descripcion: linea.descripcion,
            cantidad: linea.cantidad,
            precio_unitario: linea.precio_unitario,
            descuento_porcentaje: linea.descuento_porcentaje,
            iva_porcentaje: linea.iva_porcentaje,
            subtotal:
                linea.cantidad * linea.precio_unitario * (1 - linea.descuento_porcentaje / 100),
        }))

        const { error: errorLineas } = await admin
            .from('lineas_factura')
            .insert(lineasConFacturaId)

        if (errorLineas) {
            console.error('Error insertando lineas:', errorLineas)
            throw new Error('Error al insertar líneas: ' + errorLineas.message)
        }

        revalidatePath('/ventas/facturas')

        return { success: true, data: { id: factura.id } }
    } catch (error: unknown) {
        console.error('Error en guardarBorradorAction:', error)
        // Zod Error handling
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

// Crear factura (emitir)
export async function crearFacturaAction(formData: FormData) {
    try {
        const supabase = await createServerClient()
        const admin = createAdminClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('No autenticado')

        // Parse and validate data
        const rawData = {
            empresa_id: formData.get('empresa_id'),
            serie: formData.get('serie'),
            cliente_id: formData.get('cliente_id'),
            fecha_emision: formData.get('fecha_emision'),
            plantilla_pdf_id: formData.get('plantilla_pdf_id') || undefined,
            forma_pago: formData.get('forma_pago'),
            descuento_tipo: formData.get('descuento_tipo') || 'porcentaje',
            descuento_valor: parseFloat(formData.get('descuento_valor') as string) || 0,
            recargo_equivalencia: formData.get('recargo_equivalencia') === 'true',
            recargo_porcentaje: parseFloat(formData.get('recargo_porcentaje') as string) || 5.2,
            retencion_porcentaje: parseFloat(formData.get('retencion_porcentaje') as string) || 0,
            importe_descuento: parseFloat(formData.get('importe_descuento') as string) || 0,
            importe_retencion: parseFloat(formData.get('importe_retencion') as string) || 0,
            subtotal: parseFloat(formData.get('subtotal') as string) || 0,
            base_imponible: parseFloat(formData.get('base_imponible') as string) || 0,
            iva: parseFloat(formData.get('iva') as string) || 0,
            total: parseFloat(formData.get('total') as string) || 0,
            lineas: JSON.parse(formData.get('lineas') as string || '[]'),
            notas: formData.get('notas'),
            divisa: formData.get('divisa') || 'EUR',
            tipo_cambio: parseFloat(formData.get('tipo_cambio') as string) || 1.0,
            es_externa: formData.get('es_externa') === 'true',
            numero_manual: formData.get('numero_manual') as string || undefined,
            archivo_url: formData.get('archivo_url') as string || undefined
        }

        const validatedData = CrearFacturaSchema.parse(rawData)

        // Validar retención según tipo de cliente
        if (validatedData.retencion_porcentaje && validatedData.retencion_porcentaje > 0) {
            const { data: cliente } = await admin
                .from('clientes')
                .select('tipo_cliente') // Assuming tipo_cliente exists as per schema
                .eq('id', validatedData.cliente_id)
                .single()

            if (cliente && 'tipo_cliente' in cliente && cliente.tipo_cliente === 'particular') {
                return { success: false, error: 'No se puede aplicar retención IRPF a particulares' }
            }
        }

        // Obtener número de factura
        const { numero: num, serieCodigo: cod } = await obtenerSiguienteNumero(
            validatedData.empresa_id,
            validatedData.serie as string
        )
        const numero = num
        const serieCodigo = cod

        // Insertar factura
        const { data: factura, error: errorFactura } = await admin
            .from('facturas')
            .insert({
                empresa_id: validatedData.empresa_id,
                numero: numero,
                serie: serieCodigo as any, // Empty if external
                serie_id: (validatedData.serie || null) as any,
                cliente_id: validatedData.cliente_id,
                fecha_emision: validatedData.fecha_emision,
                subtotal: validatedData.subtotal,
                // Nuevos campos
                plantilla_pdf_id: (validatedData.plantilla_pdf_id || null) as any,
                descuento_tipo: validatedData.descuento_tipo as any,
                descuento_valor: validatedData.descuento_valor,
                recargo_equivalencia: validatedData.recargo_equivalencia,
                recargo_porcentaje: validatedData.recargo_porcentaje,
                retencion_porcentaje: validatedData.retencion_porcentaje,
                es_externa: validatedData.es_externa,
                numero_manual: (validatedData.numero_manual || null) as any,
                archivo_url: (validatedData.archivo_url || null) as any,

                base_imponible: validatedData.base_imponible,
                iva: validatedData.iva,
                total: validatedData.total,
                importe_descuento: ('importe_descuento' in validatedData ? Number(validatedData.importe_descuento) : 0),
                importe_retencion: ('importe_retencion' in validatedData ? Number(validatedData.importe_retencion) : 0),
                divisa: validatedData.divisa as any,
                tipo_cambio: validatedData.tipo_cambio,
                estado: 'emitida' as any,
                notas: validatedData.notas as any,
            } as any)
            .select()
            .single()

        if (errorFactura || !factura) {
            console.error('Error insertando factura:', errorFactura)
            throw new Error('Error al crear factura: ' + errorFactura?.message)
        }

        // Insertar líneas
        const lineasConFacturaId = validatedData.lineas.map((linea) => ({
            factura_id: factura.id,
            concepto: linea.concepto,
            descripcion: linea.descripcion,
            cantidad: linea.cantidad,
            precio_unitario: linea.precio_unitario,
            descuento_porcentaje: linea.descuento_porcentaje,
            iva_porcentaje: linea.iva_porcentaje,
            subtotal:
                linea.cantidad * linea.precio_unitario * (1 - linea.descuento_porcentaje / 100),
        }))

        const { error: errorLineas } = await admin
            .from('lineas_factura')
            .insert(lineasConFacturaId)

        if (errorLineas) {
            console.error('Error insertando lineas:', errorLineas)
            throw new Error('Error al insertar líneas: ' + errorLineas.message)
        }

        // Crear notificación usando RPC para mantener el contexto de autenticación
        try {
            await supabase.rpc('crear_notificacion', {
                p_user_id: user.id,
                p_empresa_id: validatedData.empresa_id,
                p_tipo: 'success',
                p_categoria: 'factura',
                p_titulo: 'Nueva factura emitida',
                p_mensaje: `Se ha emitido la factura ${serieCodigo}-${numero} por un total de ${validatedData.total.toFixed(2)}€.`,
                p_enlace: `/ventas/facturas/${factura.id}`,
                p_metadata: {
                    factura_id: factura.id,
                    numero: numero,
                    total: validatedData.total
                }
            })
        } catch (notifError) {
            console.error('[crearFacturaAction] Error creando notificación:', notifError)
        }

        revalidatePath('/ventas/facturas')

        return { success: true, data: { id: factura.id, numero: `${serieCodigo}-${numero}` } }
    } catch (error: unknown) {
        console.error('Error en crearFacturaAction:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

// Editar factura
export async function editarFacturaAction(formData: FormData) {
    try {
        const supabase = await createServerClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('No autenticado')

        // Parse and validate
        const rawData = {
            factura_id: formData.get('factura_id'),
            empresa_id: formData.get('empresa_id'),
            cliente_id: formData.get('cliente_id') || undefined,
            fecha_emision: formData.get('fecha_emision') || undefined,
            notas: formData.get('notas') || undefined,
            serie: formData.get('serie') || undefined,
            lineas: formData.get('lineas') ? JSON.parse(formData.get('lineas') as string) : undefined,
            descuento_tipo: formData.get('descuento_tipo') || undefined,
            descuento_valor: formData.get('descuento_valor') ? parseFloat(formData.get('descuento_valor') as string) : undefined,
            recargo_equivalencia: formData.get('recargo_equivalencia') ? formData.get('recargo_equivalencia') === 'true' : undefined,
            recargo_porcentaje: formData.get('recargo_porcentaje') ? parseFloat(formData.get('recargo_porcentaje') as string) : undefined,
            retencion_porcentaje: formData.get('retencion_porcentaje') ? parseFloat(formData.get('retencion_porcentaje') as string) : undefined,
            plantilla_pdf_id: formData.get('plantilla_pdf_id') || undefined,
            divisa: formData.get('divisa') || undefined,
            tipo_cambio: formData.get('tipo_cambio') ? parseFloat(formData.get('tipo_cambio') as string) : undefined,
            archivo_url: formData.get('archivo_url') || undefined,
            es_externa: formData.get('es_externa') === 'true' || undefined, // Only if explicitly sent
        }

        const validatedData = EditarFacturaSchema.parse(rawData)

        const { factura_id, empresa_id, cliente_id, fecha_emision, notas, lineas, archivo_url } = validatedData

        // Verificar que la factura pertenece a la empresa
        const { data, error } = await supabase
            .from('facturas')
            .select('id, empresa_id, estado, fecha_emision, notas, serie_id, cliente_id, descuento_tipo, descuento_valor, recargo_equivalencia, recargo_porcentaje, retencion_porcentaje, plantilla_pdf_id, divisa, tipo_cambio, archivo_url, es_externa')
            .eq('id', factura_id)
            .eq('empresa_id', empresa_id)
            .single()

        const factura = data as Factura | null

        if (error || !factura) throw new Error('Factura no encontrada')
        if (factura.estado === 'anulada') throw new Error('No se puede editar una factura anulada')

        // Validar retención si cambia
        if (validatedData.retencion_porcentaje !== undefined && validatedData.retencion_porcentaje !== null && validatedData.retencion_porcentaje > 0) {
            const { data: cliente } = await supabase
                .from('clientes')
                .select('tipo_cliente')
                .eq('id', factura.cliente_id!)
                .single()

            if (cliente && 'tipo_cliente' in cliente && cliente.tipo_cliente === 'particular') {
                return { success: false, error: 'No se puede aplicar retención IRPF a particulares' }
            }
        }

        // Construir objeto de actualización
        interface FacturaUpdate {
            cliente_id?: string | null
            fecha_emision?: string | null
            notas?: string | null
            serie_id?: string | null
            serie?: string | null
            subtotal?: number | null
            descuento_tipo?: string | null
            descuento_valor?: number | null
            recargo_equivalencia?: boolean | null
            recargo_porcentaje?: number | null
            retencion_porcentaje?: number | null
            plantilla_pdf_id?: string | null
            divisa?: string | null
            tipo_cambio?: number | null
            updated_at?: string | null
        }

        const updates: FacturaUpdate = {}
        const cambios: string[] = []

        if (validatedData.plantilla_pdf_id !== undefined && validatedData.plantilla_pdf_id !== factura.plantilla_pdf_id) {
            updates.plantilla_pdf_id = validatedData.plantilla_pdf_id
            cambios.push(`Plantilla PDF actualizada`)
        }

        if (notas !== undefined && notas !== (factura.notas || '')) {
            updates.notas = notas
            cambios.push(`Notas actualizadas`)
        }

        if (archivo_url !== undefined && archivo_url !== (factura.archivo_url || null)) {
            (updates as FacturaUpdate & { archivo_url?: string | null }).archivo_url = archivo_url
            cambios.push(`PDF actualizado`)
        }

        // Handle Draft Full Edit (Lines & Series & Financials)
        // También permitir edición completa si es factura externa emitida (datos pendientes de empresa externa)
        const puedeEditarCompleto = factura.estado === 'borrador' || (factura.es_externa && factura.estado === 'emitida')
        if (puedeEditarCompleto) {
            if (cliente_id && cliente_id !== factura.cliente_id) {
                updates.cliente_id = cliente_id
                cambios.push(`Cliente actualizado`)
            }
            if (fecha_emision && fecha_emision !== factura.fecha_emision) {
                updates.fecha_emision = fecha_emision
                cambios.push(`Fecha de emisión actualizada`)
            }
            if (validatedData.serie && validatedData.serie !== factura.serie_id) {
                updates.serie_id = validatedData.serie
                // Obtener el código de la nueva serie
                const { data: s } = await supabase
                    .from('series_facturacion')
                    .select('codigo')
                    .eq('id', validatedData.serie)
                    .single()
                if (s) updates.serie = s.codigo
                cambios.push(`Serie actualizada`)
            }

            // Update financial fields if provided and passed validation
            if (validatedData.descuento_tipo && validatedData.descuento_tipo !== factura.descuento_tipo) {
                updates.descuento_tipo = validatedData.descuento_tipo
                cambios.push('Tipo de descuento actualizado')
            }
            if (validatedData.descuento_valor !== undefined && validatedData.descuento_valor !== factura.descuento_valor) {
                updates.descuento_valor = validatedData.descuento_valor
                cambios.push('Valor de descuento actualizado')
            }
            if (validatedData.recargo_equivalencia !== undefined && validatedData.recargo_equivalencia !== factura.recargo_equivalencia) {
                updates.recargo_equivalencia = validatedData.recargo_equivalencia
                cambios.push('Recargo equivalencia actualizado')
            }
            if (validatedData.recargo_porcentaje !== undefined && validatedData.recargo_porcentaje !== factura.recargo_porcentaje) {
                updates.recargo_porcentaje = validatedData.recargo_porcentaje
                cambios.push('Porcentaje recargo actualizado')
            }
            if (validatedData.retencion_porcentaje !== undefined && validatedData.retencion_porcentaje !== factura.retencion_porcentaje) {
                updates.retencion_porcentaje = validatedData.retencion_porcentaje
                cambios.push('Retención IRPF actualizada')
            }
            if (validatedData.divisa !== undefined && validatedData.divisa !== factura.divisa) {
                updates.divisa = validatedData.divisa
                cambios.push('Divisa actualizada')
            }
            if (validatedData.tipo_cambio !== undefined && validatedData.tipo_cambio !== factura.tipo_cambio) {
                updates.tipo_cambio = validatedData.tipo_cambio
                cambios.push('Tipo de cambio actualizado')
            }

            if (lineas) {
                // 1. Delete existing lines
                await supabase.from('lineas_factura').delete().eq('factura_id', factura_id)

                // 2. Insert new lines
                const lineasConFacturaId = lineas.map((linea: LineaFactura) => ({
                    factura_id: factura_id,
                    concepto: linea.concepto,
                    descripcion: linea.descripcion,
                    cantidad: linea.cantidad,
                    precio_unitario: linea.precio_unitario,
                    descuento_porcentaje: linea.descuento_porcentaje,
                    iva_porcentaje: linea.iva_porcentaje,
                    subtotal: linea.cantidad * linea.precio_unitario * (1 - linea.descuento_porcentaje / 100),
                }))

                await supabase.from('lineas_factura').insert(lineasConFacturaId)
                cambios.push('Líneas de factura actualizadas')

                // Recalculate totals (handled by DB trigger, but we set updated_at here to ensure it fires or just for timestamp)
                // Actually trigger on lineas_factura updates invoice updated_at which fires calculating trigger.
                // But we are also potentially updating invoice fields in same transaction/request?
                // If we update invoice fields here, trigger will fire.
            }

            // Should ensure updated_at is set if any changes
            if (Object.keys(updates).length > 0 || (lineas && lineas.length > 0)) {
                updates.updated_at = new Date().toISOString()
            }

            if (Object.keys(updates).length === 0 && cambios.length === 0) {
                return { success: true, message: 'No hay cambios' }
            }

            // Actualizar factura
            const { error: errorUpdate } = await supabase
                .from('facturas')
                .update(updates as unknown as import('@/types/supabase').Database['public']['Tables']['facturas']['Update'])
                .eq('id', factura_id)

            if (errorUpdate) throw errorUpdate

            // Registrar evento
            if (cambios.length > 0) {
                await supabase.from('eventos_factura').insert({
                    factura_id: factura_id,
                    tipo: 'modificado',
                    descripcion: cambios.join(', '),
                    user_id: user.id,
                })
            }

            revalidatePath(`/ventas/facturas/${factura_id}`)
            revalidatePath('/ventas/facturas')

            return { success: true }
        }
    } catch (error: unknown) {
        console.error('Error editarFacturaAction:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

// Emitir factura desde borrador
export async function emitirDesdeBorradorAction(facturaId: string) {
    try {
        const supabase = await createServerClient()
        const { empresaId: contextEmpresaId, rol } = await getUserContext()
        const isGlobal = !contextEmpresaId && rol === 'admin'

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No autenticado')
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('empresa_id')
            .eq('user_id', user.id)
            .single()

        // En Vision Global no filtrar por empresa; si no, usar perfil o context
        const empresaFiltro = isGlobal ? undefined : (contextEmpresaId || perfil?.empresa_id)
        if (!empresaFiltro && !isGlobal) throw new Error('Usuario sin empresa')

        let query = supabase
            .from('facturas')
            .select('id, empresa_id, serie_id, estado, es_externa, archivo_url, numero, serie')
            .eq('id', facturaId)
        if (empresaFiltro) query = query.eq('empresa_id', empresaFiltro)
        const { data, error: errFactura } = await query.single()
        const factura = data as Factura | null

        if (errFactura || !factura) throw new Error('Factura no encontrada')
        if (factura.estado !== 'borrador') throw new Error('Solo se pueden emitir facturas en borrador')

        // Validar PDF si es externa
        if (factura.es_externa && !factura.archivo_url) {
            throw new Error('Debes subir el PDF de la factura externa antes de emitirla. Edita la factura para añadir el archivo.')
        }

        if (!factura.serie_id) throw new Error('La factura debe tener una serie asignada')

        let numero = factura.numero
        let serieCodigo = factura.serie

        // Externa con número ya reservado (≠'000'): usar el que tiene. Si no, generar nuevo.
        if (!factura.es_externa || (factura.es_externa && numero === '000')) {
            const { numero: n, serieCodigo: sc } = await obtenerSiguienteNumero(
                factura.empresa_id,
                factura.serie_id
            )
            numero = n
            serieCodigo = sc
        }

        const { error: errUpdate } = await supabase
            .from('facturas')
            .update({
                numero,
                serie: serieCodigo,
                estado: 'emitida',
                updated_at: new Date().toISOString(),
            })
            .eq('id', facturaId)

        if (errUpdate) throw errUpdate

        // El evento "Factura emitida" se crea automáticamente por el trigger trigger_evento_factura al actualizar estado

        revalidatePath(`/ventas/facturas/${facturaId}`)
        revalidatePath('/ventas/facturas')

        return { success: true, data: { numero: `${serieCodigo}-${numero}` } }
    } catch (error: unknown) {
        console.error('Error emitirDesdeBorradorAction:', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function anularFacturaAction(formData: FormData) {
    try {
        const supabase = await createServerClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('No autenticado')

        // Parse and validate
        const rawData = {
            facturaId: formData.get('factura_id'),
            motivo: formData.get('motivo'),
        }

        const validatedData = AnularFacturaSchema.parse(rawData)
        const { facturaId, motivo } = validatedData

        const descripcion = formData.get('descripcion') as string
        const notificarCliente = formData.get('notificar_cliente') === 'true'
        const generarAsiento = formData.get('generar_asiento') === 'true'

        // Obtener perfil para validar empresa
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('empresa_id')
            .eq('user_id', user.id)
            .single()

        if (!perfil) throw new Error('Usuario sin empresa')

        // Verificar que la factura existe y pertenece a la empresa
        const { data: factura, error: errorFactura } = await supabase
            .from('facturas')
            .select('id, empresa_id, estado, serie_id, numero, total')
            .eq('id', facturaId)
            .eq('empresa_id', perfil.empresa_id!)
            .single()

        if (errorFactura || !factura) {
            throw new Error('Factura no encontrada')
        }

        // Validaciones de negocio
        if ('estado' in factura && factura.estado === 'anulada') {
            throw new Error('Esta factura ya está anulada')
        }

        // Facturas pagadas SÍ se pueden anular (el flujo correcto es: pagada → anular → eliminar si se desea)

        // Actualizar estado a anulada
        const { error: errorUpdate } = await supabase
            .from('facturas')
            .update({
                estado: 'anulada',
                updated_at: new Date().toISOString(),
            })
            .eq('id', facturaId)

        if (errorUpdate) throw errorUpdate

        // Registrar evento de anulación
        const motivosMap: Record<string, string> = {
            error_cliente: 'Error en los datos del cliente',
            error_importes: 'Error en importes o cantidades',
            duplicada: 'Duplicada por error',
            cancelacion_servicio: 'Cancelación del servicio',
            solicitud_cliente: 'Solicitud del cliente',
            otro: 'Otro motivo',
        }

        const motivoTexto = motivosMap[motivo] || motivo

        const descripcionEvento = descripcion
            ? `Factura anulada: ${motivoTexto}. ${descripcion}`
            : `Factura anulada: ${motivoTexto}`

        await supabase.from('eventos_factura').insert({
            factura_id: facturaId,
            tipo: 'anulada',
            descripcion: descripcionEvento,
            metadata: {
                motivo,
                descripcion,
                notificar_cliente: notificarCliente,
                generar_asiento: generarAsiento,
            },
            user_id: user.id,
        })

        revalidatePath(`/ventas/facturas/${facturaId}`)
        revalidatePath('/ventas/facturas')

        return { success: true }
    } catch (error: unknown) {
        console.error('Error anularFacturaAction:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

export async function duplicarFacturaAction(formData: FormData) {
    try {
        const supabase = await createServerClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('No autenticado')

        // Parse and validate
        const rawData = {
            facturaIdOriginal: formData.get('factura_id_original'),
            fechaEmision: formData.get('fecha_emision'),
            serie: formData.get('serie'),
            mantenerCliente: formData.get('mantener_cliente') === 'true',
        }

        const validatedData = DuplicarFacturaSchema.parse(rawData)
        const { facturaIdOriginal, fechaEmision, serie, mantenerCliente } = validatedData

        interface FacturaOriginal extends Factura {
            lineas: LineaFacturaDB[]
        }

        const copiarLineas = formData.get('copiar_lineas') === 'true'
        const copiarNotas = formData.get('copiar_notas') === 'true'


        // Obtener perfil
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('empresa_id')
            .eq('user_id', user.id)
            .single()

        if (!perfil) throw new Error('Usuario sin empresa')

        // Cargar factura original con líneas
        const { data: rawFacturaOriginal, error: errorFactura } = await supabase
            .from('facturas')
            .select(
                `
        *,
        lineas:lineas_factura(*)
      `
            )
            .eq('id', facturaIdOriginal)
            .eq('empresa_id', perfil.empresa_id!)
            .single()

        const facturaOriginal = rawFacturaOriginal as unknown as FacturaOriginal

        if (errorFactura || !facturaOriginal) {
            throw new Error('Factura original no encontrada')
        }

        if (!perfil.empresa_id) throw new Error('Empresa ID no encontrado')

        const empresaId = perfil.empresa_id
        // Generar número mediante RPC
        const { numero } = await obtenerSiguienteNumero(empresaId, serie)


        // Crear nueva factura
        // Crear nueva factura
        interface FacturaInsert {
            empresa_id: string
            serie_id: string
            numero: string
            cliente_id: string | null
            fecha_emision: string
            subtotal: number
            // Nuevos campos
            descuento_tipo: string
            descuento_valor: number
            recargo_equivalencia: boolean
            recargo_porcentaje: number
            retencion_porcentaje: number

            base_imponible: number
            iva: number
            total: number
            estado: 'borrador' | 'emitida' | 'pagada' | 'vencida' | 'anulada'
            notas: string | null
        }

        const nuevaFactura: FacturaInsert = {
            empresa_id: perfil.empresa_id,
            serie_id: serie,
            numero: numero,
            cliente_id: mantenerCliente ? facturaOriginal.cliente_id : null,
            fecha_emision: fechaEmision,
            subtotal: copiarLineas ? facturaOriginal.subtotal : 0,

            descuento_tipo: facturaOriginal.descuento_tipo || 'porcentaje',
            descuento_valor: facturaOriginal.descuento_valor || 0,
            recargo_equivalencia: facturaOriginal.recargo_equivalencia || false,
            recargo_porcentaje: facturaOriginal.recargo_porcentaje || 5.2,
            retencion_porcentaje: facturaOriginal.retencion_porcentaje || 0,

            base_imponible: copiarLineas ? facturaOriginal.base_imponible : 0,
            iva: copiarLineas ? facturaOriginal.iva : 0,
            total: copiarLineas ? facturaOriginal.total : 0,
            estado: 'borrador', // Always draft initially
            notas: copiarNotas ? facturaOriginal.notas : null,
        }

        const { data: facturaCreada, error: errorCrear } = await supabase
            .from('facturas')
            .insert(nuevaFactura as unknown as import('@/types/supabase').Database['public']['Tables']['facturas']['Insert'])
            .select()
            .single()

        if (errorCrear || !facturaCreada) {
            throw new Error('Error al crear la factura duplicada')
        }

        // Copiar líneas si está activado
        if (copiarLineas && facturaOriginal.lineas && facturaOriginal.lineas.length > 0) {
            const lineasNuevas = facturaOriginal.lineas.map((linea) => ({
                factura_id: facturaCreada.id,
                concepto: linea.concepto,
                descripcion: linea.descripcion,
                cantidad: linea.cantidad,
                precio_unitario: linea.precio_unitario,
                descuento_porcentaje: linea.descuento_porcentaje,
                iva_porcentaje: linea.iva_porcentaje,
                subtotal: linea.subtotal,
            }))

            const { error: errorLineas } = await supabase.from('lineas_factura').insert(lineasNuevas)

            if (errorLineas) {
                console.error('Error al copiar líneas:', errorLineas)
            }
        }

        // Registrar evento
        await supabase.from('eventos_factura').insert({
            factura_id: facturaCreada.id,
            tipo: 'creado',
            descripcion: `Factura duplicada`,
            user_id: user.id,
        })

        revalidatePath('/ventas/facturas')

        return { success: true, data: { id: facturaCreada.id } }
    } catch (error: unknown) {
        console.error('Error duplicarFacturaAction:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        const message = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: message }
    }
}

// Eliminar factura
export async function eliminarFacturaAction(facturaId: string) {
    try {
        const supabase = await createServerClient()
        const { empresaId: contextEmpresaId, rol } = await getUserContext()
        const isGlobal = !contextEmpresaId && rol === 'admin'

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No autenticado')
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('empresa_id')
            .eq('user_id', user.id)
            .single()

        const empresaFiltro = isGlobal ? undefined : (contextEmpresaId || perfil?.empresa_id)
        if (!empresaFiltro && !isGlobal) throw new Error('Usuario sin empresa')

        let query = supabase
            .from('facturas')
            .select('id, empresa_id, estado, serie, numero, total, serie_id, es_externa')
            .eq('id', facturaId)
        if (empresaFiltro) query = query.eq('empresa_id', empresaFiltro)
        const { data: factura, error: errorFactura } = await query.single()

        if (errorFactura || !factura) {
            return { success: false, error: 'Factura no encontrada o no tienes permisos' }
        }

        // No permitir eliminar facturas pagadas
        if ('estado' in factura && factura.estado === 'pagada') {
            return { success: false, error: 'No se puede eliminar una factura pagada. Anúlala primero si necesitas descartarla.' }
        }

        // Verificar e impedir si hay rectificativas asociadas (si esta es la original)
        const { count: rectificativasCount } = await supabase
            .from('facturas')
            .select('id', { count: 'exact', head: true })
            .eq('factura_rectificada_id', facturaId)

        if (rectificativasCount && rectificativasCount > 0) {
            return { success: false, error: 'No se puede eliminar: esta factura tiene una factura rectificativa asociada. Elimina la rectificativa primero.' }
        }

        // Liberar número si es borrador externa con número reservado (para que quede libre para la siguiente)
        if ('estado' in factura && factura.estado === 'borrador' && 'es_externa' in factura && factura.es_externa && 'serie_id' in factura && factura.serie_id && 'numero' in factura && factura.numero !== '000') {
            await liberarNumeroSerie(String(factura.serie_id))
        }

        // 1. Eliminar líneas de factura
        await supabase.from('lineas_factura').delete().eq('factura_id', facturaId)

        // 2. Eliminar eventos de factura
        await supabase.from('eventos_factura').delete().eq('factura_id', facturaId)

        // 3. Eliminar pagos de factura (tabla moderna)
        await supabase.from('pagos_factura').delete().eq('factura_id', facturaId)

        // 4. Eliminar emails de factura
        await supabase.from('emails_factura').delete().eq('factura_id', facturaId)

        // 5. Eliminar recordatorios
        await supabase.from('recordatorios').delete().eq('factura_id', facturaId)

        // 6. Check legacy 'pagos' table and delete if exists
        const { count: legacyPagosCount } = await supabase
            .from('pagos')
            .select('id', { count: 'exact', head: true })
            .eq('factura_id', facturaId)

        if (legacyPagosCount && legacyPagosCount > 0) {
            await supabase.from('pagos').delete().eq('factura_id', facturaId)
        }

        // 7. Eliminar la factura
        const deleteQuery = supabase.from('facturas').delete({ count: 'exact' }).eq('id', facturaId)
        const finalQuery = empresaFiltro ? deleteQuery.eq('empresa_id', empresaFiltro) : deleteQuery
        const { error: errorDelete, count } = await finalQuery

        if (errorDelete) {
            console.error('[eliminarFacturaAction] Delete error:', errorDelete)
            if (errorDelete.code === '23503' || errorDelete.message?.includes('foreign key')) {
                return { success: false, error: 'No se puede eliminar: tiene registros asociados (ej. rectificativas o pagos). verifica primero.' }
            }
            return { success: false, error: `Error al eliminar: ${errorDelete.message}` }
        }

        if (count === 0) {
            return { success: false, error: 'No se pudo eliminar la factura. Puede que ya no exista o no tengas permisos.' }
        }

        revalidatePath('/ventas/facturas')
        return { success: true }
    } catch (error: unknown) {
        console.error('[eliminarFacturaAction]', error)
        return { success: false, error: error instanceof Error ? error.message : 'Error al eliminar la factura' }
    }
}
