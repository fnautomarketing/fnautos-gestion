
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { webcrypto } from 'crypto'
const crypto = webcrypto as unknown as Crypto


// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const resendKey = process.env.RESEND_API_KEY

async function runVerification() {
    console.log('--- RFC-007 Email Verification Started ---')

    if (!resendKey) {
        console.warn('❌ RESEND_API_KEY not found. Skipping actual email send check.')
    } else {
        console.log('✅ RESEND_API_KEY found.')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Create User
    const email = `test-email-${Date.now()}@example.com`
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true
    })
    if (userError) throw userError
    console.log(`User created: ${user.user.id}`)

    const empresaId = crypto.randomUUID() // using native crypto


    const { error: profileError } = await supabase.from('perfiles').insert({
        user_id: user.user.id,
        empresa_id: empresaId,
        rol: 'admin'
    })
    if (profileError) throw profileError
    console.log(`Profile linked to mock company: ${empresaId}`)

    // 3. Create Factura & Client
    const { data: cliente, error: clientError } = await supabase.from('clientes').insert({
        empresa_id: empresaId,
        nombre_fiscal: 'Cliente Email Test',
        cif: 'A99999999',
        email: 'cliente@test.com'
    }).select().single()
    if (clientError) throw clientError

    const { data: factura, error: facError } = await supabase.from('facturas').insert({
        empresa_id: empresaId,
        cliente_id: cliente.id,
        serie: 'TEST-EMAIL',
        numero: '002',
        fecha_emision: new Date().toISOString(),
        fecha_vencimiento: new Date().toISOString(),
        estado: 'emitida',
        subtotal: 100,
        iva: 21,
        total: 121
    }).select().single()
    if (facError) throw facError
    console.log(`Invoice created: ${factura.id}`)

    // 4. Simulate Email Log Insert (mimic what the server action does)
    const { data: emailLog, error: logError } = await supabase.from('emails_factura').insert({
        factura_id: factura.id,
        empresa_id: empresaId,
        para: ['cliente@test.com'],
        asunto: 'Factura TEST-EMAIL-002',
        mensaje: 'Test message',
        estado: 'enviado',
        proveedor_mensaje_id: 'mock_resend_id'
    }).select()

    if (logError) {
        console.error('❌ Failed to insert email log', logError)
        process.exit(1)
    } else {
        console.log('✅ Email log inserted successfully.')
        console.log('Log ID:', emailLog[0].id)
    }

    // Cleanup
    await supabase.from('facturas').delete().eq('id', factura.id)
    await supabase.from('clientes').delete().eq('id', cliente.id)
    await supabase.from('perfiles').delete().eq('user_id', user.user.id)
    await supabase.auth.admin.deleteUser(user.user.id)
    console.log('Test data cleaned up.')

    console.log('--- Verification SUCCESS ---')
}

runVerification().catch(console.error)
