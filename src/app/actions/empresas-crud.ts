'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

/**
 * Esquema de validación para los datos de una empresa
 */
const cleanNumber = (val: unknown) => {
    if (val === '' || val === null || val === undefined) return undefined
    const str = String(val).replace(',', '.')
    const num = Number(str)
    return isNaN(num) ? undefined : num
}

const EmpresaSchema = z.object({
    razon_social: z.string().min(1, 'La razón social es obligatoria'),
    nombre_comercial: z.string().nullish(),
    cif: z.string().min(5, 'CIF/NIF no válido'),
    tipo_empresa: z.string().default('sl'),
    direccion: z.string().nullish(),
    codigo_postal: z.string().nullish(),
    ciudad: z.string().nullish(),
    provincia: z.string().nullish(),
    pais: z.string().default('España'),
    telefono: z.string().nullish(),
    email: z.string().email('Email no válido').or(z.literal('')).nullish(),
    web: z.string().url('URL no válida').or(z.literal('')).nullish(),
    iban: z.string().nullish(),
    swift: z.string().nullish(),
    banco: z.string().nullish(),
    titular_cuenta: z.string().nullish(),
    iva_predeterminado: z.preprocess(cleanNumber, z.number().default(21)),
    retencion_predeterminada: z.preprocess(cleanNumber, z.number().default(0)),
    regimen_iva: z.string().default('general'),
    aplica_recargo_equivalencia: z.coerce.boolean().default(false),
    recargo_porcentaje: z.preprocess(cleanNumber, z.number().default(5.2)),
    dias_pago_predeterminados: z.preprocess(cleanNumber, z.number().int().default(30)),
    lugar_expedicion: z.string().nullish(),
    pie_factura: z.string().nullish(),
    clausulas_generales: z.string().nullish(),
})

/**
 * Listar todas las empresas (solo para administradores globales)
 * @returns Object con success y datos o error
 */
export async function listarEmpresasAction() {
    const supabase = await createServerClient()

    try {
        // 1. Verificación de Autenticación
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'No autenticado' }
        }

        // 2. Verificación de Rol (Solo admin)
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('user_id', user.id)
            .single()

        if (perfil?.rol !== 'admin') {
            return { success: false, error: 'No tienes permisos de administrador para realizar esta acción' }
        }

        // 3. Ejecución de la lógica
        const { data, error } = await supabase
            .from('empresas')
            .select('id, razon_social, nombre_comercial, cif, logo_url, activo, tipo_empresa, ciudad')
            .is('deleted_at', null)
            .order('razon_social')

        if (error) throw error

        return { success: true, data: data || [] }
    } catch (error) {
        console.error('[listarEmpresasAction] Error inesperado:', error)
        return { success: false, error: 'Error al listar las empresas del sistema' }
    }
}

/**
 * Obtener los detalles de una empresa específica por su ID
 * @param empresaId UUID de la empresa
 */
export async function obtenerEmpresaAction(empresaId: string) {
    const supabase = await createServerClient()

    try {
        // 1. Verificación de Autenticación
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'No autenticado' }
        }

        // 2. Ejecución de la lógica
        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', empresaId)
            .single()

        if (error) throw error

        return { success: true, data }
    } catch (error) {
        console.error(`[obtenerEmpresaAction] Error (ID: ${empresaId}):`, error)
        return { success: false, error: 'No se pudo obtener la información de la empresa' }
    }
}

/**
 * Crea una nueva empresa en el sistema (Solo Admins)
 * @param formData Datos del formulario
 */
export async function crearEmpresaAction(formData: FormData) {
    const supabase = await createServerClient()

    try {
        // 1. Verificación de Autenticación
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'No autenticado' }
        }

        // 2. Verificación de Rol
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('user_id', user.id)
            .single()

        if (perfil?.rol !== 'admin') {
            return { success: false, error: 'No tienes permisos para crear empresas' }
        }

        // 3. Validación de Datos con Zod
        const rawData = Object.fromEntries(formData.entries())
        // Convertir checkbox a boolean
        if (rawData.aplica_recargo_equivalencia === 'on') {
            rawData.aplica_recargo_equivalencia = 'true'
        } else if (!rawData.aplica_recargo_equivalencia) {
            rawData.aplica_recargo_equivalencia = 'false'
        }

        const validated = EmpresaSchema.safeParse(rawData)

        if (!validated.success) {
            return {
                success: false,
                error: 'Datos de empresa inválidos: ' + validated.error.issues.map((e: { message: string }) => e.message).join(', ')
            }
        }

        const datosEmpresa = {
            ...validated.data,
            formato_numero_factura: '{SERIE}-{ANIO}-{NUM}',
            idioma_predeterminado: 'es',
            zona_horaria: 'Europe/Madrid',
            formato_fecha: 'DD/MM/YYYY',
            separador_miles: '.',
            separador_decimales: ',',
            activo: true,
        }

        // 4. Verificación de Duplicados y Reactivación
        const { data: existingCompany } = await supabase
            .from('empresas')
            .select('*')
            .eq('cif', validated.data.cif)
            .maybeSingle()

        if (existingCompany) {
            if ((existingCompany as any).deleted_at) {
                // Reactivar empresa eliminada
                const { data: reactivated, error: reactivationError } = await supabase
                    .from('empresas')
                    .update({
                        ...datosEmpresa,
                        deleted_at: null,
                        updated_at: new Date().toISOString(),
                        activo: true
                    })
                    .eq('id', existingCompany.id)
                    .select()
                    .single()

                if (reactivationError) throw reactivationError

                revalidatePath('/configuracion/empresas')
                return { success: true, data: reactivated }
            } else {
                return { success: false, error: 'Ya existe una empresa activa con este CIF.' }
            }
        }

        // 5. Inserción en DB (Si no existe previa)
        const { data, error } = await supabase
            .from('empresas')
            .insert(datosEmpresa)
            .select()
            .single()

        if (error) throw error

        // 6. Revalidación
        revalidatePath('/configuracion/empresas')

        return { success: true, data }
    } catch (error: any) {
        console.error('[crearEmpresaAction] Error:', error)
        if (error?.code) {
            console.error('[crearEmpresaAction] DB Error Code:', error.code)
            console.error('[crearEmpresaAction] DB Error Details:', error.details)
            console.error('[crearEmpresaAction] DB Error Hint:', error.hint)
        }
        return { success: false, error: error?.message || error?.details || 'Error al crear la empresa en el servidor' }
    }
}

/**
 * Actualiza los datos de una empresa existente (Solo Admins)
 * @param empresaId ID de la empresa a modificar
 * @param formData Nuevos datos
 */
export async function actualizarEmpresaGlobalAction(empresaId: string, formData: FormData) {
    const supabase = await createServerClient()

    try {
        // 1. Verificación de Autenticación
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'No autenticado' }
        }

        // 2. Verificación de Rol
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('user_id', user.id)
            .single()

        if (perfil?.rol !== 'admin') {
            return { success: false, error: 'No tienes permisos para modificar empresas' }
        }

        // 3. Validación de Datos con Zod
        const rawData = Object.fromEntries(formData.entries())
        // Convertir checkbox a boolean
        if (rawData.aplica_recargo_equivalencia === 'on' || rawData.aplica_recargo_equivalencia === 'true') {
            rawData.aplica_recargo_equivalencia = 'true'
        } else {
            rawData.aplica_recargo_equivalencia = 'false'
        }

        // Validar solo los campos presentes (Partial)
        const validated = EmpresaSchema.partial().safeParse(rawData)
        if (!validated.success) {
            console.error('[actualizarEmpresaGlobalAction] Validation Error:', validated.error)
            return {
                success: false,
                error: 'Datos inválidos: ' + validated.error.issues.map((e: { message: string }) => e.message).join(', ')
            }
        }

        const datosActualizados = {
            ...validated.data,
            updated_at: new Date().toISOString(),
        }

        // 4. Actualización en DB
        const { data, error } = await supabase
            .from('empresas')
            .update(datosActualizados)
            .eq('id', empresaId)
            .select()
            .single()

        if (error) throw error

        // 5. Revalidación
        revalidatePath('/configuracion/empresas')

        return { success: true, data }
    } catch (error: any) {
        console.error(`[actualizarEmpresaGlobalAction] Error CRÍTICO (ID: ${empresaId}):`, error)
        if (error?.code) {
            console.error('[actualizarEmpresaGlobalAction] DB Error Code:', error.code)
            console.error('[actualizarEmpresaGlobalAction] DB Error Details:', error.details)
        }
        return { success: false, error: error?.message || error?.details || 'Error al actualizar los datos de la empresa' }
    }
}

/**
 * Elimina una empresa (Soft Delete) si no tiene facturas asociadas (Solo Admins)
 * @param empresaId ID de la empresa a eliminar
 */
export async function eliminarEmpresaAction(empresaId: string, forceDelete: boolean = false) {
    const supabase = await createServerClient()

    try {
        // 1. Verificación de Autenticación
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'No autenticado' }
        }

        // 2. Verificación de Rol
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('user_id', user.id)
            .single()

        if (perfil?.rol !== 'admin') {
            return { success: false, error: 'Acceso denegado: Se requieren permisos de administrador' }
        }

        // 3. Verificación de integridad referencial (Facturas)
        const { count } = await supabase
            .from('facturas')
            .select('*', { count: 'exact', head: true })
            .eq('empresa_id', empresaId)

        if (count && count > 0) {
            if (!forceDelete) {
                return {
                    success: false,
                    error: `No es posible eliminar la empresa: Existen ${count} factura(s) vinculadas.`,
                    invoiceCount: count,
                    canForceDelete: true
                }
            }
            // Si forceDelete es true, continuar con el soft delete
            const { error } = await supabase
                .from('empresas')
                .update({
                    deleted_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    activo: false
                })
                .eq('id', empresaId)

            if (error) throw error
        } else {
            // Si no tiene facturas, intentamos Hard Delete (Borrado definitivo)

            // 1. Eliminamos el logo si existe
            const { data: empresa } = await supabase
                .from('empresas')
                .select('logo_url')
                .eq('id', empresaId)
                .single()

            if (empresa?.logo_url) {
                const logoPath = empresa.logo_url.split('/').slice(-2).join('/')
                await supabase.storage.from('company-logos').remove([logoPath])
            }

            // 2. Borramos el registro de la DB
            const { error: deleteError } = await supabase
                .from('empresas')
                .delete()
                .eq('id', empresaId)

            if (deleteError) {
                // Si falla (ej: por otras FKs como series, clientes, etc), hacemos Fallback a Soft Delete
                console.warn('[eliminarEmpresaAction] Hard Delete failed, falling back to Soft Delete:', deleteError)

                const { error: softDeleteError } = await supabase
                    .from('empresas')
                    .update({
                        deleted_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        activo: false
                    })
                    .eq('id', empresaId)

                if (softDeleteError) throw softDeleteError
            }
        }



        // 5. Revalidación
        revalidatePath('/configuracion/empresas')

        return { success: true }
    } catch (error) {
        console.error(`[eliminarEmpresaAction] Error (ID: ${empresaId}):`, error)
        return { success: false, error: 'Hubo un error al intentar eliminar la empresa' }
    }
}

/**
 * Activa o desactiva una empresa rápidamente (Solo Admins)
 * @param empresaId ID de la empresa
 * @param activo Nuevo estado
 */
export async function toggleEmpresaActivaAction(empresaId: string, activo: boolean) {
    const supabase = await createServerClient()

    try {
        // 1. Auth Check
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Sesión no válida' }
        }

        // 2. Role Check
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('user_id', user.id)
            .single()

        if (perfil?.rol !== 'admin') {
            return { success: false, error: 'Permisos insuficientes' }
        }

        // 3. Ejecución
        const { error } = await supabase
            .from('empresas')
            .update({ activo, updated_at: new Date().toISOString() })
            .eq('id', empresaId)

        if (error) throw error

        // 4. Revalidación
        revalidatePath('/configuracion/empresas')

        return { success: true }
    } catch (error) {
        console.error('[toggleEmpresaActivaAction] Error:', error)
        return { success: false, error: 'Error al cambiar el estado de la empresa' }
    }
}

/**
 * Gestiona la subida de logos de empresa a Supabase Storage (Solo Admins)
 * @param empresaId ID de la empresa
 * @param formData Archivo de imagen
 */
export async function subirLogoEmpresaAction(empresaId: string, formData: FormData) {
    const supabase = await createServerClient()

    try {
        // 1. Auth & Role Check
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autorizado' }

        const { data: perfil } = await supabase.from('perfiles').select('rol').eq('user_id', user.id).single()
        if (perfil?.rol !== 'admin') return { success: false, error: 'Requiere rol admin' }

        // 2. Validación de Archivo
        const file = formData.get('logo') as File
        if (!file) {
            return { success: false, error: 'Archivo no encontrado en la solicitud' }
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return { success: false, error: 'Formato no permitido. Use JPG, PNG o WEBP' }
        }

        if (file.size > 2 * 1024 * 1024) {
            return { success: false, error: 'Tamaño excedido. El límite es 2MB' }
        }

        // 3–5. Storage y DB con Admin Client (bypass RLS, evita "new row violates row-level security policy")
        const adminSupabase = createAdminClient()

        // 3. Limpieza de logo anterior
        const { data: empresa } = await adminSupabase
            .from('empresas')
            .select('logo_url')
            .eq('id', empresaId)
            .single()

        if (empresa?.logo_url) {
            const oldPath = empresa.logo_url.split('/').slice(-2).join('/')
            await adminSupabase.storage.from('company-logos').remove([oldPath])
        }

        // 4. Subida a Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${empresaId}/logo-${Date.now()}.${fileExt}`

        const { error: uploadError } = await adminSupabase.storage
            .from('company-logos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = adminSupabase.storage
            .from('company-logos')
            .getPublicUrl(fileName)

        // 5. Actualización de referencia en DB
        const { data: updatedRows, error: updateError } = await adminSupabase
            .from('empresas')
            .update({
                logo_url: publicUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', empresaId)
            .select()

        if (updateError) throw updateError

        if (!updatedRows || updatedRows.length === 0) {
            console.error('[subirLogoEmpresaAction] Update failed: 0 rows affected via Admin Client. ID:', empresaId)
            return { success: false, error: 'No se pudo actualizar la empresa. Verifique permisos o existencia.' }
        }

        revalidatePath('/configuracion/empresas')
        return { success: true, data: { url: publicUrl } }
    } catch (error: any) {
        console.error('[subirLogoEmpresaAction] Error:', error)
        if (error?.message === 'Payload too large') {
            return { success: false, error: 'La imagen excede el límite de 4MB permitido.' }
        }
        return { success: false, error: error?.message || 'Error al procesar la subida del logo' }
    }
}

/**
 * Elimina permanentemente el logo de una empresa (Solo Admins)
 * @param empresaId ID de la empresa
 */
export async function eliminarLogoEmpresaAction(empresaId: string) {
    const supabase = await createServerClient()

    try {
        // 1. Auth & Role Check
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data: perfil } = await supabase.from('perfiles').select('rol').eq('user_id', user.id).single()
        if (perfil?.rol !== 'admin') return { success: false, error: 'Sin permisos' }

        // 2–3. Storage y DB con Admin Client (bypass RLS)
        const adminSupabase = createAdminClient()
        const { data: empresa } = await adminSupabase
            .from('empresas')
            .select('logo_url')
            .eq('id', empresaId)
            .single()

        if (!empresa?.logo_url) {
            return { success: false, error: 'La empresa no cuenta con un logo actualmente' }
        }

        const logoPath = empresa.logo_url.split('/').slice(-2).join('/')

        const { error: deleteError } = await adminSupabase.storage
            .from('company-logos')
            .remove([logoPath])

        if (deleteError) throw deleteError
        const { error: updateError } = await adminSupabase
            .from('empresas')
            .update({
                logo_url: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', empresaId)

        if (updateError) throw updateError

        revalidatePath('/configuracion/empresas')
        return { success: true }
    } catch (error) {
        console.error('[eliminarLogoEmpresaAction] Error:', error)
        return { success: false, error: 'Error al eliminar el logo del sistema' }
    }
}
