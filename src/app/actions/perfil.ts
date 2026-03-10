'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { auditLog } from '@/lib/security/audit-log'

/**
 * Actualizar nombre de perfil (user_metadata.full_name en Supabase Auth)
 */
export async function actualizarNombrePerfilAction(nombre: string) {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const trimmed = (nombre || '').trim()
        if (!trimmed) return { success: false, error: 'El nombre no puede estar vacío' }
        if (trimmed.length > 100) return { success: false, error: 'Nombre demasiado largo' }

        const { error } = await supabase.auth.updateUser({
            data: { full_name: trimmed },
        })

        if (error) {
            console.error('[actualizarNombrePerfilAction]', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/perfil')
        return { success: true }
    } catch (e: any) {
        console.error('[actualizarNombrePerfilAction]', e)
        return { success: false, error: e?.message || 'Error al actualizar' }
    }
}

/**
 * Subir avatar a Supabase Storage (bucket avatars) y actualizar user_metadata
 * @param formData con campo "file" (File)
 */
export async function subirAvatarPerfilAction(formData: FormData) {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const file = formData.get('file') as File | null
        if (!file || !(file instanceof File)) return { success: false, error: 'No se recibió archivo' }

        const allowed = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowed.includes(file.type)) {
            return { success: false, error: 'Formato no permitido. Usa JPEG, PNG o WebP.' }
        }
        if (file.size > 2 * 1024 * 1024) {
            return { success: false, error: 'El archivo no puede superar 2 MB.' }
        }

        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${user.id}/avatar.${ext}`

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(path, file, { upsert: true, cacheControl: '3600' })

        if (uploadError) {
            console.error('[subirAvatarPerfilAction] upload', uploadError)
            return { success: false, error: uploadError.message }
        }

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        const urlWithCacheBust = `${publicUrl}?v=${Date.now()}`

        const { error: updateError } = await supabase.auth.updateUser({
            data: { avatar_url: urlWithCacheBust },
        })

        if (updateError) {
            console.error('[subirAvatarPerfilAction] updateUser', updateError)
            return { success: false, error: updateError.message }
        }

        auditLog('avatar_upload', user.id, {})
        revalidatePath('/perfil')
        return { success: true, data: { url: urlWithCacheBust } }
    } catch (e: any) {
        console.error('[subirAvatarPerfilAction]', e)
        return { success: false, error: e?.message || 'Error al subir avatar' }
    }
}

/**
 * Eliminar avatar de Storage y user_metadata
 */
export async function eliminarAvatarPerfilAction() {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data: files } = await supabase.storage
            .from('avatars')
            .list(user.id)

        if (files?.length) {
            const toRemove = files.map((f) => `${user.id}/${f.name}`)
            await supabase.storage.from('avatars').remove(toRemove)
        }

        await supabase.auth.updateUser({
            data: { avatar_url: null },
        })

        auditLog('avatar_delete', user.id, {})
        revalidatePath('/perfil')
        return { success: true }
    } catch (e: any) {
        console.error('[eliminarAvatarPerfilAction]', e)
        return { success: false, error: e?.message || 'Error al eliminar avatar' }
    }
}
