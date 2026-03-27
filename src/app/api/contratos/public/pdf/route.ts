import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { renderToStream } from '@react-pdf/renderer'
import { ContratoPdfDocument } from '@/components/contratos/pdf/contrato-pdf-document'
import type { Contrato } from '@/types/contratos'
import React from 'react'
import path from 'path'
import fs from 'fs'
import { clientConfig } from '@/config/clients'

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
            return new NextResponse('ID y Token requeridos', { status: 400 })
        }

        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                },
            }
        )

        // IMPORTANTE: Aquí NO verificamos sesión, sino que verificamos que el CONTRACT ID coincida con el TOKEN 
        // Esto permite que el firmante vea el documento de forma segura.
        const { data: contratoData, error: contratoError } = await supabase
            .from('contratos')
            .select('*')
            .eq('id', id)
            .eq('token_firma', token)
            .single()

        if (contratoError || !contratoData) {
            console.error('Error al verificar token de contrato publico:', contratoError)
            return new NextResponse('No autorizado o contrato no encontrado', { status: 401 })
        }

        const contrato = contratoData as unknown as Contrato

        const { data: empresaData } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', contrato.empresa_id)
            .single()

        if (!empresaData) {
            return new NextResponse('Empresa no encontrada', { status: 404 })
        }

        const empresaNombre = empresaData.razon_social || empresaData.nombre_comercial || 'Empresa'
        const logoUrl = resolveLogoUrl()

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
            }) as React.ReactElement<any>
        )
        const pdfBuffer = await streamToBuffer(stream as unknown as NodeJS.ReadableStream)

        const filename = `Contrato-${contrato.numero_contrato}.pdf`
        
        return new NextResponse(pdfBuffer as unknown as BodyInit, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
            },
        })

    } catch (error: any) {
        console.error('Error al generar PDF de contrato publico:', error)
        return new NextResponse(`Error generando PDF: ${error.message}`, { status: 500 })
    }
}
