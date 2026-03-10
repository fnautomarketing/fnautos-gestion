#!/usr/bin/env node
/**
 * Fase 2: Limpieza para pruebas con datos reales.
 * Elimina TODOS los clientes y TODAS las facturas de todas las empresas.
 * Mantiene: empresas (3), series_facturacion, plantillas_pdf, usuarios, perfiles, etc.
 *
 * Requiere: SUPABASE_ACCESS_TOKEN y NEXT_PUBLIC_SUPABASE_URL en .env.local
 */
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const PROJECT_REF = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!PROJECT_REF || !TOKEN) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_ACCESS_TOKEN en .env.local')
  process.exit(1)
}

const SQL_STATEMENTS = [
  { name: 'emails_factura', sql: 'DELETE FROM public.emails_factura' },
  { name: 'recordatorios', sql: 'DELETE FROM public.recordatorios' },
  { name: 'pagos_factura', sql: 'DELETE FROM public.pagos_factura' },
  { name: 'pagos', sql: 'DELETE FROM public.pagos' },
  { name: 'lineas_factura', sql: 'DELETE FROM public.lineas_factura' },
  { name: 'eventos_factura', sql: 'DELETE FROM public.eventos_factura' },
  { name: 'facturas (null rectificada)', sql: 'UPDATE public.facturas SET factura_rectificada_id = NULL' },
  { name: 'facturas', sql: 'DELETE FROM public.facturas' },
  { name: 'clientes', sql: 'DELETE FROM public.clientes' },
  { name: 'series_facturacion reset', sql: 'UPDATE public.series_facturacion SET numero_actual = numero_inicial, facturas_emitidas = 0' },
]

async function run() {
  console.log('🧹 Fase 2: Limpiando clientes y facturas (manteniendo 3 empresas)...\n')

  for (const { name, sql } of SQL_STATEMENTS) {
    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`${res.status}: ${err}`)
      }
      const data = await res.json()
      console.log(`  ✅ ${name}`)
    } catch (e) {
      console.error(`  ❌ ${name}:`, e.message)
      process.exit(1)
    }
  }

  console.log('\n✅ Limpieza completada. Quedan solo las 3 empresas.')
  console.log('   Puedes añadir clientes reales y crear facturas desde la app.')
}

run().catch(e => { console.error(e); process.exit(1) })
