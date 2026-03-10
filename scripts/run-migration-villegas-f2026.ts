/**
 * Ejecuta la migración: corrige serie Villegas a formato F2026-0001
 * Elimina facturas de Villegas y ajusta la serie F2026 con 4 dígitos.
 *
 * Uso: npx ts-node scripts/run-migration-villegas-f2026.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Faltan credenciales: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
})

const EMPRESA_VILLEGAS_ID = '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5'

async function main() {
    console.log('--- Migración Villegas F2026 ---')

    // 1. Obtener IDs de facturas Villegas
    const { data: facturas, error: errFac } = await supabase
        .from('facturas')
        .select('id')
        .eq('empresa_id', EMPRESA_VILLEGAS_ID)

    if (errFac) {
        console.error('Error obteniendo facturas:', errFac.message)
        process.exit(1)
    }

    const facturaIds = (facturas || []).map((f: { id: string }) => f.id)
    console.log(`Facturas Villegas a eliminar: ${facturaIds.length}`)

    if (facturaIds.length > 0) {
        // 2. Eliminar datos relacionados
        for (const table of ['eventos_factura', 'pagos_factura', 'emails_factura', 'lineas_factura']) {
            const { error } = await supabase.from(table).delete().in('factura_id', facturaIds)
            if (error) {
                console.error(`Error en ${table}:`, error.message)
            } else {
                console.log(`  ✓ ${table}`)
            }
        }

        // 3. Eliminar facturas
        const { error: errDel } = await supabase.from('facturas').delete().eq('empresa_id', EMPRESA_VILLEGAS_ID)
        if (errDel) {
            console.error('Error eliminando facturas:', errDel.message)
            process.exit(1)
        }
        console.log('  ✓ facturas eliminadas')
    }

    // 4. Desactivar predeterminada en todas las series Villegas
    await supabase.from('series_facturacion').update({ predeterminada: false }).eq('empresa_id', EMPRESA_VILLEGAS_ID)

    // 5. Actualizar o crear F2026
    const { data: serieF2026 } = await supabase
        .from('series_facturacion')
        .select('id')
        .eq('empresa_id', EMPRESA_VILLEGAS_ID)
        .eq('codigo', 'F2026')
        .single()

    if (serieF2026) {
        const { error } = await supabase
            .from('series_facturacion')
            .update({
                digitos: 4,
                numero_actual: 1,
                facturas_emitidas: 0,
                predeterminada: true
            })
            .eq('empresa_id', EMPRESA_VILLEGAS_ID)
            .eq('codigo', 'F2026')
        if (error) {
            console.error('Error actualizando F2026:', error.message)
        } else {
            console.log('  ✓ Serie F2026 actualizada (digitos=4, numero_actual=1)')
        }
    } else {
        const { error } = await supabase.from('series_facturacion').insert({
            empresa_id: EMPRESA_VILLEGAS_ID,
            codigo: 'F2026',
            nombre: 'Facturación Villegas 2026',
            prefijo: '',
            sufijo: '',
            digitos: 4,
            numero_inicial: 1,
            numero_actual: 1,
            facturas_emitidas: 0,
            reseteo: 'anual',
            activa: true,
            predeterminada: true
        })
        if (error) {
            console.error('Error creando F2026:', error.message)
        } else {
            console.log('  ✓ Serie F2026 creada')
        }
    }

    // 6. Quitar predeterminada de V2026
    await supabase
        .from('series_facturacion')
        .update({ predeterminada: false })
        .eq('empresa_id', EMPRESA_VILLEGAS_ID)
        .eq('codigo', 'V2026')

    console.log('--- Migración completada ---')
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
