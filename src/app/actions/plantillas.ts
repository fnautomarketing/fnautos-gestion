'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { plantillaSchema } from '@/lib/validations/plantilla-schema'

/**
 * Helper para obtener empresa_id del usuario autenticado
 * Siguiendo el patrón establecido en series.ts
 */
async function getEmpresaId() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

    if (!perfil?.empresa_id) throw new Error('Usuario sin empresa')
    return { supabase, empresaId: perfil.empresa_id }
}

/**
 * Crear nueva plantilla PDF
 */
export async function crearPlantillaAction(formData: FormData) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        const rawData = Object.fromEntries(formData.entries())

        // Parsear campos especiales
        const dataToValidate = {
            ...rawData,
            idiomas: JSON.parse(rawData.idiomas as string || '["es"]'),
            logo_ancho: Number(rawData.logo_ancho) || 120,
            logo_alto: Number(rawData.logo_alto) || 60,
            tamano_fuente_base: Number(rawData.tamano_fuente_base) || 10,
            mostrar_numero_factura: rawData.mostrar_numero_factura === 'true',
            mostrar_fecha_emision: rawData.mostrar_fecha_emision === 'true',
            mostrar_fecha_vencimiento: rawData.mostrar_fecha_vencimiento === 'true',
            mostrar_datos_bancarios: rawData.mostrar_datos_bancarios === 'true',
            mostrar_notas: rawData.mostrar_notas === 'true',
            mostrar_qr_pago: rawData.mostrar_qr_pago === 'true',
            alternar_color_filas: rawData.alternar_color_filas === 'true',
            mostrar_firma: rawData.mostrar_firma === 'true',
            mostrar_sello: rawData.mostrar_sello === 'true',
            activa: rawData.activa === 'true',
            predeterminada: rawData.predeterminada === 'true',
        }

        const validated = plantillaSchema.parse(dataToValidate)

        // Si se marca como predeterminada, desactivar otras
        if (validated.predeterminada) {
            await supabase
                .from('plantillas_pdf')
                .update({ predeterminada: false })
                .eq('empresa_id', empresaId)
        }

        const { data, error } = await supabase
            .from('plantillas_pdf')
            .insert({
                ...validated,
                empresa_id: empresaId,
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/ventas/configuracion/plantillas')
        return { success: true, data }
    } catch (error: any) {
        console.error('[crearPlantillaAction]', error)
        const message = error.errors ? error.errors[0].message : error.message
        return { success: false, error: message }
    }
}

/**
 * Actualizar plantilla PDF existente
 */
export async function actualizarPlantillaAction(plantillaId: string, formData: FormData) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        const rawData = Object.fromEntries(formData.entries())

        const dataToValidate = {
            ...rawData,
            idiomas: JSON.parse(rawData.idiomas as string || '["es"]'),
            logo_ancho: Number(rawData.logo_ancho) || 120,
            logo_alto: Number(rawData.logo_alto) || 60,
            tamano_fuente_base: Number(rawData.tamano_fuente_base) || 10,
            mostrar_numero_factura: rawData.mostrar_numero_factura === 'true',
            mostrar_fecha_emision: rawData.mostrar_fecha_emision === 'true',
            mostrar_fecha_vencimiento: rawData.mostrar_fecha_vencimiento === 'true',
            mostrar_datos_bancarios: rawData.mostrar_datos_bancarios === 'true',
            mostrar_notas: rawData.mostrar_notas === 'true',
            mostrar_qr_pago: rawData.mostrar_qr_pago === 'true',
            alternar_color_filas: rawData.alternar_color_filas === 'true',
            mostrar_firma: rawData.mostrar_firma === 'true',
            mostrar_sello: rawData.mostrar_sello === 'true',
            activa: rawData.activa === 'true',
            predeterminada: rawData.predeterminada === 'true',
        }

        const validated = plantillaSchema.parse(dataToValidate)

        // Si se marca como predeterminada, desactivar otras
        if (validated.predeterminada) {
            await supabase
                .from('plantillas_pdf')
                .update({ predeterminada: false })
                .eq('empresa_id', empresaId)
                .neq('id', plantillaId)
        }

        const { data, error } = await supabase
            .from('plantillas_pdf')
            .update(validated)
            .eq('id', plantillaId)
            .eq('empresa_id', empresaId)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/ventas/configuracion/plantillas')
        return { success: true, data }
    } catch (error: any) {
        console.error('[actualizarPlantillaAction]', error)
        const message = error.errors ? error.errors[0].message : error.message
        return { success: false, error: message }
    }
}

/**
 * Subir logo a Supabase Storage
 */
export async function subirLogoAction(formData: FormData) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        const file = formData.get('logo') as File
        if (!file) throw new Error('No se proporcionó archivo')

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            throw new Error('Solo se permiten imágenes')
        }

        // Validar tamaño (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            throw new Error('El logo no puede superar 2MB')
        }

        // Subir a Supabase Storage
        const fileName = `${empresaId}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
            .from('logos')
            .upload(fileName, file)

        if (uploadError) throw uploadError

        // Obtener URL pública
        const { data: urlData } = supabase.storage
            .from('logos')
            .getPublicUrl(fileName)

        return { success: true, data: { url: urlData.publicUrl } }
    } catch (error: any) {
        console.error('[subirLogoAction]', error)
        return { success: false, error: error.message }
    }
}

/**
 * Eliminar plantilla PDF (no permite eliminar predeterminada)
 */
export async function eliminarPlantillaAction(plantillaId: string) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        // Verificar que no sea predeterminada
        const { data: plantilla } = await supabase
            .from('plantillas_pdf')
            .select('predeterminada')
            .eq('id', plantillaId)
            .single()

        if (plantilla?.predeterminada) {
            return { success: false, error: 'No se puede eliminar la plantilla predeterminada' }
        }

        const { error } = await supabase
            .from('plantillas_pdf')
            .delete()
            .eq('id', plantillaId)
            .eq('empresa_id', empresaId)

        if (error) throw error

        revalidatePath('/ventas/configuracion/plantillas')
        return { success: true }
    } catch (error: any) {
        console.error('[eliminarPlantillaAction]', error)
        return { success: false, error: error.message }
    }
}

/**
 * Establecer plantilla como predeterminada
 */
export async function establecerPredeterminadaAction(plantillaId: string) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        // Desactivar todas como predeterminada
        await supabase
            .from('plantillas_pdf')
            .update({ predeterminada: false })
            .eq('empresa_id', empresaId)

        // Activar esta como predeterminada
        const { error } = await supabase
            .from('plantillas_pdf')
            .update({ predeterminada: true })
            .eq('id', plantillaId)
            .eq('empresa_id', empresaId)

        if (error) throw error

        revalidatePath('/ventas/configuracion/plantillas')
        return { success: true }
    } catch (error: any) {
        console.error('[establecerPredeterminadaAction]', error)
        return { success: false, error: error.message }
    }
}

/**
 * Alternar estado activa/inactiva de plantilla
 */
export async function toggleActivaPlantillaAction(plantillaId: string, activa: boolean) {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        const { error } = await supabase
            .from('plantillas_pdf')
            .update({ activa })
            .eq('id', plantillaId)
            .eq('empresa_id', empresaId)

        if (error) throw error

        revalidatePath('/ventas/configuracion/plantillas')
        return { success: true }
    } catch (error: any) {
        console.error('[toggleActivaPlantillaAction]', error)
        return { success: false, error: error.message }
    }
}
