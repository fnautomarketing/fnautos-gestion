#!/usr/bin/env node
/**
 * Crea una factura en borrador para Villegas (cliente CARFERTRANSPORTO627,SL)
 * con las líneas y totales indicados por tu jefe.
 *
 * Importante:
 * - Usa la serie F2026 de Villegas.
 * - Deja numero = '0000' (el número real se asignará al EMITIR; ya hemos puesto la serie en 6).
 * - Estado inicial: 'borrador'.
 * - Fecha de emisión: HOY (según la máquina donde se ejecute).
 *
 * Uso:
 *   node scripts/create-factura-villegas-carfer-borrador.mjs
 *
 * Requiere en .env.local:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } })

const EMPRESA_VILLEGAS_ID = '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5'

async function ensureClienteCarfer() {
  // 1. Buscar cliente por nombre fiscal
  const { data: existentes, error } = await supabase
    .from('clientes')
    .select('*')
    .ilike('nombre_fiscal', 'CARFERTRANSPORTO627%')

  if (error) {
    console.error('❌ Error buscando cliente CARFER:', error.message)
    process.exit(1)
  }

  if (existentes && existentes.length > 0) {
    const c = existentes[0]
    console.log('✅ Cliente CARFER ya existe:', c.id)
    // Asegurar relación con Villegas
    await supabase
      .from('clientes_empresas')
      .insert({ cliente_id: c.id, empresa_id: EMPRESA_VILLEGAS_ID })
      .eq('cliente_id', c.id)
      .eq('empresa_id', EMPRESA_VILLEGAS_ID)
      .then(() => {})
      .catch(() => {})
    return c
  }

  console.log('ℹ️ Cliente CARFER no existe. Creándolo...')
  const { data: inserted, error: errIns } = await supabase
    .from('clientes')
    .insert({
      cif: 'B67394387',
      nombre_fiscal: 'CARFERTRANSPORTO627, SL',
      nombre_comercial: 'CARFERTRANSPORTO627',
      email_principal: null,
      telefono_principal: '685829593',
      direccion: 'AVD VALENCIA 18 PLANTA 3 PO1',
      codigo_postal: '08750',
      ciudad: 'Molins de Rei',
      provincia: 'Barcelona',
      pais: 'España',
      empresa_id: null,
      activo: true,
      forma_pago_predeterminada: 'transferencia_30',
      dias_vencimiento: 30,
      descuento_comercial: 0,
      iva_aplicable: 21,
      tipo_cliente: 'empresa',
    })
    .select('*')
    .single()

  if (errIns || !inserted) {
    console.error('❌ Error creando cliente CARFER:', errIns?.message)
    process.exit(1)
  }

  await supabase
    .from('clientes_empresas')
    .insert({ cliente_id: inserted.id, empresa_id: EMPRESA_VILLEGAS_ID })

  console.log('✅ Cliente CARFER creado y asignado a Villegas:', inserted.id)
  return inserted
}

async function getSerieF2026() {
  const { data, error } = await supabase
    .from('series_facturacion')
    .select('*')
    .eq('empresa_id', EMPRESA_VILLEGAS_ID)
    .eq('codigo', 'F2026')
    .single()

  if (error || !data) {
    console.error('❌ No se encontró la serie F2026 de Villegas:', error?.message)
    process.exit(1)
  }
  console.log('✅ Serie F2026 encontrada:', data.id)
  return data
}

async function main() {
  console.log('--- Creando borrador factura Villegas → CARFER ---')

  const cliente = await ensureClienteCarfer()
  const serie = await getSerieF2026()

  const hoy = new Date()
  const fecha = hoy.toISOString().slice(0, 10) // YYYY-MM-DD

  // Líneas según foto de tu jefe
  const lineas = [
    { concepto: 'RUTA 5 – 24 días', cantidad: 24, precio_unitario: 145, iva_porcentaje: 21 },
    { concepto: 'RUTA 5 – 15 portes 2º día', cantidad: 15, precio_unitario: 50, iva_porcentaje: 21 },
    { concepto: 'RUTA 5 – 4 portes extras', cantidad: 4, precio_unitario: 100, iva_porcentaje: 21 },
    { concepto: 'RUTA 11 – 24 días', cantidad: 24, precio_unitario: 145, iva_porcentaje: 21 },
    { concepto: 'RUTA 11 – 12 portes 2º día', cantidad: 12, precio_unitario: 50, iva_porcentaje: 21 },
  ]

  let subtotal = 0
  const lineasConSubtotal = lineas.map((l) => {
    const st = l.cantidad * l.precio_unitario
    subtotal += st
    return { ...l, subtotal: st }
  })

  const baseImponible = subtotal
  const iva = Math.round(baseImponible * 0.21 * 100) / 100
  const total = Math.round((baseImponible + iva) * 100) / 100

  console.log('  Subtotal/base:', baseImponible)
  console.log('  IVA 21%:', iva)
  console.log('  Total:', total)

  // Crear factura en borrador
  const { data: factura, error: errFac } = await supabase
    .from('facturas')
    .insert({
      empresa_id: EMPRESA_VILLEGAS_ID,
      numero: '0000', // borrador, el definitivo se pondrá al emitir (usando serie F2026 que ya está en 6)
      serie: null,
      serie_id: serie.id,
      cliente_id: cliente.id,
      fecha_emision: fecha,
      fecha_vencimiento: fecha,
      subtotal: baseImponible,
      base_imponible: baseImponible,
      iva,
      total,
      descuento_tipo: 'porcentaje',
      descuento_valor: 0,
      recargo_equivalencia: false,
      recargo_porcentaje: 0,
      retencion_porcentaje: 0,
      plantilla_pdf_id: null,
      es_rectificativa: false,
      estado: 'borrador',
      divisa: 'EUR',
      tipo_cambio: 1.0,
      notas: null,
    })
    .select('*')
    .single()

  if (errFac || !factura) {
    console.error('❌ Error creando factura:', errFac?.message)
    process.exit(1)
  }

  console.log('✅ Factura borrador creada con id:', factura.id)

  // Insertar líneas
  const payloadLineas = lineasConSubtotal.map((l) => ({
    factura_id: factura.id,
    concepto: l.concepto,
    descripcion: '',
    cantidad: l.cantidad,
    precio_unitario: l.precio_unitario,
    descuento_porcentaje: 0,
    iva_porcentaje: l.iva_porcentaje,
    subtotal: l.subtotal,
  }))

  const { error: errLineas } = await supabase.from('lineas_factura').insert(payloadLineas)
  if (errLineas) {
    console.error('❌ Error insertando líneas:', errLineas.message)
    process.exit(1)
  }

  console.log('✅ Líneas insertadas correctamente.')
  console.log('\n🎯 Listo. Tienes un borrador en Villegas para CARFER con la estructura acordada.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
