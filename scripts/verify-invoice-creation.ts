
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function verifyInvoiceCreation() {
    console.log('--- Verifying Invoice Creation Internal Logic ---')

    const email = 'admin@stvlogistics.com'

    // 1. Get User
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw usersError

    const user = users.find(u => u.email === email)
    if (!user) {
        console.error(`User ${email} not found.`)
        return
    }
    console.log(`User found: ${user.id}`)

    // 2. Get Company
    const { data: profile } = await supabase
        .from('perfiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

    if (!profile?.empresa_id) {
        console.error('User has no company assigned via profile.')
        return
    }
    const empresaId = profile.empresa_id
    console.log(`Empresa ID: ${empresaId}`)

    // 3. Get Client
    const { data: clientes } = await supabase
        .from('clientes')
        .select('id, nombre_fiscal')
        .eq('empresa_id', empresaId)
        .limit(1)

    if (!clientes || clientes.length === 0) {
        console.error('No clients found for this company. Invoice creation will fail in UI due to empty selector.')
        return
    }
    const cliente = clientes[0]
    console.log(`Client found: ${cliente.nombre_fiscal} (${cliente.id})`)

    // 4. Test Invoice Insertion (Simulate Frontend Submit)
    // Frontend sends: empresa_id, cliente_id, fecha_emision, fecha_vencimiento, subtotal, base_imponible, iva, total, estado='emitida'
    // Frontend DOES NOT send: serie_id, numero, serie (text)

    console.log('Attempting to insert test invoice (simulating frontend payload)...')

    const testInvoicePayload = {
        empresa_id: empresaId,
        cliente_id: cliente.id,
        fecha_emision: new Date().toISOString().split('T')[0],
        fecha_vencimiento: new Date().toISOString().split('T')[0],
        subtotal: 100,
        base_imponible: 100,
        iva: 21,
        total: 121,
        estado: 'emitida', // Simulating final emission
        notas: 'TEST INTERNAL VERIFICATION - TO BE DELETED'
    }

    const { data: factura, error: insertError } = await supabase
        .from('facturas')
        .insert(testInvoicePayload)
        .select()
        .single()

    if (insertError) {
        console.error('❌ INSERTION FAILED:', insertError.message)
        console.error('Details:', insertError)
        console.error('POSSIBLE CAUSE: Missing "serie" or "numero" generation logic in Database Triggers.')
    } else {
        console.log('✅ INSERTION SUCCESSFUL!')
        console.log('Generated Invoice ID:', factura.id)
        console.log('Generated Serie:', factura.serie)
        console.log('Generated Numero:', factura.numero)

        // 5. Cleanup
        console.log('Cleaning up test invoice...')
        await supabase.from('facturas').delete().eq('id', factura.id)
        console.log('Cleanup done.')
    }
}

verifyInvoiceCreation().catch(console.error)
