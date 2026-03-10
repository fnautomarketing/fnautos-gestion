#!/usr/bin/env node
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

const sqlPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations', '20260224_clientes_rls_clientes_empresas.sql')
const sql = readFileSync(sqlPath, 'utf8')

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
})

if (!res.ok) {
  console.error('Error:', await res.text())
  process.exit(1)
}
console.log('Migración RLS clientes aplicada correctamente')
