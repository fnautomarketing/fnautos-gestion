
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verify() {
    console.log('--- RFC-005 Verification Started ---')

    // 1. Get a user and their company
    const { data: perfiles, error: perfilError } = await supabase
        .from('perfiles')
        .select('user_id, empresa_id')
        .limit(1)

    if (perfilError || !perfiles.length) {
        console.error('No profiles found or error:', perfilError)
        return
    }

    const perfil = perfiles[0]
    console.log(`Using Profile: User ${perfil.user_id}, Company: ${perfil.empresa_id}`)

    // 2. Create a Test Invoice (Trigger should create event)
    console.log('Creating Test Invoice to check Trigger...')
    const { data: cliente } = await supabase.from('clientes').select('id').eq('empresa_id', perfil.empresa_id).limit(1).single()

    if (!cliente) {
        console.error('Need a client to test.')
        return
    }

    const { data: factura, error: facError } = await supabase.from('facturas').insert({
        empresa_id: perfil.empresa_id,
        serie: 'TEST-EVT',
        numero: '001',
        cliente_id: cliente.id,
        fecha_emision: new Date().toISOString(),
        fecha_vencimiento: new Date().toISOString(),
        subtotal: 100,
        base_imponible: 100,
        iva: 21,
        total: 121,
        estado: 'borrador'
    }).select().single()

    if (facError) {
        console.error('Error creating invoice:', facError)
        process.exit(1)
    }
    console.log(`Invoice Created: ${factura.id}`)

    // 3. Verify Automatic Event Creation (Trigger)
    console.log('Verifying Event Auto-Creation...')
    const { data: eventos, error: evtError } = await supabase
        .from('eventos_factura')
        .select('*')
        .eq('factura_id', factura.id)

    if (evtError) {
        console.error('Error fetching events:', evtError)
    } else {
        console.log(`Events found: ${eventos.length}`)
        eventos.forEach(e => console.log(`- Event: ${e.tipo} | ${e.descripcion}`))
        if (eventos.length === 0) console.error('FAIL: No event created by trigger.')
    }

    // 4. Test Manual Event Insertion (RLS check implicit if using authenticated client, here we use service role so we just check schema)
    console.log('Inserting manual "enviado" event...')
    const { error: manEvtError } = await supabase.from('eventos_factura').insert({
        factura_id: factura.id,
        tipo: 'enviado',
        descripcion: 'Factura enviada por email manual',
        user_id: perfil.user_id
    })
    if (manEvtError) console.error('Error inserting manual event:', manEvtError)
    else console.log('Manual event inserted.')

    // 5. Test Payment Insertion
    console.log('Inserting partial payment...')
    const { error: payError } = await supabase.from('pagos_factura').insert({
        factura_id: factura.id,
        fecha_pago: new Date().toISOString(),
        importe: 50.00,
        metodo_pago: 'transferencia',
        notas: 'Pago parcial prueba'
    })
    if (payError) console.error('Error inserting payment:', payError)
    else console.log('Payment inserted.')

    // 6. Verify Full Fetch (Simulating Page Load)
    console.log('Verifying Integrity (Full Page Load simulation)...')
    const { data: fullData, error: fullError } = await supabase
        .from('facturas')
        .select(`
        *,
        cliente:clientes(*),
        lineas:lineas_factura(*),
        eventos:eventos_factura(*),
        pagos:pagos_factura(*)
    `)
        .eq('id', factura.id)
        .single()

    if (fullError) console.error('Full fetch failed:', fullError)
    else {
        // Note: Relation names in select string might need exact match to foreign key names or defined relations. 
        // If direct relation linking via syntax fails, we fetch separately as page does.
        // The page fetches events and payments separately, so let's verify that logic.

        const { count: eventsCount } = await supabase.from('eventos_factura').select('*', { count: 'exact', head: true }).eq('factura_id', factura.id)
        const { count: paymentsCount } = await supabase.from('pagos_factura').select('*', { count: 'exact', head: true }).eq('factura_id', factura.id)

        console.log(`--- Verification Summary ---`)
        console.log(`Invoice: ${fullData.serie}-${fullData.numero}`)
        console.log(`Events count: ${eventsCount} (Expected >= 2)`)
        console.log(`Payments count: ${paymentsCount} (Expected 1)`)

        if (eventsCount && eventsCount >= 2 && paymentsCount === 1) {
            console.log('HASH: SUCCESS_RFC_005')
        } else {
            console.error('HASH: FAILURE_COUNTS_MISMATCH')
        }
    }

    // Cleanup
    await supabase.from('facturas').delete().eq('id', factura.id)
    console.log('Test data cleaned up.')
}

verify().catch(console.error)
