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

        // PDF plantilla por empresa: Villegas=premium+logo, Yenifer/Edison=estandar sin logo
        const EMPRESA_VILLEGAS_ID = '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5'
        const EMPRESA_YENIFER_ID = 'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a'
        const EMPRESA_EDISON_ID = 'af15f25a-7ade-4de8-9241-a42e1b8407da'
        let pdfPlantilla: 'estandar' | 'premium' = 'estandar'
        let incluirLogoPdf = false
        if (factura.empresa_id === EMPRESA_VILLEGAS_ID) {
            pdfPlantilla = 'premium'
            incluirLogoPdf = true
        } else if (factura.empresa_id === EMPRESA_YENIFER_ID || factura.empresa_id === EMPRESA_EDISON_ID) {
            pdfPlantilla = 'estandar'
            incluirLogoPdf = false
        } else {
            pdfPlantilla = (factura.plantilla_pdf_id === '5e63ff58-2cd5-4234-805a-fd93f50ee84c') ? 'premium' : 'estandar'
            incluirLogoPdf = incluirLogo
        }

        const pdfOptions: PdfOptions = {
            plantilla: pdfPlantilla,
            idioma: 'es',
            incluirLogo: incluirLogoPdf,
            incluirDatosBancarios: true,
            notasPie: '',
            colorAcento: '#0f172a'
        }

        let logoUrl: string | undefined
        try {
            const logoPath = path.join(process.cwd(), 'public', clientConfig.logoPath.replace(/^\//, ''))
            if (fs.existsSync(logoPath)) {
                const logoBuffer = fs.readFileSync(logoPath)
                logoUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`
            }
        } catch {
            logoUrl = undefined
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

        const fromDomain = process.env.RESEND_FROM || `Facturación <onboarding@resend.dev>`
        const empresaNombre = empresaRow?.razon_social || empresaRow?.nombre_comercial || clientConfig.nombre
        const subjectFinal = subject || `Factura ${fullFactura.serie || 'FAC'}-${fullFactura.numero} - ${empresaNombre}`

        const emailResult = await resend.emails.send({
            from: fromDomain,
            to,
            cc: ccFinal.length > 0 ? ccFinal : undefined,
            subject: subjectFinal,
            html: `<p>${message.replace(/\n/g, '<br/>')}</p>`,
            attachments: [
                {
                    filename: `Factura-${fullFactura.serie || 'FAC'}-${fullFactura.numero}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                }
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
