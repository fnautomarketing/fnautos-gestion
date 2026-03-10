#!/usr/bin/env node
/**
 * Elimina clientes E2E de Supabase (y sus facturas relacionadas).
 * Descubre dinámicamente los clientes E2E (nombre/email con "e2e" o @e2e.test).
 * Ejecutar: node scripts/delete-e2e-clientes.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '..', '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

async function getE2eClienteIds() {
  const { data: clientes, error } = await supabase
    .from('clientes')
    .select('id, nombre_fiscal, nombre_comercial, email_principal')
    .or('nombre_fiscal.ilike.%e2e%,nombre_comercial.ilike.%e2e%,email_principal.ilike.%e2e.test%')

  if (error) throw error

  const timestampRegex = /\d{13}/
  const e2eClientes = (clientes || []).filter((c) => {
    const hasE2e = (c.nombre_fiscal || '').toLowerCase().includes('e2e') ||
      (c.nombre_comercial || '').toLowerCase().includes('e2e') ||
      (c.email_principal || '').toLowerCase().endsWith('@e2e.test')
    const hasTimestamp = timestampRegex.test(c.nombre_fiscal || '') || timestampRegex.test(c.nombre_comercial || '')
    return hasE2e || hasTimestamp
  })

  return e2eClientes.map((c) => c.id)
}

async function run() {
  const E2E_IDS = await getE2eClienteIds()
  if (E2E_IDS.length === 0) {
    console.log('No hay clientes E2E en la base de datos.')
    process.exit(0)
  }

  console.log(`Eliminando ${E2E_IDS.length} clientes E2E y datos relacionados...\n`)

  // 1. Facturas de estos clientes
  const { data: facturas } = await supabase
    .from('facturas')
    .select('id')
    .in('cliente_id', E2E_IDS)

  const facturaIds = (facturas || []).map((f) => f.id)

  if (facturaIds.length > 0) {
    console.log(`  - ${facturaIds.length} factura(s) E2E encontrada(s)`)
    for (const fid of facturaIds) {
      await supabase.from('recordatorios').delete().eq('factura_id', fid)
      await supabase.from('pagos_factura').delete().eq('factura_id', fid)
      await supabase.from('emails_factura').delete().eq('factura_id', fid)
      await supabase.from('eventos_factura').delete().eq('factura_id', fid)
      await supabase.from('lineas_factura').delete().eq('factura_id', fid)
    }
    await supabase.from('facturas').update({ factura_rectificada_id: null }).in('factura_rectificada_id', facturaIds)
    const { error: errF } = await supabase.from('facturas').delete().in('cliente_id', E2E_IDS)
    if (errF) {
      console.error('   Error eliminando facturas:', errF.message)
    } else {
      console.log('   Facturas eliminadas.')
    }
  }

  // 2. clientes_empresas
  const { error: errCE } = await supabase.from('clientes_empresas').delete().in('cliente_id', E2E_IDS)
  if (errCE) {
    console.error('   Error eliminando clientes_empresas:', errCE.message)
  } else {
    console.log('   clientes_empresas eliminados.')
  }

  // 3. Clientes
  const { error: errC } = await supabase.from('clientes').delete().in('id', E2E_IDS)
  if (errC) {
    console.error('   Error eliminando clientes:', errC.message)
    process.exit(1)
  }

  console.log(`\n✓ ${E2E_IDS.length} clientes E2E eliminados correctamente.`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
