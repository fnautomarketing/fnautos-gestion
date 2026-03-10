#!/usr/bin/env node
/**
 * Aplica retención -1% a facturas Edison existentes (E2026-0001, etc.)
 * Ejecutar tras migración 20260305 o manualmente si no usas Supabase CLI.
 *
 * Uso: node scripts/aplicar-retencion-edison.mjs
 * Requiere: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local
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

    const { data: facturas, error } = await supabase
        .from('facturas')
        .select('id, serie, numero, base_imponible, iva, total, estado, retencion_porcentaje')
        .eq('empresa_id', EMPRESA_EDISON_ID)
        .not('estado', 'in', '("anulada","borrador")')
        .or('retencion_porcentaje.is.null,retencion_porcentaje.eq.0')

    if (error) {
        console.error('Error:', error)
        process.exit(1)
    }
    if (!facturas?.length) {
        console.log('No hay facturas Edison sin retención que actualizar.')
        return
    }

    for (const f of facturas) {
        const importeRetencion = Math.round(f.base_imponible * 0.01 * 100) / 100
        const nuevoTotal = Math.round((f.base_imponible + f.iva - importeRetencion) * 100) / 100
        const updates = {
            retencion_porcentaje: -1,
            importe_retencion: importeRetencion,
            total: nuevoTotal,
        }
        if (f.estado === 'pagada') updates.pagado = nuevoTotal

        const { error: upd } = await supabase
            .from('facturas')
            .update(updates)
            .eq('id', f.id)

        if (upd) {
            console.error(`Error actualizando ${f.serie}-${f.numero}:`, upd)
        } else {
            console.log(`✓ ${f.serie}-${f.numero}: retención -1%, total ${nuevoTotal}€`)
        }
    }
    console.log(`\nActualizadas ${facturas.length} factura(s) de Edison.`)
}

main().catch(console.error)
