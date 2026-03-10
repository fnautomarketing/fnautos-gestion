#!/usr/bin/env node
/**
 * Ajusta la serie F2026 de Villegas para que el próximo número sea el 6.
 *
 * No crea facturas, solo deja:
 *   numero_actual = 6
 *   facturas_emitidas = 5  (asumiendo que 1–5 existen en la realidad)
 *
 * Uso:
 *   node scripts/set-villegas-serie-f2026-6.mjs
 *
 * Requiere en .env.local:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_ACCESS_TOKEN
 */
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const PROJECT_REF = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN

const EMPRESA_VILLEGAS_ID = '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5'

if (!PROJECT_REF || !TOKEN) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_ACCESS_TOKEN en .env.local')
  process.exit(1)
}

async function run() {
  console.log('🔢 Ajustando serie F2026 de Villegas a próximo número = 6...\n')

  const sql = `
    UPDATE public.series_facturacion
    SET numero_actual = 6,
        facturas_emitidas = 5
    WHERE empresa_id = '${EMPRESA_VILLEGAS_ID}'
      AND codigo = 'F2026';
  `

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
    console.error('❌ Error al actualizar la serie:', res.status, err)
    process.exit(1)
  }

  await res.json()
  console.log('✅ Serie F2026 actualizada: numero_actual=6, facturas_emitidas=5')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
