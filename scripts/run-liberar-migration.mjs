#!/usr/bin/env node
/**
 * Ejecuta la migración liberar_numero_serie usando Supabase Management API.
 * Requiere: SUPABASE_ACCESS_TOKEN y project ref en .env.local
 * Ejecutar: node scripts/run-liberar-migration.mjs
 */
import 'dotenv/config'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] || 'kdcdjuukjczxnklabcoe'
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN

const SQL = `
CREATE OR REPLACE FUNCTION public.liberar_numero_serie(p_serie_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE series_facturacion
    SET numero_actual = GREATEST(numero_inicial, COALESCE(numero_actual, numero_inicial) - 1),
        facturas_emitidas = GREATEST(0, COALESCE(facturas_emitidas, 0) - 1)
    WHERE id = p_serie_id;
END;
$$;
`

async function run() {
  if (!TOKEN) {
    console.error('Falta SUPABASE_ACCESS_TOKEN en .env.local')
    console.log('Obtén un token en: https://supabase.com/dashboard/account/tokens')
    process.exit(1)
  }

  console.log('Ejecutando migración liberar_numero_serie en proyecto', PROJECT_REF)
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL.trim() }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Error:', res.status, err)
    process.exit(1)
  }
  console.log('OK: Función liberar_numero_serie creada correctamente')
}

run()
