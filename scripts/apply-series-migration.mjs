#!/usr/bin/env node
/**
 * Aplica migraciones de series V2026/Y2026/E2026 vía Supabase Management API.
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
  '20260216_series_v2026_y2026_e2026.sql',
  '20260216_seed_series_empresas.sql',
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
    console.log('  OK')
  }
  console.log('Migraciones de series aplicadas correctamente')
}

run().catch(e => { console.error(e); process.exit(1) })
