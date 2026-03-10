#!/usr/bin/env node
/**
 * Aplica la función liberar_numero_serie en Supabase.
 * Ejecutar: node scripts/apply-liberar-migration.mjs
 * Requiere: SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_URL en .env.local
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

const sql = `
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
  console.log('Instrucciones para aplicar liberar_numero_serie:')
  console.log('1. Abre Supabase Dashboard > SQL Editor')
  console.log('2. Pega y ejecuta el siguiente SQL:\n')
  console.log(sql)
  console.log('\nO desde terminal: npx supabase db execute < supabase/migrations/20260221_liberar_numero_serie_externa.sql')
}

run()
