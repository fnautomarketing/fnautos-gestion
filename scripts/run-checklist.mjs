#!/usr/bin/env node
/**
 * Script para completar el checklist: crear facturas por empresa y verificar series.
 * Ejecutar: node scripts/run-checklist.mjs
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const EMPRESAS = {
  Villegas: { id: '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5', serie: 'V2026' },
  Yenifer: { id: 'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a', serie: 'Y2026' },
  Edison: { id: 'af15f25a-7ade-4de8-9241-a42e1b8407da', serie: 'E2026' },
}

async function run() {
  console.log('=== CHECKLIST: Crear facturas y verificar series ===\n')

  const { data: cliente } = await supabase.from('clientes').select('id').eq('activo', true).limit(1).single()
  if (!cliente) {
    console.error('No hay clientes activos. Crear al menos uno.')
    process.exit(1)
  }

  const { data: series } = await supabase
    .from('series_facturacion')
    .select('id, codigo, empresa_id')
    .in('codigo', ['V2026', 'Y2026', 'E2026'])

  const serieMap = new Map(series?.map(s => [s.codigo, s]) || [])

  for (const [nombre, { id: empresaId, serie: codigo }] of Object.entries(EMPRESAS)) {
    const s = serieMap.get(codigo)
    if (!s) {
      console.log(`[SKIP] ${nombre}: serie ${codigo} no encontrada`)
      continue
    }

    const { data: numeroCompleto, error: rpcErr } = await supabase.rpc('obtener_siguiente_numero_serie', { p_serie_id: s.id })
    if (rpcErr) {
      console.error(`[ERROR] ${nombre}:`, rpcErr.message)
      continue
    }
    const numero = (numeroCompleto && numeroCompleto.includes('-')) ? numeroCompleto.split('-').pop() : (numeroCompleto || '0001')

    const { data: factura, error: insErr } = await supabase
      .from('facturas')
      .insert({
        empresa_id: empresaId,
        serie_id: s.id,
        serie: codigo,
        numero: numero,
        cliente_id: cliente.id,
        fecha_emision: new Date().toISOString().split('T')[0],
        fecha_vencimiento: new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0],
        subtotal: 100,
        base_imponible: 82.64,
        iva: 17.36,
        total: 100,
        estado: 'emitida',
        divisa: 'EUR',
        tipo_cambio: 1,
      })
      .select('id, numero, serie')
      .single()

    if (insErr) {
      console.error(`[ERROR] ${nombre} insert:`, insErr.message)
      continue
    }

    await supabase.from('lineas_factura').insert({
      factura_id: factura.id,
      concepto: `Checklist E2E ${nombre}`,
      descripcion: '',
      cantidad: 1,
      precio_unitario: 100,
      iva_porcentaje: 21,
      descuento_porcentaje: 0,
      subtotal: 100,
    })

    const fullNum = `${factura.serie}-${factura.numero}`
    console.log(`[OK] ${nombre}: factura ${fullNum} creada`)
  }

  console.log('\n=== Verificación en series_facturacion ===')
  const { data: seriesFinal } = await supabase
    .from('series_facturacion')
    .select('codigo, numero_actual, facturas_emitidas')
    .in('codigo', ['V2026', 'Y2026', 'E2026'])

  seriesFinal?.forEach(s => {
    console.log(`  ${s.codigo}: próximo=${s.numero_actual}, emitidas=${s.facturas_emitidas}`)
  })

  console.log('\n=== Facturas emitidas ===')
  const { data: facturas } = await supabase
    .from('facturas')
    .select('serie, numero, empresa_id')
    .eq('estado', 'emitida')
    .order('created_at', { ascending: false })
    .limit(10)

  facturas?.forEach(f => {
    console.log(`  ${f.serie}-${f.numero}`)
  })

  console.log('\nChecklist completado.')
}

run().catch(console.error)
