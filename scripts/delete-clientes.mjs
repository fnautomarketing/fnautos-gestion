#!/usr/bin/env node
/**
 * Elimina todos los clientes y facturas de la base de datos.
 * Ejecutar: node scripts/delete-clientes.mjs
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
  console.log('1. Eliminando facturas y datos relacionados...')
  await supabase.from('facturas').update({ factura_rectificada_id: null }).not('factura_rectificada_id', 'is', null)

  const { data: facturas } = await supabase.from('facturas').select('id')
  if (facturas?.length) {
    for (const f of facturas) {
      await supabase.from('recordatorios').delete().eq('factura_id', f.id)
      await supabase.from('pagos_factura').delete().eq('factura_id', f.id)
      await supabase.from('emails_factura').delete().eq('factura_id', f.id)
      await supabase.from('eventos_factura').delete().eq('factura_id', f.id)
      await supabase.from('lineas_factura').delete().eq('factura_id', f.id)
    }
    await supabase.from('facturas').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  }
  console.log('   Facturas eliminadas.')

  console.log('2. Eliminando clientes...')
  const { data: clientes } = await supabase.from('clientes').select('id')
  if (clientes?.length) {
    for (const c of clientes) {
      await supabase.from('clientes_empresas').delete().eq('cliente_id', c.id)
    }
    await supabase.from('clientes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  }
  console.log('   Clientes eliminados.')

  console.log('Listo. Base de datos vacía de clientes y facturas.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
