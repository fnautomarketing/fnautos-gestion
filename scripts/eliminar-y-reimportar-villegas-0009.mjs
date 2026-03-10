/**
 * Elimina la factura F2026-0234 (incorrecta) y reimporta con datos correctos del PDF.
 * Número correcto: 0009. Descuento 5% = 125,63 €. IRPF 5% = 125,63 €. Total = 2.888,12 €.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const envPath = join(root, '.env.local')
if (existsSync(envPath)) {
  const env = readFileSync(envPath, 'utf8')
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/)
    if (m) {
      const key = m[1].trim()
      const val = m[2].trim().replace(/^["']|["']$/g, '')
      if (key) process.env[key] = val
    }
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const FACTURA_ID = '23fa43af-3ea3-497c-b4e2-109f2f1f6eda'

async function main() {
  // 1. Eliminar factura y datos relacionados (en orden por FKs)
  const { error: e1 } = await supabase.from('eventos_factura').delete().eq('factura_id', FACTURA_ID)
  if (e1) console.warn('eventos_factura:', e1.message)
  const { error: e2 } = await supabase.from('emails_factura').delete().eq('factura_id', FACTURA_ID)
  if (e2) console.warn('emails_factura:', e2.message)
  const { error: e3 } = await supabase.from('lineas_factura').delete().eq('factura_id', FACTURA_ID)
  if (e3) console.warn('lineas_factura:', e3.message)
  const { error: e4 } = await supabase.from('facturas').delete().eq('id', FACTURA_ID)
  if (e4) {
    console.error('Error eliminando factura:', e4.message)
    process.exit(1)
  }
  console.log('Factura eliminada.')

  // 2. Reimportar (ejecutar script)
  const { spawnSync } = await import('child_process')
  const r = spawnSync(
    process.execPath,
    ['scripts/importar-facturas-historicas.mjs', 'data/facturas-historicas/factura-villegas-234.json', 'data/facturas-historicas'],
    { cwd: root, stdio: 'inherit' }
  )
  if (r.status !== 0) process.exit(1)
  console.log('Reimportación OK.')
}

main()
