'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ╔══════════════════════════════════════════════════════════╗
// ║  Acciones de servidor — Firma de empresa                ║
// ║  Gestiona la imagen de firma de la empresa en          ║
// ║  Supabase Storage (bucket: empresas)                    ║
// ╚══════════════════════════════════════════════════════════╝

/**
 * Sube una imagen de firma de empresa a Supabase Storage
 * y actualiza el campo firma_url en la tabla empresas.
 */
export async function subirFirmaEmpresaAction(empresaId: string, formData: FormData) {
    const supabase = await createServerClient()

    try {
        // 1. Verificación de autenticación
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        // 2. Verificación de rol
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('user_id', user.id)
            .single()

        if (perfil?.rol !== 'admin') {
            return { success: false, error: 'Se requieren permisos de administrador' }
        }

        // 3. Validación del archivo
        const file = formData.get('firma') as File
        if (!file) {
            return { success: false, error: 'Archivo de firma no encontrado' }
        }

        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return { success: false, error: 'Formato no permitido. Use PNG, JPG o WEBP' }
        }

        if (file.size > 2 * 1024 * 1024) {
            return { success: false, error: 'La imagen no debe superar los 2MB' }
        }

        // 4. Usar Admin Client para bypass RLS
        const adminSupabase = createAdminClient()

        // 5. Eliminar firma anterior si existe
        const { data: empresa } = await adminSupabase
            .from('empresas')
            .select('firma_url')
            .eq('id', empresaId)
            .single()

        if (empresa?.firma_url) {
            // Extraer path del archivo desde la URL pública
            const urlParts = empresa.firma_url.split('/storage/v1/object/public/empresas/')
            if (urlParts.length > 1) {
                await adminSupabase.storage.from('empresas').remove([urlParts[1]])
            }
        }

        // 6. Subir nueva firma
        const fileExt = file.name.split('.').pop() || 'png'
        const fileName = `${empresaId}/firma-${Date.now()}.${fileExt}`

        const { error: uploadError } = await adminSupabase.storage
            .from('empresas')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true,
            })

        if (uploadError) throw uploadError

        // 7. Obtener URL pública
        const { data: { publicUrl } } = adminSupabase.storage
            .from('empresas')
            .getPublicUrl(fileName)

        // 8. Actualizar campo firma_url en la tabla empresas
        const { error: updateError } = await adminSupabase
            .from('empresas')
            .update({
                firma_url: publicUrl,
                updated_at: new Date().toISOString(),
            })
            .eq('id', empresaId)

        if (updateError) throw updateError

        revalidatePath('/ventas/configuracion/empresa')
        return { success: true, data: { url: publicUrl } }
    } catch (error: unknown) {
        const err = error as Record<string, unknown> | null
        console.error('[subirFirmaEmpresaAction] Error:', error)
        return {
            success: false,
            error: (err?.message as string) || 'Error al subir la firma de empresa',
        }
    }
}

/**
 * Elimina la imagen de firma de empresa de Supabase Storage
 * y limpia el campo firma_url en la tabla empresas.
 */
export async function eliminarFirmaEmpresaAction(empresaId: string) {
    const supabase = await createServerClient()

    try {
        // 1. Verificación de autenticación
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        // 2. Verificación de rol
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('user_id', user.id)
            .single()

        if (perfil?.rol !== 'admin') {
            return { success: false, error: 'Se requieren permisos de administrador' }
        }

        const adminSupabase = createAdminClient()

        // 3. Obtener URL actual
        const { data: empresa } = await adminSupabase
            .from('empresas')
            .select('firma_url')
            .eq('id', empresaId)
            .single()

        if (!empresa?.firma_url) {
            return { success: false, error: 'La empresa no tiene una firma configurada' }
        }

        // 4. Eliminar archivo de Storage
        const urlParts = empresa.firma_url.split('/storage/v1/object/public/empresas/')
        if (urlParts.length > 1) {
            const { error: deleteError } = await adminSupabase.storage
                .from('empresas')
                .remove([urlParts[1]])

            if (deleteError) {
                console.error('[eliminarFirmaEmpresaAction] Storage delete error:', deleteError)
            }
        }

        // 5. Limpiar campo en DB
        const { error: updateError } = await adminSupabase
            .from('empresas')
            .update({
                firma_url: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', empresaId)

        if (updateError) throw updateError

        revalidatePath('/ventas/configuracion/empresa')
        return { success: true }
    } catch (error: unknown) {
        const err = error as Record<string, unknown> | null
        console.error('[eliminarFirmaEmpresaAction] Error:', error)
        return {
            success: false,
            error: (err?.message as string) || 'Error al eliminar la firma de empresa',
        }
    }
}
