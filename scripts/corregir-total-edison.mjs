#!/usr/bin/env node
/**
 * Corrige el campo `total` en BD para facturas Edison con retencion_porcentaje != 0.
 * Total correcto = base_imponible + iva + (base_imponible * retencion_porcentaje / 100)
 * Para retención -1%: total = base + IVA - 1% de base
 *
 * Uso: node scripts/corregir-total-edison.mjs
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
import { createClient } from '@supabase/supabase-js'

const EMPRESA_EDISON_ID = 'af15f25a-7ade-4de8-9241-a42e1b8407da'

async function main() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
        console.error('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
        process.exit(1)
    }
    const supabase = createClient(url, key)

    // Obtener TODAS las facturas Edison con retención != 0
    const { data: facturas, error } = await supabase
        .from('facturas')
        .select('id, serie, numero, base_imponible, iva, importe_recargo, total, pagado, estado, retencion_porcentaje, importe_retencion')
        .eq('empresa_id', EMPRESA_EDISON_ID)
        .not('retencion_porcentaje', 'is', null)
        .neq('retencion_porcentaje', 0)

    if (error) { console.error('Error:', error); process.exit(1) }
    if (!facturas?.length) { console.log('No hay facturas Edison con retención.'); return }

    for (const f of facturas) {
        const pct = Number(f.retencion_porcentaje)
        const base = Number(f.base_imponible)
        const iva = Number(f.iva)
        const recargo = Number(f.importe_recargo) || 0

        // efecto: negativo cuando pct negativo (resta), positivo cuando pct positivo (suma)
        const efectoRetencion = base * pct / 100
        const importeRetencionAbs = Math.round(Math.abs(efectoRetencion) * 100) / 100
        const nuevoTotal = Math.round((base + iva + efectoRetencion + recargo) * 100) / 100

        const totalActual = Number(f.total)
        if (Math.abs(totalActual - nuevoTotal) < 0.01) {
            console.log(`  ✓ ${f.serie}-${f.numero}: total ya correcto (${nuevoTotal}€)`)
            continue
        }

        const updates = {
            importe_retencion: importeRetencionAbs,
            total: nuevoTotal,
        }
        if (f.estado === 'pagada') updates.pagado = nuevoTotal

        const { error: upd } = await supabase
            .from('facturas')
            .update(updates)
            .eq('id', f.id)

        if (upd) {
            console.error(`  ✗ Error actualizando ${f.serie}-${f.numero}:`, upd)
        } else {
            console.log(`  ✓ ${f.serie}-${f.numero}: ${totalActual}€ → ${nuevoTotal}€ (IRPF ${pct}%, efecto ${efectoRetencion.toFixed(2)}€)`)
        }
    }
}

main().catch(console.error)
