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
        plantilla: pdfPlantilla,
        idioma: 'es',
        incluirLogo: incluirLogoPdf,
        incluirDatosBancarios: true,
        notasPie: '',
        colorAcento: '#0f172a',
      }

      let logoUrl: string | undefined
      if (incluirLogoPdf) {
        try {
          const logoPath = path.join(process.cwd(), 'public', clientConfig.logoPath.replace(/^\//, ''))
          if (fs.existsSync(logoPath)) {
            logoUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
          }
        } catch {}
      }

      const stream = await renderToStream(
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

      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM || 'Facturación <administracion@stvls.com>',
        to,
        subject,
        html: `<p>${message.replace(/\n/g, '<br/>')}</p>`,
        attachments: [{
          filename: `Factura-${factura.serie || 'FAC'}-${factura.numero}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }],
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
