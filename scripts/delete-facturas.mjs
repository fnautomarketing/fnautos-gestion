#!/usr/bin/env node
/**
 * Elimina TODAS las facturas y datos relacionados (lineas, pagos, emails, eventos, recordatorios)
 * sin tocar clientes ni empresas.
 *
 * Uso:
 *   node scripts/delete-facturas.mjs
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

async function run() {
  console.log('🧹 Eliminando TODAS las facturas y datos relacionados (pero NO clientes)...\n')

  // 1. Romper referencias de facturas rectificadas para evitar FK circular
  console.log('1) Limpiando factura_rectificada_id...')
  const { error: errRect } = await supabase
    .from('facturas')
    .update({ factura_rectificada_id: null })
    .not('factura_rectificada_id', 'is', null)
  if (errRect) {
    console.error('   ❌ Error al limpiar factura_rectificada_id:', errRect.message)
    process.exit(1)
  }
  console.log('   ✅ OK')

  // 2. Borrar tablas dependientes en orden seguro
  const tables = [
    'recordatorios',
    'pagos_factura',
    'pagos',
    'emails_factura',
    'eventos_factura',
    'lineas_factura',
  ]

  for (const table of tables) {
    console.log(`2) Eliminando datos de ${table}...`)
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) {
      console.error(`   ❌ Error al borrar ${table}:`, error.message)
      process.exit(1)
    }

    console.log(`   ✅ ${table} vacía`)
  }

  // 3. Borrar facturas
  console.log('3) Eliminando facturas...')
  const { error: errDelFact } = await supabase
    .from('facturas')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (errDelFact) {
    console.error('   ❌ Error al borrar facturas:', errDelFact.message)
    process.exit(1)
  }
  console.log('   ✅ Facturas eliminadas')

  console.log('\n✅ Listo. Base de datos sin facturas. Clientes y empresas se mantienen.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
