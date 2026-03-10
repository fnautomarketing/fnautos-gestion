/**
 * Corrige la factura Villegas F2026-0234 → F2026-0009
 * Añade descuento 5% (125,63 €) y retención IRPF 5% (125,63 €) según PDF.
 * Total correcto: 2.888,12 €
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
  const { data, error } = await supabase
    .from('facturas')
    .update({
      numero: '0009',
      numero_manual: '0009',
      descuento_tipo: 'porcentaje',
      descuento_valor: 5,
      importe_descuento: 125.63,
      retencion_porcentaje: 5,
      importe_retencion: 125.63,
      subtotal: 2386.88,
      base_imponible: 2512.51,
      iva: 501.24,
      total: 2888.12,
    })
    .eq('id', FACTURA_ID)
    .select('id, numero, serie, total, base_imponible, iva, importe_descuento, importe_retencion')
    .single()

  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
  console.log('Factura corregida:', data.serie + '-' + data.numero)
  console.log('Total:', data.total, '€')
  console.log('Base:', data.base_imponible, '| IVA:', data.iva, '| Descuento:', data.importe_descuento, '| IRPF:', data.importe_retencion)
}

main()
