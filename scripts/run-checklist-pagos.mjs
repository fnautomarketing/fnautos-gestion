#!/usr/bin/env node
/**
 * Script: Registrar pago total por transferencia en cada factura emitida (V2026, Y2026, E2026).
 * Ejecutar: node scripts/run-checklist-pagos.mjs
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function run() {
  console.log('=== CHECKLIST PAGOS: Registrar pago total por transferencia ===\n')

  const { data: facturas } = await supabase
    .from('facturas')
    .select('id, serie, numero, total, pagado, empresa_id, estado')
    .in('serie', ['V2026', 'Y2026', 'E2026'])
    .in('estado', ['emitida', 'parcial'])
    .order('created_at', { ascending: false })

  if (!facturas?.length) {
    console.log('No hay facturas emitidas pendientes de pago (V2026, Y2026, E2026).')
    return
  }

  const hoy = new Date().toISOString().split('T')[0]

  for (const f of facturas) {
    const pendiente = Number(f.total) - (Number(f.pagado) || 0)
    if (pendiente <= 0) {
      console.log(`[SKIP] ${f.serie}-${f.numero}: ya pagada`)
      continue
    }

    const { error: errPago } = await supabase.from('pagos_factura').insert({
      factura_id: f.id,
      importe: pendiente,
      fecha_pago: hoy,
      metodo_pago: 'Transferencia',
      referencia: 'Pago checklist - Transferencia',
      empresa_id: f.empresa_id,
    })

    if (errPago) {
      console.error(`[ERROR] ${f.serie}-${f.numero}:`, errPago.message)
      continue
    }

    const { error: errPagos } = await supabase.from('pagos').insert({
      factura_id: f.id,
      importe: pendiente,
      fecha_pago: hoy,
      metodo_pago: 'Transferencia',
      referencia: 'Pago checklist - Transferencia',
      empresa_id: f.empresa_id,
      conciliado: false,
      anulado: false,
    })

    if (errPagos) console.warn(`[WARN] pagos insert:`, errPagos.message)

    const { error: errUpd } = await supabase
      .from('facturas')
      .update({
        pagado: f.total,
        estado: 'pagada',
        updated_at: new Date().toISOString(),
      })
      .eq('id', f.id)

    if (errUpd) {
      console.error(`[ERROR] update factura ${f.serie}-${f.numero}:`, errUpd.message)
      continue
    }

    console.log(`[OK] ${f.serie}-${f.numero}: pago ${pendiente.toFixed(2)}€ por Transferencia → PAGADA`)
  }

  console.log('\n=== Verificación ===')
  const { data: facturasFinal } = await supabase
    .from('facturas')
    .select('serie, numero, estado, pagado, total')
    .in('serie', ['V2026', 'Y2026', 'E2026'])
    .order('created_at', { ascending: false })
    .limit(6)

  facturasFinal?.forEach(f => {
    console.log(`  ${f.serie}-${f.numero}: ${f.estado} (pagado: ${f.pagado}/${f.total})`)
  })

  console.log('\nChecklist pagos completado.')
}

run().catch(console.error)
