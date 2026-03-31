/**
 * Script de Keep-Alive para Supabase (Free Tier)
 * ------------------------------------------------
 * Ejecuta una consulta mínima contra la base de datos para resetear
 * el contador de inactividad de 7 días de Supabase.
 *
 * Se ejecuta automáticamente via GitHub Actions cada 3 días.
 * Configuración: Lunes, Miércoles y Viernes a las 9:00 UTC.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan variables de entorno: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

try {
  const { data, error } = await supabase.from('empresas').select('id').limit(1)

  if (error) {
    console.error('❌ Error en keep-alive query:', error.message)
    process.exit(1)
  }

  const timestamp = new Date().toISOString()
  console.log(`✅ [${timestamp}] Keep-alive exitoso — Supabase activo (${data?.length ?? 0} filas leídas)`)
  process.exit(0)
} catch (err) {
  console.error('❌ Error inesperado:', err)
  process.exit(1)
}
