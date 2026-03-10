#!/usr/bin/env node
/**
 * Aplica la migración RLS de facturas Vision Global vía Supabase Management API.
 * Requiere: SUPABASE_ACCESS_TOKEN y NEXT_PUBLIC_SUPABASE_URL en .env.local
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const PROJECT_REF = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!PROJECT_REF || !TOKEN) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_ACCESS_TOKEN en .env.local')
  process.exit(1)
}

const migrations = [
  '20260216_fix_facturas_rls_vision_global.sql',
  '20260216_fix_lineas_factura_rls_vision_global.sql',
]

async function run() {
  for (const name of migrations) {
    const sqlPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations', name)
    const sql = readFileSync(sqlPath, 'utf8')
    console.log('Aplicando', name, '...')
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
    console.error('Error en', name, ':', res.status, err)
    process.exit(1)
  }
  }
  console.log('Todas las migraciones RLS aplicadas correctamente')
}

run().catch(e => { console.error(e); process.exit(1) })
