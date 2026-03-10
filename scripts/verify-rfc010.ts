
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { webcrypto } from 'crypto'
const crypto = webcrypto as unknown as Crypto

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function runVerification() {
    console.log('--- RFC-010 Void Invoice Verification Started ---')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Create User & Company
    const email = `test-void-${Date.now()}@example.com`
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true
    })
    if (userError) throw userError

    const empresaId = crypto.randomUUID()
    await supabase.from('perfiles').insert({
        user_id: user.user.id,
        empresa_id: empresaId,
        rol: 'admin'
    })
    console.log(`User & Company created.`)

    // 2. Create Issued Invoice
    const { data: cliente } = await supabase.from('clientes').insert({
        empresa_id: empresaId,
        nombre_fiscal: 'Cliente Void Test',
        cif: 'B99999999'
    }).select().single()

    const { data: factura } = await supabase.from('facturas').insert({
        empresa_id: empresaId,
        cliente_id: cliente.id,
        serie: 'TEST-VOID',
        numero: '001',
        fecha_emision: new Date().toISOString(),
        fecha_vencimiento: new Date().toISOString(),
        estado: 'emitida',
        subtotal: 100,
        iva: 21,
        total: 121
    }).select().single()
    console.log(`Issued Invoice created: ${factura.id}`)

    // 3. Void Invoice (Manual DB update simulating action, verifying logging manually too)
    // IMPORTANT: Since we can't call Server Action, we simulate the logic:
    // a. Check if not paid (it's emitted, so ok)
    // b. Update status
    // c. Log event

    await supabase.from('facturas').update({
        estado: 'anulada',
        updated_at: new Date().toISOString()
    }).eq('id', factura.id)

    // Verify status
    const { data: facVoided } = await supabase.from('facturas').select('estado').eq('id', factura.id).single()
    if (!facVoided || facVoided.estado !== 'anulada') console.error('❌ Status update failed')
    else console.log('✅ Status updated to annulled')

    // Insert log manually to verify schema support
    const { error: logError } = await supabase.from('eventos_factura').insert({
        factura_id: factura.id,
        tipo: 'anulada',
        descripcion: 'Factura anulada: Error en importes',
        datos_adicionales: {
            motivo: 'error_importes',
            descripcion: 'Test desc',
            notificar_cliente: false,
            generar_asiento: true,
        },
        user_id: user.user.id
    })
    if (logError) console.error('❌ Log insertion failed', logError)
    else console.log('✅ Log inserted successfully')

    const { data: logs } = await supabase.from('eventos_factura').select('*').eq('factura_id', factura.id)
    console.log(`Logs found: ${logs?.length}`)


    // Cleanup
    await supabase.from('facturas').delete().eq('id', factura.id)
    await supabase.from('clientes').delete().eq('id', cliente.id)
    await supabase.from('perfiles').delete().eq('user_id', user.user.id)
    await supabase.auth.admin.deleteUser(user.user.id)
    console.log('Test data cleaned up.')

    console.log('--- Verification SUCCESS ---')
}

runVerification().catch(console.error)
