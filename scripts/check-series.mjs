#!/usr/bin/env node
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function check() {
  const { data: empresas } = await supabase.from('empresas').select('id, razon_social, prefijo_serie')
  console.log('Empresas:', empresas?.length, empresas?.map(e => ({ id: e.id.slice(0, 8), razon: e.razon_social, prefijo: e.prefijo_serie })))

  const { data: series, error } = await supabase
    .from('series_facturacion')
    .select('id, codigo, empresa_id, nombre, activa')
  console.log('Series:', series?.length, error || series?.map(s => ({ codigo: s.codigo, empresa_id: s.empresa_id?.slice(0, 8), activa: s.activa })))
}

check().catch(console.error)
