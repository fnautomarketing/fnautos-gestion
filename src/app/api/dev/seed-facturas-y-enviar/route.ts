/**
 * POST /api/dev/seed-facturas-y-enviar
 * 1. Crea facturas emitidas para empresas que no tienen
 * 2. Envía 3 facturas (una por empresa) al email indicado
 * Body: { "to": "j.e.bolanos@hotmail.com" }
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

async function crearFacturaEmitida(empresaId: string) {
  const { data: serie } = await supabase
    .from('series_facturacion')
    .select('id, codigo')
    .eq('empresa_id', empresaId)
    .eq('predeterminada', true)
    .limit(1)
    .single()

  if (!serie) return null

  const { data: numResult } = await supabase.rpc('obtener_siguiente_numero_serie', { p_serie_id: serie.id })
  const full = (numResult as string) || ''
  const parts = full.split('-')
  const numero = parts.length > 1 ? parts[parts.length - 1] : full || '0001'
  const serieCodigo = parts.length > 1 ? parts.slice(0, -1).join('-') : serie.codigo

  // Clientes visibles para esta empresa (vía clientes_empresas)
  const { data: ceRows } = await supabase
    .from('clientes_empresas')
    .select('cliente_id')
    .eq('empresa_id', empresaId)
    .limit(1)
  const clienteId = ceRows?.[0]?.cliente_id
  if (!clienteId) return null

  const hoy = new Date().toISOString().split('T')[0]
  const venc = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  const subtotal = 100
  const iva = 21
  const total = 121

  const { data: factura, error: errFac } = await supabase
    .from('facturas')
    .insert({
      empresa_id: empresaId,
      numero,
      serie: serieCodigo,
      serie_id: serie.id,
      cliente_id: clienteId,
      fecha_emision: hoy,
      fecha_vencimiento: venc,
      subtotal,
      base_imponible: subtotal,
      iva,
      total,
      estado: 'emitida',
    } as any)
    .select()
    .single()

  if (errFac || !factura) return null

  await supabase.from('lineas_factura').insert({
    factura_id: factura.id,
    concepto: 'Servicio de prueba - Seed para envío email',
    descripcion: 'Línea creada automáticamente',
    cantidad: 1,
    precio_unitario: 100,
    descuento_porcentaje: 0,
    iva_porcentaje: 21,
    subtotal: 100,
  } as any)

  return factura
}

async function registrarPagoFactura(facturaId: string, total: number, empresaId: string) {
  const hoy = new Date().toISOString().split('T')[0]
  await supabase.from('pagos_factura').insert({
    factura_id: facturaId,
    importe: total,
    fecha_pago: hoy,
    metodo_pago: 'Transferencia',
    referencia: 'Pago seed',
    empresa_id: empresaId,
  } as any)
  await (supabase as any).from('pagos').insert({
    factura_id: facturaId,
    importe: total,
    fecha_pago: hoy,
    metodo_pago: 'Transferencia',
    referencia: 'Pago seed',
    empresa_id: empresaId,
    creado_por: null,
    conciliado: false,
    anulado: false,
  })
  await supabase.from('facturas').update({
    estado: 'pagada',
    pagado: total,
    updated_at: new Date().toISOString(),
  }).eq('id', facturaId).eq('empresa_id', empresaId)
}

async function enviarFactura(facturaId: string, to: string, empRazonSocial: string) {
  const { data: factura, error: facErr } = await supabase
    .from('facturas')
    .select('*, cliente:clientes(*), lineas:lineas_factura(*)')
    .eq('id', facturaId)
    .single()

  if (facErr || !factura) throw new Error('Factura no encontrada')

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

  const fullFactura = { ...factura, descuento_tipo: factura.descuento_tipo }
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
  if (incluirLogoPdf) {
    try {
      const logoPath = path.join(process.cwd(), 'public', clientConfig.logoPath.replace(/^\//, ''))
      if (fs.existsSync(logoPath)) {
        logoUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
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
  const message = `Estimado cliente,\n\nAdjuntamos la factura ${factura.serie}-${factura.numero} correspondiente a los servicios prestados.\n\nAtentamente,\n${clientConfig.nombre}`

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM || clientConfig.email.from,
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
  return { factura: `${factura.serie}-${factura.numero}`, empresa: empRazonSocial, ok: true, id: data?.id }
}

const EMPRESA_VILLEGAS = '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5'
const EMPRESA_YENIFER = 'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a'
const EMPRESA_EDISON = 'af15f25a-7ade-4de8-9241-a42e1b8407da'

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No disponible en producción' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const to = (body.to as string) || 'j.e.bolanos@hotmail.com'
  const single = body.single === true

  const empresasIds = single ? [EMPRESA_VILLEGAS] : [EMPRESA_VILLEGAS, EMPRESA_YENIFER, EMPRESA_EDISON]
  const { data: empresasRows } = await supabase
    .from('empresas')
    .select('id, razon_social')
    .in('id', empresasIds)
  const empresas = empresasRows || []
  if (!empresas.length) {
    return NextResponse.json({ error: 'No hay empresas' }, { status: 400 })
  }

  const created: string[] = []
  const results: { factura: string; empresa: string; ok: boolean; id?: string; error?: string }[] = []

  for (const emp of empresas) {
    const { data: existentes } = await supabase
      .from('facturas')
      .select('id, serie, numero, total, estado, pagado')
      .eq('empresa_id', emp.id)
      .in('estado', ['emitida', 'pagada'])
      .limit(1)

    let factura = existentes?.[0] as any

    if (!factura) {
      const nueva = await crearFacturaEmitida(emp.id)
      if (nueva) {
        factura = nueva
        created.push(`${factura.serie}-${factura.numero}`)
      }
    }

    if (!factura) continue

    const total = Number(factura.total) || 121
    const pagado = Number(factura.pagado) || 0
    const pendiente = total - pagado
    if (pendiente > 0.01 && factura.estado !== 'pagada') {
      await registrarPagoFactura(factura.id, total, emp.id)
    }

    try {
      const r = await enviarFactura(factura.id, to, emp.razon_social)
      results.push(r)
    } catch (e: any) {
      results.push({
        factura: `${factura.serie}-${factura.numero}`,
        empresa: emp.razon_social,
        ok: false,
        error: e.message,
      })
    }
  }

  return NextResponse.json({ to, created, results })
}
