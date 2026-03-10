#!/usr/bin/env node
/**
 * Elimina TODAS las facturas y tablas relacionadas usando la API de administración de Supabase.
 * No toca clientes.
 *
 * Usa el mismo patrón que scripts/fase2-limpiar-clientes-facturas.mjs
 *
 * Requiere en .env.local:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_ACCESS_TOKEN  (token de acceso al proyecto en Supabase)
 */
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const PROJECT_REF = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!PROJECT_REF || !TOKEN) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_ACCESS_TOKEN en .env.local')
  process.exit(1)
}

const SQL_STATEMENTS = [
  { name: 'facturas.factura_rectificada_id = NULL', sql: 'UPDATE public.facturas SET factura_rectificada_id = NULL WHERE factura_rectificada_id IS NOT NULL' },
  { name: 'emails_factura', sql: 'DELETE FROM public.emails_factura' },
  { name: 'recordatorios', sql: 'DELETE FROM public.recordatorios' },
  { name: 'pagos_factura', sql: 'DELETE FROM public.pagos_factura' },
  { name: 'pagos', sql: 'DELETE FROM public.pagos' },
  { name: 'eventos_factura', sql: 'DELETE FROM public.eventos_factura' },
  { name: 'lineas_factura', sql: 'DELETE FROM public.lineas_factura' },
  { name: 'facturas', sql: 'DELETE FROM public.facturas' },
  { name: 'series_facturacion reset', sql: 'UPDATE public.series_facturacion SET numero_actual = numero_inicial, facturas_emitidas = 0' },
]

async function run() {
  console.log('🧹 Eliminando TODAS las facturas y datos relacionados (emails, pagos, recordatorios, eventos, líneas)...')
  console.log('   Clientes y empresas se mantienen.\n')

  for (const { name, sql } of SQL_STATEMENTS) {
    try {
      console.log(`→ Ejecutando: ${name}...`)
      const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`${res.status}: ${err}`)
      }
      await res.json()
      console.log(`   ✅ ${name}`)
    } catch (e) {
      console.error(`   ❌ Error en ${name}:`, e.message)
      process.exit(1)
    }
  }

  console.log('\n✅ Limpieza completada: base de datos sin facturas. Clientes intactos.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
