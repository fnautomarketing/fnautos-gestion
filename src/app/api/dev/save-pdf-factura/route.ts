/**
 * GET /api/dev/save-pdf-factura
 * Genera el PDF de una factura emitida y lo guarda en temp-factura.pdf en la raíz del proyecto.
 * Solo para desarrollo. Query: ?id=<factura_id> (opcional; si no se pasa, usa la primera factura emitida).
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No disponible en producción' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const facturaId = searchParams.get('id')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = supabase
    .from('facturas')
    .select('*, cliente:clientes(*), lineas:lineas_factura(*)')
    .in('estado', ['emitida', 'pagada'])

  if (facturaId) query = query.eq('id', facturaId)
  query = query.limit(1)

  const { data: facturas, error } = await query

  if (error || !facturas?.length) {
    return NextResponse.json({ error: 'No se encontró factura' }, { status: 404 })
  }

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
    let pdfPlantilla: 'premium' = 'premium'
    let incluirLogoPdf = true
    if (factura.empresa_id === EMPRESA_VILLEGAS_ID) {
      pdfPlantilla = 'premium'
      incluirLogoPdf = true
    } else if (factura.empresa_id === EMPRESA_YENIFER_ID || factura.empresa_id === EMPRESA_EDISON_ID) {
      pdfPlantilla = 'premium'
      incluirLogoPdf = false
    } else {
      pdfPlantilla = 'premium'
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
      React.createElement(FacturaPdfDocument as any, {
        factura: fullFactura,
        empresa,
        options: pdfOptions,
        logoUrl,
      }) as any
    )
    const pdfBuffer = await streamToBuffer(stream as any)

    const filename = `Factura-${factura.serie || 'FAC'}-${factura.numero}.pdf`
    const tempPath = path.join(process.cwd(), 'temp-factura.pdf')
    fs.writeFileSync(tempPath, pdfBuffer)

    return NextResponse.json({
      ok: true,
      path: tempPath,
      filename,
      factura: `${factura.serie}-${factura.numero}`,
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
