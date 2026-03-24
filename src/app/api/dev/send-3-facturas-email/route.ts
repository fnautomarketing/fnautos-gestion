/**
 * POST /api/dev/send-3-facturas-email
 * Envía 3 facturas emitidas (una por empresa) al email indicado.
 * Body: { "to": "j.e.bolanos@hotmail.com" }
 * Solo para desarrollo/pruebas.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resend } from '@/lib/email/resend'
import { renderToStream } from '@react-pdf/renderer'
import { FacturaPdfDocument } from '@/components/ventas/pdf/pdf-document'
import type { Empresa, PdfOptions } from '@/components/ventas/pdf/pdf-document'
import React from 'react'
import path from 'path'
import fs from 'fs'
import { clientConfig } from '@/config/clients'

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No disponible en producción' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const to = (body.to as string) || 'j.e.bolanos@hotmail.com'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: empresas } = await supabase.from('empresas').select('id, razon_social').limit(10)
  if (!empresas?.length) {
    return NextResponse.json({ error: 'No hay empresas' }, { status: 400 })
  }

  const results: { factura: string; empresa: string; ok: boolean; id?: string; error?: string }[] = []
  const seenEmpresas = new Set<string>()

  for (const emp of empresas) {
    if (seenEmpresas.has(emp.id)) continue

    const { data: facturas } = await supabase
      .from('facturas')
      .select('*, cliente:clientes(*), lineas:lineas_factura(*)')
      .eq('empresa_id', emp.id)
      .in('estado', ['emitida', 'pagada'])
      .limit(1)

    if (!facturas?.length) continue

    const factura = facturas[0] as any
    try {
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

      const fullFactura = { ...factura, descuento_tipo: factura.descuento_tipo as 'porcentaje' | 'fijo' | null }
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
        pdfPlantilla = 'estandar'
        incluirLogoPdf = true
      }
      const pdfOptions: PdfOptions = {
        plantilla: pdfPlantilla as 'premium',
        idioma: 'es',
        incluirLogo: incluirLogoPdf,
        incluirDatosBancarios: true,
        notasPie: '',
        colorAcento: '#0f172a',
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
        } catch {}
      }

      const stream = await renderToStream(
        // @ts-ignore - React 19 typings conflict with @react-pdf/renderer
        React.createElement(FacturaPdfDocument, {
          factura: fullFactura,
          empresa,
          options: pdfOptions,
          logoUrl,
        })
      )
      const pdfBuffer = await streamToBuffer(stream as any)

      const empresaNombre = empresaRow?.razon_social || empresaRow?.nombre_comercial || clientConfig.nombre
      const subject = `Factura ${factura.serie || 'FAC'}-${factura.numero} - ${empresaNombre}`
      const message = `Estimado cliente,\n\nAdjuntamos la factura ${factura.serie}-${factura.numero} correspondiente a los servicios prestados.\n\nQuedamos a su disposición para cualquier consulta.\n\nAtentamente,\n${clientConfig.nombre}`

      const fromEnv = process.env.RESEND_FROM || `FN AUTOS <info@fnautos.es>`
      const fromDomain = fromEnv.replace(/^["']|["']$/g, '').trim()
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
              .highlight { color: #0f172a; font-weight: 700; }
              .divider { height: 1px; background: #e2e8f0; margin: 30px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  ${logoBuffer ? `<img src="cid:logo" class="logo" alt="FN AUTOS" />` : `<h1 style="margin:0; font-family: 'Inter', sans-serif;">FN AUTOS</h1>`}
              </div>
              <div class="content">
                  <h2 style="margin-top:0">Notificación de Factura (Prueba Remitente)</h2>
                  <p>Estimado cliente,</p>
                  <p>Le adjuntamos la factura correspondiente a los servicios prestados.</p>
                  
                  <div class="divider"></div>
                  
                  <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                          <td style="padding: 10px 0; color: #64748b;">Número de Factura:</td>
                          <td style="padding: 10px 0; text-align: right;" class="highlight">${factura.serie || 'FAC'}-${factura.numero}</td>
                      </tr>
                      <tr>
                          <td style="padding: 10px 0; color: #64748b;">Total:</td>
                          <td style="padding: 10px 0; text-align: right; font-size: 20px;" class="highlight">${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(factura.total))}</td>
                      </tr>
                  </table>
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

      const { data, error } = await resend.emails.send({
        from: fromDomain,
        to,
        subject,
        html: htmlTemplate,
        attachments: [
          {
            filename: `Factura-${factura.serie || 'FAC'}-${factura.numero}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
          ...(logoBuffer ? [{
            filename: logoMime === 'image/svg+xml' ? 'logo.svg' : 'logo.png',
            content: logoBuffer,
            contentType: logoMime,
            contentId: 'logo'
          }] : [])
        ],
      })

      if (error) throw new Error(error.message)
      results.push({ factura: `${factura.serie}-${factura.numero}`, empresa: emp.razon_social, ok: true, id: data?.id })
      seenEmpresas.add(emp.id)
    } catch (e: any) {
      results.push({
        factura: `${factura.serie}-${factura.numero}`,
        empresa: emp.razon_social,
        ok: false,
        error: e.message,
      })
    }
  }

  return NextResponse.json({ to, results })
}
