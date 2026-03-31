import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderToStream } from '@react-pdf/renderer'
import { ContratoPdfDocument } from '@/components/contratos/pdf/contrato-pdf-document'
import type { Contrato } from '@/types/contratos'
import React from 'react'
import path from 'path'
import fs from 'fs'
import { clientConfig } from '@/config/clients'

// ╔══════════════════════════════════════════════════════════╗
// ║  API Route — PDF público de contrato (sin auth)         ║
// ║  Seguridad: Verificación por ID + token_firma           ║
// ╚══════════════════════════════════════════════════════════╝

export const dynamic = 'force-dynamic'

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Uint8Array[] = []
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('error', (err) => reject(err))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
    })
}

function resolveLogoUrl(): string | undefined {
    try {
        const pdfLogoPath = path.join(process.cwd(), 'public', 'logo-fnautos-pdf.png')
        if (fs.existsSync(pdfLogoPath)) {
            const logoBuffer = fs.readFileSync(pdfLogoPath)
            return `data:image/png;base64,${logoBuffer.toString('base64')}`
        }
        const logoToUse = clientConfig.logoPngPath || clientConfig.logoPath.replace('.svg', '.png')
        const logoPath = path.join(process.cwd(), 'public', logoToUse.replace(/^\//, ''))
        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath)
            return `data:image/png;base64,${logoBuffer.toString('base64')}`
        }
    } catch { /* fallback */ }
    return undefined
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const token = searchParams.get('token')

        if (!id || !token) {
            return new NextResponse('Parámetros requeridos: id y token', { status: 400 })
        }

        // Usar admin client para evitar problemas de RLS con usuarios no autenticados
        const admin = createAdminClient()

        // Verificar que el contrato existe Y que el token coincide (seguridad por token)
        const { data: contratoData, error: contratoError } = await admin
            .from('contratos')
            .select('*')
            .eq('id', id)
            .eq('token_firma', token)
            .single()

        if (contratoError || !contratoData) {
            console.error('Error verificando token público PDF:', contratoError?.message)
            return new NextResponse('No autorizado o contrato no encontrado', { status: 401 })
        }

        const contrato = contratoData as unknown as Contrato

        // Verificar que el contrato está en estado válido para visualización
        if (contrato.estado !== 'pendiente_firma' && contrato.estado !== 'firmado') {
            return new NextResponse('Contrato no disponible para visualización', { status: 403 })
        }

        // Verificar expiración del token
        if (contrato.token_firma_expira && new Date(contrato.token_firma_expira) < new Date()) {
            return new NextResponse('El enlace ha expirado', { status: 410 })
        }

        // Obtener datos de la empresa
        const { data: empresaData } = await admin
            .from('empresas')
            .select('*')
            .eq('id', contrato.empresa_id)
            .single()

        if (!empresaData) {
            return new NextResponse('Empresa no encontrada', { status: 404 })
        }

        const empresaNombre = empresaData.razon_social || empresaData.nombre_comercial || 'Empresa'
        const logoUrl = resolveLogoUrl()
        const firmaEmpresaUrl = empresaData.firma_url || undefined

        // Generar PDF
        const stream = await renderToStream(
            React.createElement(ContratoPdfDocument, {
                contrato,
                empresa: {
                    nombre: empresaNombre,
                    cif: empresaData.cif || '',
                    direccion: empresaData.direccion || '',
                    ciudad: empresaData.ciudad || '',
                    codigo_postal: empresaData.codigo_postal || '',
                    telefono: empresaData.telefono || '',
                    email: empresaData.email || '',
                },
                logoUrl,
                firmaEmpresaUrl,
            })
        )
        const pdfBuffer = await streamToBuffer(stream as unknown as NodeJS.ReadableStream)

        const filename = `Contrato-${contrato.numero_contrato}.pdf`

        return new NextResponse(pdfBuffer as unknown as BodyInit, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error interno'
        console.error('Error generando PDF público:', message)
        return new NextResponse(`Error generando PDF: ${message}`, { status: 500 })
    }
}
