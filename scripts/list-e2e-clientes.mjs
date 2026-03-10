#!/usr/bin/env node
/**
 * Lista clientes E2E en Supabase para revisión antes de eliminarlos.
 * Ejecutar: node scripts/list-e2e-clientes.mjs
 * Requiere: .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '..', '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

// Patrones para identificar clientes E2E:
// 1. nombre_fiscal o nombre_comercial contiene "e2e"
// 2. email_principal termina en @e2e.test
// 3. nombre contiene timestamp de 13 dígitos (ej: 1772611942839) - típico de E2E con Date.now()
const { data: clientes, error } = await supabase
  .from('clientes')
  .select('id, nombre_fiscal, nombre_comercial, cif, email_principal, created_at')
  .or('nombre_fiscal.ilike.%e2e%,nombre_comercial.ilike.%e2e%,email_principal.ilike.%e2e.test%')
  .order('created_at', { ascending: false })

if (error) {
  console.error('Error:', error.message)
  process.exit(1)
}

// Filtrar también por timestamp de 13 dígitos en el nombre (patrón E2E Cliente Solo Villegas 1772611942839 S.L.)
const timestampRegex = /\d{13}/
const e2eClientes = (clientes || []).filter((c) => {
  const hasE2e = (c.nombre_fiscal || '').toLowerCase().includes('e2e') ||
    (c.nombre_comercial || '').toLowerCase().includes('e2e') ||
    (c.email_principal || '').toLowerCase().endsWith('@e2e.test')
  const hasTimestamp = timestampRegex.test(c.nombre_fiscal || '') || timestampRegex.test(c.nombre_comercial || '')
  return hasE2e || hasTimestamp
})

console.log('\n=== CLIENTES E2E DETECTADOS ===\n')
console.log(`Total encontrados: ${e2eClientes.length}\n`)

if (e2eClientes.length === 0) {
  console.log('No hay clientes E2E en la base de datos.')
  process.exit(0)
}

e2eClientes.forEach((c, i) => {
  console.log(`${i + 1}. ${c.nombre_fiscal || c.nombre_comercial || '(sin nombre)'}`)
  console.log(`   ID: ${c.id}`)
  console.log(`   CIF: ${c.cif || '-'}`)
  console.log(`   Email: ${c.email_principal || '-'}`)
  console.log(`   Creado: ${c.created_at || '-'}`)
  console.log('')
})

console.log('---')
console.log('Para eliminar estos clientes, ejecuta: node scripts/delete-e2e-clientes.mjs\n')
