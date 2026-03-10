'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const parseDataNumber = (val: FormDataEntryValue | null, defaultVal: number) => {
    if (!val) return defaultVal
    const str = String(val).replace(',', '.')
    const num = parseFloat(str)
    return isNaN(num) ? defaultVal : num
}

async function getEmpresaId() {
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No autenticado')

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('empresa_id, rol')
        .eq('user_id', session.user.id)
        .single()

    if (!perfil?.empresa_id) throw new Error('Usuario sin empresa')
    return { supabase, empresaId: perfil.empresa_id, rol: perfil.rol }
}

export async function getEmpresaAction() {
    try {
        const { supabase, empresaId } = await getEmpresaId()

        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', empresaId)
            .single()

        if (error) throw error

        return { success: true, data }
    } catch (error: any) {
        console.error('[getEmpresaAction]', error)
        return { success: false, error: error.message }
    }
}

export async function actualizarEmpresaAction(formData: FormData) {
    try {
        const { supabase, empresaId: empresaIdPerfil, rol } = await getEmpresaId()

        if (rol !== 'administrador' && rol !== 'admin') {
            return { success: false, error: 'No tienes permisos para modificar la empresa' }
        }

        // Usar empresa_id del formulario (empresa activa en el header), fallback al perfil
        const empresaIdForm = (formData.get('empresa_id') as string)?.trim()
        const empresaId = empresaIdForm || empresaIdPerfil

        // Extraer datos del formulario (CIF normalizado: sin espacios, mayúsculas)
        const cifRaw = (formData.get('cif') as string)?.trim()?.toUpperCase() || ''
        const datosEmpresa = {
            razon_social: formData.get('razon_social') as string,
            nombre_comercial: formData.get('nombre_comercial') as string || null,
            cif: cifRaw,
            tipo_empresa: formData.get('tipo_empresa') as string,

            direccion: formData.get('direccion') as string || null,
            codigo_postal: formData.get('codigo_postal') as string || null,
            ciudad: formData.get('ciudad') as string || null,
            provincia: formData.get('provincia') as string || null,
            pais: formData.get('pais') as string || 'España',

            telefono: formData.get('telefono') as string || null,
            email: formData.get('email') as string || null,
            web: formData.get('web') as string || null,

            iban: formData.get('iban') as string || null,
            swift: formData.get('swift') as string || null,
            banco: formData.get('banco') as string || null,
            titular_cuenta: formData.get('titular_cuenta') as string || null,

            iva_predeterminado: parseDataNumber(formData.get('iva_predeterminado'), 21),
            retencion_predeterminada: parseDataNumber(formData.get('retencion_predeterminada'), 0),
            regimen_iva: formData.get('regimen_iva') as string || 'general',
            aplica_recargo_equivalencia: formData.get('aplica_recargo_equivalencia') === 'true' || formData.get('aplica_recargo_equivalencia') === 'on',
            recargo_porcentaje: parseDataNumber(formData.get('recargo_porcentaje'), 5.2),

            serie_predeterminada_id: (() => {
                const v = formData.get('serie_predeterminada_id') as string
                return v && v.trim() ? v : null
            })(),
            dias_pago_predeterminados: Math.max(1, Math.min(365, Math.round(parseDataNumber(formData.get('dias_pago_predeterminados'), 30)))),
            lugar_expedicion: (formData.get('lugar_expedicion') as string)?.trim() || null,
            plantilla_pdf_predeterminada_id: (() => {
                const v = formData.get('plantilla_pdf_predeterminada_id') as string
                return v && v.trim() ? v : null
            })(),

            pie_factura: formData.get('pie_factura') as string || null,
            clausulas_generales: formData.get('clausulas_generales') as string || null,

            updated_at: new Date().toISOString(),
        }

        // Validar CIF (normalizado: trim + mayúsculas)
        if (!datosEmpresa.cif) {
            return { success: false, error: 'El CIF es obligatorio' }
        }
        // Formato: CIF empresa (A-Z + 7 dígitos + control) o NIF persona (8 dígitos + letra)
        const formatoCif = /^[A-Z][0-9]{7}[A-Z0-9]$/.test(datosEmpresa.cif)
        const formatoNif = /^[0-9]{8}[A-Z]$/.test(datosEmpresa.cif)
        if (!formatoCif && !formatoNif) {
            return { success: false, error: 'El CIF/NIF no tiene un formato válido (ej: B12345678 o 12345678Z)' }
        }
        // Solo validar dígito de control vía RPC para formato CIF; NIF se acepta por formato
        if (formatoCif) {
            const { data: empresaActual } = await supabase
                .from('empresas')
                .select('cif')
                .eq('id', empresaId)
                .single()
            const cifSinCambios = empresaActual?.cif && (empresaActual.cif as string).trim().toUpperCase() === datosEmpresa.cif
            if (!cifSinCambios) {
                try {
                    const { data: cifValido } = await supabase.rpc('validar_cif_espanol', {
                        p_cif: datosEmpresa.cif
                    })
                    if (cifValido === false) {
                        return { success: false, error: 'El CIF no supera la validación de dígito de control' }
                    }
                } catch {
                    // Si la RPC falla, confiar en el formato básico
                }
            }
        }

        // Validar IBAN si existe
        if (datosEmpresa.iban) {
            const { data: ibanValido } = await supabase.rpc('validar_iban', {
                p_iban: datosEmpresa.iban
            })

            if (!ibanValido) {
                return { success: false, error: 'El IBAN no es válido' }
            }
        }

        const { data, error } = await supabase
            .from('empresas')
            .update(datosEmpresa)
            .eq('id', empresaId)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/ventas/configuracion/empresa')

        return { success: true, data }
    } catch (error: any) {
        console.error('[actualizarEmpresaAction]', error)
        return { success: false, error: error.message }
    }
}

export async function subirLogoEmpresaAction(formData: FormData) {
    try {
        const { supabase, empresaId, rol } = await getEmpresaId()

        if (rol !== 'administrador' && rol !== 'admin') {
            return { success: false, error: 'No tienes permisos' }
        }

        const file = formData.get('logo') as File
        if (!file) {
            return { success: false, error: 'No se proporcionó archivo' }
        }

        // Validar tipo de archivo (PNG, JPG, JPEG, WEBP - cualquier dimensión)
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return { success: false, error: 'Solo se permiten imágenes PNG, JPG o WEBP' }
        }

        // Validar tamaño (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return { success: false, error: 'El archivo no puede superar 2MB' }
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${empresaId}-logo-${Date.now()}.${fileExt}`
        const filePath = `empresas/${empresaId}/${fileName}`

        // Storage y DB con Admin Client (bypass RLS, evita "new row violates row-level security policy")
        const adminSupabase = createAdminClient()

        // Subir a storage (bucket company-logos)
        const { error: uploadError } = await adminSupabase.storage
            .from('company-logos')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true,
            })

        if (uploadError) throw uploadError

        // Obtener URL pública
        const { data: { publicUrl } } = adminSupabase.storage
            .from('company-logos')
            .getPublicUrl(filePath)

        // Actualizar empresa
        const { error: updateError } = await adminSupabase
            .from('empresas')
            .update({
                logo_url: publicUrl,
                logo_filename: fileName,
                updated_at: new Date().toISOString(),
            })
            .eq('id', empresaId)

        if (updateError) throw updateError

        revalidatePath('/ventas/configuracion/empresa')

        return { success: true, data: { url: publicUrl } }
    } catch (error: any) {
        console.error('[subirLogoEmpresaAction]', error)
        return { success: false, error: error.message }
    }
}

export async function eliminarLogoEmpresaAction() {
    try {
        const { supabase, empresaId, rol } = await getEmpresaId()

        if (rol !== 'administrador' && rol !== 'admin') {
            return { success: false, error: 'No tienes permisos' }
        }

        const adminSupabase = createAdminClient()

        // Obtener logo actual
        const { data: empresa } = await adminSupabase
            .from('empresas')
            .select('logo_filename')
            .eq('id', empresaId)
            .single()

        if (empresa?.logo_filename) {
            const filePath = `empresas/${empresaId}/${empresa.logo_filename}`

            // Eliminar de storage
            await adminSupabase.storage
                .from('company-logos')
                .remove([filePath])
        }

        // Actualizar empresa
        const { error } = await adminSupabase
            .from('empresas')
            .update({
                logo_url: null,
                logo_filename: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', empresaId)

        if (error) throw error

        revalidatePath('/ventas/configuracion/empresa')

        return { success: true }
    } catch (error: any) {
        console.error('[eliminarLogoEmpresaAction]', error)
        return { success: false, error: error.message }
    }
}

// Obtener provincias de España
export async function getProvinciasAction() {
    const provincias = [
        'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila',
        'Badajoz', 'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria',
        'Castellón', 'Ciudad Real', 'Córdoba', 'Cuenca', 'Girona', 'Granada',
        'Guadalajara', 'Guipúzcoa', 'Huelva', 'Huesca', 'Islas Baleares',
        'Jaén', 'La Coruña', 'La Rioja', 'Las Palmas', 'León', 'Lérida',
        'Lugo', 'Madrid', 'Málaga', 'Murcia', 'Navarra', 'Orense', 'Palencia',
        'Pontevedra', 'Salamanca', 'Santa Cruz de Tenerife', 'Segovia',
        'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia',
        'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza'
    ]
    return { success: true, data: provincias }
}
