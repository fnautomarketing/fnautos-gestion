'use server'

import { resend } from '@/lib/email/resend'
import { clientConfig } from '@/config/clients'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Contrato } from '@/types/contratos'
import { FORMA_PAGO_LABELS } from '@/types/contratos'
import path from 'path'
import fs from 'fs'

// ╔══════════════════════════════════════════════════════════╗
// ║  Email Helpers — Contratos con firma digital            ║
// ╚══════════════════════════════════════════════════════════╝

function getLogoForEmail(): { logoBuffer: Buffer | undefined; logoMime: string } {
    try {
        const logoToUse = clientConfig.logoPngPath || clientConfig.logoPath.replace('.svg', '.png')
        const logoPath = path.join(process.cwd(), 'public', logoToUse.replace(/^\//, ''))
        if (fs.existsSync(logoPath)) {
            const isSvg = logoPath.endsWith('.svg')
            return {
                logoBuffer: fs.readFileSync(logoPath),
                logoMime: isSvg ? 'image/svg+xml' : 'image/png',
            }
        }
    } catch { /* silently fallback */ }
    return { logoBuffer: undefined, logoMime: 'image/png' }
}

function formatPrecio(n: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(n))
}

function getBaseUrlFallback(): string {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    return 'http://localhost:3000'
}

async function getEmpresaData(empresaId: string) {
    const admin = createAdminClient()
    const { data } = await admin
        .from('empresas')
        .select('razon_social, nombre_comercial, direccion, ciudad, codigo_postal, cif, email, telefono')
        .eq('id', empresaId)
        .single()
    return data
}

function emailBaseStyles(): string {
    return `
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { padding: 25px 20px; text-align: center; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%); color: #0f172a; border-bottom: 1px solid #e2e8f0; }
        .logo { max-width: 150px; display: block; margin-left: auto; margin-right: auto; }
        .content { padding: 40px; }
        .footer { padding: 30px; text-align: center; border-top: 1px solid #f1f5f9; background: #fafafa; color: #64748b; font-size: 12px; }
        .button { display: inline-block; padding: 16px 32px; background-color: #0f172a; color: white !important; font-weight: bold; text-decoration: none; border-radius: 10px; margin-top: 20px; text-transform: uppercase; letter-spacing: 0.5px; font-size: 14px; }
        .highlight { color: #0f172a; font-weight: 700; }
        .divider { height: 1px; background: #e2e8f0; margin: 25px 0; }
        .info-table td { padding: 8px 0; }
        .info-label { color: #64748b; }
        .info-value { text-align: right; font-weight: 600; }
    `
}

// ── EMAIL 1: Invitación a firmar ─────────────────────────

interface EnviarInvitacionParams {
    contrato: Contrato
    emailDestinatario: string
    empresaId: string
    baseUrl?: string
}

export async function enviarEmailInvitacionFirma({
    contrato,
    emailDestinatario,
    empresaId,
    baseUrl,
}: EnviarInvitacionParams) {
    const { logoBuffer, logoMime } = getLogoForEmail()
    const empresa = await getEmpresaData(empresaId)
    const empresaNombre = empresa?.razon_social || empresa?.nombre_comercial || clientConfig.nombre
    const bUrl = baseUrl || getBaseUrlFallback()
    const firmaUrl = `${bUrl}/contratos/firmar/${contrato.token_firma}`
    const fromEnv = process.env.RESEND_FROM || `FN AUTOS <info@fnautos.es>`
    const fromDomain = fromEnv.replace(/^["']|["']$/g, '').trim()

    const tipoTexto = contrato.tipo_operacion === 'venta' ? 'compraventa' : 'compraventa'
    const nombreDestinatario = contrato.tipo_operacion === 'venta'
        ? contrato.comprador_nombre
        : contrato.vendedor_nombre

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>${emailBaseStyles()}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                ${logoBuffer ? `<img src="cid:logo" class="logo" alt="${empresaNombre}" />` : `<h1 style="margin:0;">${empresaNombre}</h1>`}
            </div>
            <div class="content">
                <h2 style="margin-top:0; color: #0f172a;">Contrato de ${tipoTexto}</h2>
                <p>Estimado/a <strong>${nombreDestinatario}</strong>,</p>
                <p>Le enviamos el contrato de ${tipoTexto} del vehículo <strong>${contrato.vehiculo_marca} ${contrato.vehiculo_modelo}</strong> (${contrato.vehiculo_matricula}) para su revisión y firma.</p>
                
                <div class="divider"></div>
                
                <table style="width: 100%; border-collapse: collapse;" class="info-table">
                    <tr>
                        <td class="info-label">Nº Contrato:</td>
                        <td class="info-value highlight">${contrato.numero_contrato}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Vehículo:</td>
                        <td class="info-value">${contrato.vehiculo_marca} ${contrato.vehiculo_modelo} (${contrato.vehiculo_matricula})</td>
                    </tr>
                    <tr>
                        <td class="info-label">Importe:</td>
                        <td class="info-value highlight" style="font-size: 18px;">${formatPrecio(contrato.total_con_iva || contrato.precio_venta)}</td>
                    </tr>
                    ${contrato.forma_pago ? `<tr>
                        <td class="info-label">Forma de pago:</td>
                        <td class="info-value">${FORMA_PAGO_LABELS[contrato.forma_pago] || contrato.forma_pago}</td>
                    </tr>` : ''}
                </table>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${firmaUrl}" class="button" style="color: white !important;">✍️ FIRMAR CONTRATO</a>
                </div>

                <p style="font-size: 13px; color: #94a3b8; margin-top: 25px; text-align: center;">
                    Este enlace es válido durante 7 días.<br>
                    Si tiene dudas, contacte con nosotros.
                </p>
            </div>
            <div class="footer">
                <p><b>${empresaNombre}</b></p>
                <p>${empresa?.direccion || ''} - ${empresa?.ciudad || ''}, ${empresa?.codigo_postal || ''}</p>
                <p>© ${new Date().getFullYear()} - Gestión Inteligente FNAUTOS</p>
            </div>
        </div>
    </body>
    </html>
    `

    const result = await resend.emails.send({
        from: fromDomain,
        to: [emailDestinatario],
        subject: `Contrato de ${tipoTexto} nº ${contrato.numero_contrato} - ${empresaNombre}`,
        html,
        attachments: logoBuffer ? [{
            filename: logoMime === 'image/svg+xml' ? 'logo.svg' : 'logo.png',
            content: logoBuffer,
            contentType: logoMime,
            contentId: 'logo',
        }] : [],
    })

    if (result.error) {
        console.error('Error enviando email invitación firma:', result.error)
        throw new Error('Error enviando email: ' + result.error.message)
    }

    return result
}

// ── EMAIL 2: Copia firmada al cliente ────────────────────

interface EnviarCopiaFirmadaParams {
    contrato: Contrato
    emailDestinatario: string
    pdfBuffer: Buffer
    empresaId: string
}

export async function enviarEmailCopiaFirmada({
    contrato,
    emailDestinatario,
    pdfBuffer,
    empresaId,
}: EnviarCopiaFirmadaParams) {
    const { logoBuffer, logoMime } = getLogoForEmail()
    const empresa = await getEmpresaData(empresaId)
    const empresaNombre = empresa?.razon_social || empresa?.nombre_comercial || clientConfig.nombre
    const fromEnv = process.env.RESEND_FROM || `FN AUTOS <info@fnautos.es>`
    const fromDomain = fromEnv.replace(/^["']|["']$/g, '').trim()

    const fechaFirma = contrato.firmado_en
        ? new Date(contrato.firmado_en).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
        : new Date().toLocaleDateString('es-ES')

    const nombreDestinatario = contrato.tipo_operacion === 'venta'
        ? contrato.comprador_nombre
        : contrato.vendedor_nombre

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>${emailBaseStyles()}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                ${logoBuffer ? `<img src="cid:logo" class="logo" alt="${empresaNombre}" />` : `<h1 style="margin:0;">${empresaNombre}</h1>`}
            </div>
            <div class="content">
                <h2 style="margin-top:0; color: #16a34a;">✅ Contrato firmado</h2>
                <p>Estimado/a <strong>${nombreDestinatario}</strong>,</p>
                <p>Le adjuntamos copia del contrato firmado electrónicamente.</p>
                
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0; color: #166534;">
                        <strong>✅ Firmado electrónicamente el ${fechaFirma}</strong>
                    </p>
                </div>

                <table style="width: 100%; border-collapse: collapse;" class="info-table">
                    <tr>
                        <td class="info-label">Nº Contrato:</td>
                        <td class="info-value highlight">${contrato.numero_contrato}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Vehículo:</td>
                        <td class="info-value">${contrato.vehiculo_marca} ${contrato.vehiculo_modelo} (${contrato.vehiculo_matricula})</td>
                    </tr>
                    <tr>
                        <td class="info-label">Importe:</td>
                        <td class="info-value highlight">${formatPrecio(contrato.total_con_iva || contrato.precio_venta)}</td>
                    </tr>
                </table>

                <div class="divider"></div>
                <p style="font-size: 13px; color: #94a3b8;">Conserve este email y el PDF adjunto como comprobante del contrato.</p>
            </div>
            <div class="footer">
                <p><b>${empresaNombre}</b></p>
                <p>${empresa?.direccion || ''} - ${empresa?.ciudad || ''}, ${empresa?.codigo_postal || ''}</p>
                <p>© ${new Date().getFullYear()} - Gestión Inteligente FNAUTOS</p>
            </div>
        </div>
    </body>
    </html>
    `

    const result = await resend.emails.send({
        from: fromDomain,
        to: [emailDestinatario],
        subject: `Contrato firmado nº ${contrato.numero_contrato} - Copia`,
        html,
        attachments: [
            {
                filename: `Contrato-${contrato.numero_contrato}-Firmado.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
            },
            ...(logoBuffer ? [{
                filename: logoMime === 'image/svg+xml' ? 'logo.svg' : 'logo.png',
                content: logoBuffer,
                contentType: logoMime,
                contentId: 'logo',
            }] : []),
        ],
    })

    if (result.error) {
        console.error('Error enviando copia firmada:', result.error)
        throw new Error('Error enviando email: ' + result.error.message)
    }

    return result
}

// ── EMAIL 3: Notificación al admin ───────────────────────

interface EnviarNotificacionAdminParams {
    contrato: Contrato
    pdfBuffer: Buffer
    empresaId: string
}

export async function enviarEmailNotificacionAdmin({
    contrato,
    pdfBuffer,
    empresaId,
}: EnviarNotificacionAdminParams) {
    const { logoBuffer, logoMime } = getLogoForEmail()
    const empresa = await getEmpresaData(empresaId)
    const empresaNombre = empresa?.razon_social || empresa?.nombre_comercial || clientConfig.nombre
    const emailAdmin = empresa?.email
    const fromEnv = process.env.RESEND_FROM || `FN AUTOS <info@fnautos.es>`
    const fromDomain = fromEnv.replace(/^["']|["']$/g, '').trim()

    if (!emailAdmin) {
        console.warn('No hay email de empresa para notificación admin')
        return
    }

    const nombreFirmante = contrato.tipo_operacion === 'venta'
        ? contrato.comprador_nombre
        : contrato.vendedor_nombre

    const fechaFirma = contrato.firmado_en
        ? new Date(contrato.firmado_en).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
        : 'N/D'

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>${emailBaseStyles()}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                ${logoBuffer ? `<img src="cid:logo" class="logo" alt="${empresaNombre}" />` : `<h1 style="margin:0;">${empresaNombre}</h1>`}
            </div>
            <div class="content">
                <h2 style="margin-top:0; color: #16a34a;">✅ Contrato ${contrato.numero_contrato} firmado</h2>
                <p>El contrato nº <strong>${contrato.numero_contrato}</strong> ha sido firmado por <strong>${nombreFirmante}</strong>.</p>
                
                <table style="width: 100%; border-collapse: collapse;" class="info-table">
                    <tr>
                        <td class="info-label">Firmante:</td>
                        <td class="info-value">${nombreFirmante}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Fecha firma:</td>
                        <td class="info-value">${fechaFirma}</td>
                    </tr>
                    <tr>
                        <td class="info-label">IP:</td>
                        <td class="info-value" style="font-family: monospace; font-size: 12px;">${contrato.firma_ip || 'N/D'}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Vehículo:</td>
                        <td class="info-value">${contrato.vehiculo_marca} ${contrato.vehiculo_modelo} (${contrato.vehiculo_matricula})</td>
                    </tr>
                    <tr>
                        <td class="info-label">Importe:</td>
                        <td class="info-value highlight">${formatPrecio(contrato.total_con_iva || contrato.precio_venta)}</td>
                    </tr>
                </table>

                <div class="divider"></div>
                <p style="font-size: 13px; color: #94a3b8;">El PDF firmado se adjunta a este email.</p>
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} - Gestión Inteligente FNAUTOS</p>
            </div>
        </div>
    </body>
    </html>
    `

    const result = await resend.emails.send({
        from: fromDomain,
        to: [emailAdmin],
        subject: `✅ Contrato ${contrato.numero_contrato} firmado por ${nombreFirmante}`,
        html,
        attachments: [
            {
                filename: `Contrato-${contrato.numero_contrato}-Firmado.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
            },
            ...(logoBuffer ? [{
                filename: logoMime === 'image/svg+xml' ? 'logo.svg' : 'logo.png',
                content: logoBuffer,
                contentType: logoMime,
                contentId: 'logo',
            }] : []),
        ],
    })

    if (result.error) {
        console.error('Error enviando notificación admin:', result.error)
    }

    return result
}
