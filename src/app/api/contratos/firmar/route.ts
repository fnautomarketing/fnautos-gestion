import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { firmarContratoSchema } from '@/lib/validations/contrato-schema'
import { enviarEmailCopiaFirmada, enviarEmailNotificacionAdmin } from '@/app/actions/contratos-email'
import { renderToStream } from '@react-pdf/renderer'
import { ContratoPdfDocument } from '@/components/contratos/pdf/contrato-pdf-document'
import type { Contrato } from '@/types/contratos'
import React from 'react'
import path from 'path'
import fs from 'fs'
import { clientConfig } from '@/config/clients'

// ╔══════════════════════════════════════════════════════════╗
// ║  API Route — Firma pública de contratos (sin auth)      ║
// ╚══════════════════════════════════════════════════════════╝

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Uint8Array[] = []
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('error', (err) => reject(err))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
    })
}

function getLogoUrl(): string | undefined {
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

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validar input
        const parseResult = firmarContratoSchema.safeParse(body)
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.issues[0].message },
                { status: 400 }
            )
        }

        const { token, firma_data } = parseResult.data
        const admin = createAdminClient()

        // Buscar contrato por token
        const { data, error } = await admin
            .from('contratos')
            .select('*')
            .eq('token_firma', token)
            .single()

        if (error || !data) {
            return NextResponse.json(
                { error: 'Enlace de firma no válido' },
                { status: 404 }
            )
        }

        const contrato = data as unknown as Contrato

        // Verificar estado
        if (contrato.estado === 'firmado') {
            return NextResponse.json(
                { error: 'Este contrato ya ha sido firmado' },
                { status: 409 }
            )
        }

        if (contrato.estado !== 'pendiente_firma') {
            return NextResponse.json(
                { error: 'Este contrato no está disponible para firma' },
                { status: 400 }
            )
        }

        // Verificar expiración
        if (contrato.token_firma_expira && new Date(contrato.token_firma_expira) < new Date()) {
            return NextResponse.json(
                { error: 'El enlace de firma ha caducado. Contacte con el emisor.' },
                { status: 410 }
            )
        }

        // Obtener IP y user-agent
        const firmaIp = request.headers.get('x-forwarded-for')
            || request.headers.get('x-real-ip')
            || 'unknown'
        const firmaUserAgent = request.headers.get('user-agent') || 'unknown'
        const firmadoEn = new Date().toISOString()

        // Determinar campo de firma según tipo de operación
        const firmaField = contrato.tipo_operacion === 'venta'
            ? 'firma_comprador_data'
            : 'firma_vendedor_data'

        // Actualizar contrato con datos de firma
        const { error: updateError } = await admin
            .from('contratos')
            .update({
                [firmaField]: firma_data,
                estado: 'firmado',
                firmado_en: firmadoEn,
                firma_ip: firmaIp,
                firma_user_agent: firmaUserAgent,
            } as never)
            .eq('id', contrato.id)

        if (updateError) {
            console.error('Error actualizando contrato con firma:', updateError)
            return NextResponse.json(
                { error: 'Error al procesar la firma' },
                { status: 500 }
            )
        }

        // Obtener datos de la empresa para el PDF
        const { data: empresaData } = await admin
            .from('empresas')
            .select('razon_social, nombre_comercial, direccion, ciudad, codigo_postal, cif, email, telefono')
            .eq('id', contrato.empresa_id)
            .single()

        const empresaNombre = empresaData?.razon_social || empresaData?.nombre_comercial || 'Empresa'
        const logoUrl = getLogoUrl()

        // Generar PDF firmado
        const contratoFirmado: Contrato = {
            ...contrato,
            [firmaField]: firma_data,
            estado: 'firmado',
            firmado_en: firmadoEn,
            firma_ip: firmaIp,
        }

        let pdfBuffer: Buffer
        try {
            const stream = await renderToStream(
                React.createElement(ContratoPdfDocument, {
                    contrato: contratoFirmado,
                    empresa: {
                        nombre: empresaNombre,
                        cif: empresaData?.cif || '',
                        direccion: empresaData?.direccion || '',
                        ciudad: empresaData?.ciudad || '',
                        codigo_postal: empresaData?.codigo_postal || '',
                        telefono: empresaData?.telefono || '',
                        email: empresaData?.email || '',
                    },
                    logoUrl,
                }) as React.ReactElement<any>
            )
            pdfBuffer = await streamToBuffer(stream as unknown as NodeJS.ReadableStream)
        } catch (pdfErr) {
            console.error('Error generando PDF firmado:', pdfErr)
            // Continúa sin PDF, la firma se registró
            pdfBuffer = Buffer.alloc(0)
        }

        // Enviar emails asíncronamente (no bloquear respuesta al cliente)
        const emailPromises: Promise<unknown>[] = []

        // Email al firmante (cliente)
        const emailCliente = contrato.tipo_operacion === 'venta'
            ? contrato.comprador_email
            : contrato.vendedor_email

        if (emailCliente && pdfBuffer.length > 0) {
            emailPromises.push(
                enviarEmailCopiaFirmada({
                    contrato: contratoFirmado,
                    emailDestinatario: emailCliente,
                    pdfBuffer,
                    empresaId: contrato.empresa_id,
                }).catch(err => console.error('Error email copia firmada:', err))
            )
        }

        // Email al admin
        if (pdfBuffer.length > 0) {
            emailPromises.push(
                enviarEmailNotificacionAdmin({
                    contrato: contratoFirmado,
                    pdfBuffer,
                    empresaId: contrato.empresa_id,
                }).catch(err => console.error('Error email notificación admin:', err))
            )
        }

        // No esperamos a los emails para responder rápido al usuario
        Promise.all(emailPromises).catch(() => {})

        return NextResponse.json({ success: true })

    } catch (err: unknown) {
        console.error('Error en API firma:', err)
        const message = err instanceof Error ? err.message : 'Error interno'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
