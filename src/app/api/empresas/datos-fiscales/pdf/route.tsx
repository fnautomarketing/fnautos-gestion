import { createServerClient } from '@/lib/supabase/server'
import { renderToStream } from '@react-pdf/renderer'
import { DatosFiscalesPdfDocument } from '@/components/ventas/pdf/datos-fiscales-pdf'
import { NextResponse } from 'next/server'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import type { Empresa } from '@/types/empresa'
import * as React from 'react'

/**
 * GET /api/empresas/datos-fiscales/pdf
 * Genera un PDF con los datos fiscales de la empresa activa del usuario.
 * Opcionalmente acepta ?empresa_id=UUID para especificar una empresa concreta
 * (debe estar en las empresas del usuario).
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const empresaIdParam = searchParams.get('empresa_id')

    const supabase = await createServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { empresaId: empresaActivaId, empresas } = await getUserContext()

    // Resolver empresa_id: parámetro de query > empresa activa
    let empresaId = empresaIdParam || empresaActivaId

    // Validar que el usuario tiene acceso a esa empresa
    // empresas son filas de usuarios_empresas: tienen empresa_id y opcionalmente empresa.id
    if (empresaId) {
        const tieneAcceso = empresas.some(
            (e: { empresa_id?: string; empresa?: { id?: string } }) =>
                e.empresa_id === empresaId || (e.empresa && e.empresa.id === empresaId)
        )
        if (!tieneAcceso) {
            // Usuario puede tener solo perfil (sin usuarios_empresas): comprobar perfil.empresa_id
            const { data: perfil } = await supabase
                .from('perfiles')
                .select('empresa_id')
                .eq('user_id', user.id)
                .single()
            if (perfil?.empresa_id !== empresaId) {
                return new NextResponse('Forbidden', { status: 403 })
            }
        }
    }

    // Fallback: si no hay empresa activa por contexto, usar la del perfil
    if (!empresaId) {
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('empresa_id')
            .eq('user_id', user.id)
            .single()
        empresaId = perfil?.empresa_id || null
    }

    if (!empresaId) {
        return new NextResponse('No empresa activa. Selecciona una empresa en el header.', { status: 400 })
    }

    // Cargar todos los datos de la empresa
    const { data: empresaData, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single()

    if (error || !empresaData) {
        return new NextResponse('Empresa no encontrada', { status: 404 })
    }

    const empresa = empresaData as unknown as Empresa

    // Resolver el logo: intentar desde logo_url de la empresa (Supabase Storage)
    let logoUrl: string | undefined
    if (empresa.logo_url) {
        try {
            const res = await fetch(empresa.logo_url)
            if (res.ok) {
                const buf = Buffer.from(await res.arrayBuffer())
                const mime = res.headers.get('content-type') || 'image/png'
                logoUrl = `data:${mime};base64,${buf.toString('base64')}`
            }
        } catch {
            // Si no se puede cargar el logo, continuar sin él
        }
    }

    // Generar PDF
    try {
        const stream = await renderToStream(
            React.createElement(DatosFiscalesPdfDocument, {
                empresa,
                logoUrl,
            })
        )

        const nombreArchivo = `Datos-fiscales-${empresa.razon_social.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-')}.pdf`
        const nombreEncoded = encodeURIComponent(nombreArchivo)

        return new NextResponse(stream as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${nombreArchivo}"; filename*=UTF-8''${nombreEncoded}`,
            },
        })
    } catch (err: any) {
        console.error('Error generando PDF de datos fiscales:', err)
        return new NextResponse(`Error generando PDF: ${err.message}`, { status: 500 })
    }
}
