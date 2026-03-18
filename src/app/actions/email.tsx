'use server'

import { createServerClient } from '@/lib/supabase/server'
import { resend } from '@/lib/email/resend'
import { renderToStream } from '@react-pdf/renderer'
import { FacturaPdfDocument } from '@/components/ventas/pdf/pdf-document'
import type { Empresa, PdfOptions } from '@/components/ventas/pdf/pdf-document'
import React from 'react'
import path from 'path'
import fs from 'fs'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { clientConfig } from '@/config/clients'

// Convert stream to buffer manually since react-pdf stream lacks standard toBuffer
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Uint8Array[] = []
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('error', (err) => reject(err))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
    })
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseAndValidateEmails(str: string): { emails: string[]; error?: string } {
    const emails = str.split(',').map(e => e.trim()).filter(Boolean)
    for (const e of emails) {
        if (!EMAIL_REGEX.test(e)) return { emails: [], error: `Email no válido: ${e}` }
    }
    return { emails }
}

export async function sendFacturaEmailAction(formData: FormData) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'User not authenticated' }
    }

    const facturaId = (formData.get('facturaId') as string) || ''
    const toRaw = formData.get('to')?.toString() || ''
    const ccRaw = formData.get('cc')?.toString() || ''
    const subject = (formData.get('subject') as string) || ''
    const message = (formData.get('message') as string) || ''
    const sendCopy = formData.get('sendCopy') === 'on'
    const incluirLogo = formData.get('incluirLogo') === '1'
    const plantillaMsg = (formData.get('plantilla') as string) || 'estandar'

    const { emails: to, error: toErr } = parseAndValidateEmails(toRaw)
    const { emails: cc, error: ccErr } = parseAndValidateEmails(ccRaw)

    if (toErr || ccErr) {
        return { success: false, error: toErr || ccErr }
    }
    if (!facturaId || to.length === 0) {
        return { success: false, error: 'Introduce al menos un destinatario' }
    }

    try {
        const { empresaId, rol } = await getUserContext()
        const isGlobal = !empresaId && rol === 'admin'

        const { data: perfil } = await supabase.from('perfiles').select('empresa_id, user_id').eq('user_id', user.id).single()
        const empresaFiltro = isGlobal ? undefined : (empresaId || perfil?.empresa_id)
        if (!empresaFiltro && !isGlobal) throw new Error('Usuario sin empresa asignada')

        let query = supabase
            .from('facturas')
            .select('*, cliente:clientes(*), lineas:lineas_factura(*)')
            .eq('id', facturaId)
        if (empresaFiltro) query = query.eq('empresa_id', empresaFiltro)
        const { data: factura } = await query.single()

        if (!factura) throw new Error('Factura no encontrada')

        const fullFactura = factura as unknown as import('@/components/ventas/pdf/pdf-document').FacturaWithRelations

        // Load empresa (emisor)
        const { data: empresaRow } = await supabase
            .from('empresas')
            .select('razon_social, nombre_comercial, direccion, ciudad, codigo_postal, provincia, pais, cif, email, iban, banco, pie_factura')
            .eq('id', factura.empresa_id)
            .single()

        const empresa: Empresa = empresaRow ? {
            nombre_fiscal: empresaRow.razon_social || empresaRow.nombre_comercial || 'Empresa',
            direccion: empresaRow.direccion || '',
            ciudad: empresaRow.ciudad || '',
            codigo_postal: empresaRow.codigo_postal || '',
            cif: empresaRow.cif || '',
            email: empresaRow.email || undefined,
            iban: empresaRow.iban || undefined,
            banco: empresaRow.banco || undefined,
            pie_factura: empresaRow.pie_factura || undefined,
        } : {
            nombre_fiscal: 'Empresa',
            direccion: '',
            ciudad: '',
            codigo_postal: '',
            cif: '',
        }

        // Siempre plantilla Premium – única plantilla activa en esta instalación
        const incluirLogoPdf = true

        const pdfOptions: PdfOptions = {
            plantilla: 'premium',
            idioma: 'es',
            incluirLogo: incluirLogoPdf,
            incluirDatosBancarios: true,
            notasPie: '',
            colorAcento: clientConfig.colors.primary.startsWith('#') ? clientConfig.colors.primary : '#0f172a'
        }

        let logoUrl: string | undefined
        let logoBuffer: Buffer | undefined
        let logoMime: string = 'image/png'
        if (incluirLogoPdf) {
            try {
                const logoToUse = clientConfig.logoPngPath || clientConfig.logoPath.replace('.svg', '.png')
                const logoPath = path.join(process.cwd(), 'public', logoToUse.replace(/^\//, ''))
                if (fs.existsSync(logoPath)) {
                    const isSvg = logoPath.endsWith('.svg')
                    logoMime = isSvg ? 'image/svg+xml' : 'image/png'
                    logoBuffer = fs.readFileSync(logoPath)
                    logoUrl = `data:${logoMime};base64,${logoBuffer.toString('base64')}`
                }
            } catch {
                logoUrl = undefined
                logoBuffer = undefined
            }
        }

        const stream = await renderToStream(
            <FacturaPdfDocument
                factura={fullFactura}
                empresa={empresa}
                options={pdfOptions}
                logoUrl={logoUrl}
            />
        )
        const pdfBuffer = await streamToBuffer(stream as unknown as NodeJS.ReadableStream)

        const ccFinal = [...cc]
        if (sendCopy && user.email) {
            ccFinal.push(user.email)
        }

        const fromDomain = process.env.RESEND_FROM || `FN AUTOS <info@fnautos.es>`
        const empresaNombre = empresaRow?.razon_social || empresaRow?.nombre_comercial || clientConfig.nombre
        const subjectFinal = subject || `Factura ${fullFactura.serie || 'FAC'}-${fullFactura.numero} - ${empresaNombre}`

        // El logo usa Content-ID (cid) en línea para evadir filtros de SPAM
        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Inter', system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
                .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                .header { padding: 25px 20px; text-align: center; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%); color: #0f172a; border-bottom: 1px solid #e2e8f0; }
                .logo { max-width: 150px; margin-bottom: 0px; display: block; margin-left: auto; margin-right: auto; }
                .content { padding: 40px; }
                .footer { padding: 30px; text-align: center; border-top: 1px solid #f1f5f9; background: #fafafa; color: #64748b; font-size: 12px; }
                .button { display: inline-block; padding: 14px 28px; background-color: #0f172a; color: white !important; font-weight: bold; text-decoration: none; border-radius: 8px; margin-top: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
                .highlight { color: #0f172a; font-weight: 700; }
                .divider { height: 1px; background: #e2e8f0; margin: 30px 0; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    ${logoBuffer ? `<img src="cid:logo" class="logo" alt="FN AUTOS" />` : `<h1 style="margin:0; font-family: 'Inter', sans-serif;">FN AUTOS</h1>`}
                </div>
                <div class="content">
                    <h2 style="margin-top:0">Notificación de Factura</h2>
                    <p>Estimado cliente,</p>
                    <p>${message.replace(/\n/g, '<br/>') || 'Le adjuntamos la factura correspondiente a los servicios prestados.'}</p>
                    
                    <div class="divider"></div>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; color: #64748b;">Número de Factura:</td>
                            <td style="padding: 10px 0; text-align: right;" class="highlight">${fullFactura.serie || 'FAC'}-${fullFactura.numero}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #64748b;">Total:</td>
                            <td style="padding: 10px 0; text-align: right; font-size: 20px;" class="highlight">${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(fullFactura.total))}</td>
                        </tr>
                    </table>

                    <div style="text-align: center;">
                        <p style="font-size: 13px; color: #94a3b8; margin-top: 25px;">Encontrará el detalle completo en el documento PDF adjunto.</p>
                    </div>
                </div>
                <div class="footer">
                    <p><b>FN AUTOS</b></p>
                    <p>${empresa.direccion} - ${empresa.ciudad}, ${empresa.codigo_postal}</p>
                    <p>© ${new Date().getFullYear()} - Gestión Inteligente FNAUTOS</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const emailResult = await resend.emails.send({
            from: fromDomain,
            to,
            cc: ccFinal.length > 0 ? ccFinal : undefined,
            subject: subjectFinal,
            html: htmlTemplate,
            attachments: [
                {
                    filename: `Factura-${fullFactura.serie || 'FAC'}-${fullFactura.numero}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
                ...(logoBuffer ? [{
                    filename: logoMime === 'image/svg+xml' ? 'logo.svg' : 'logo.png',
                    content: logoBuffer,
                    contentType: logoMime,
                    contentId: 'logo'
                }] : [])
            ]
        })

        if (emailResult.error) {
            console.error('Resend Error:', emailResult.error)
            throw new Error('Error enviando email: ' + emailResult.error.message)
        }

        const empresaIdForLog = factura.empresa_id

        await supabase.from('emails_factura').insert({
            factura_id: factura.id,
            empresa_id: empresaIdForLog,
            para: to,
            cc: ccFinal,
            asunto: subject,
            mensaje: message,
            estado: 'enviado',
            proveedor_mensaje_id: emailResult.data?.id,
            incluir_logo: incluirLogo,
            plantilla: plantillaMsg,
            enviado_at: new Date().toISOString()
        } as unknown as import('@/types/supabase').Database['public']['Tables']['emails_factura']['Insert'])

        await supabase.from('eventos_factura').insert({
            factura_id: factura.id,
            tipo: 'enviado',
            descripcion: `Factura enviada por email a ${to[0]}`,
            user_id: user.id
        })

        return { success: true }

    } catch (error: unknown) {
        console.error('Server Action Error:', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'

        if (facturaId) {
            const { data: perfil } = await supabase.from('perfiles').select('empresa_id').eq('user_id', user.id).single()
            if (perfil) {
                await supabase.from('emails_factura').insert({
                    factura_id: facturaId,
                    empresa_id: perfil.empresa_id,
                    para: to,
                    asunto: subject,
                    mensaje: message,
                    estado: 'error',
                    error_mensaje: message
                } as unknown as import('@/types/supabase').Database['public']['Tables']['emails_factura']['Insert'])
            }
        }

        return { success: false, error: message }
    }
}
