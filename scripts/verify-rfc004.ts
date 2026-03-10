
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
    console.log('--- RFC-004 Verification Started ---')

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

    // 2. Get a client
    const { data: clientes } = await supabase
        .from('clientes')
        .select('id')
        .eq('empresa_id', perfil.empresa_id)
        .limit(1)

    if (!clientes?.length) {
        // Create dummy client if none
        console.log('Creating dummy client...')
        const { data: newClient, error: clientError } = await supabase.from('clientes').insert({
            empresa_id: perfil.empresa_id,
            nombre_fiscal: 'Test Client',
            cif: 'B12345678',
            email: 'test@client.com'
        }).select().single()
        if (clientError) throw clientError
        clientes![0] = newClient
    }

    const clienteId = clientes![0].id
    console.log(`Using Client: ${clienteId}`)

    // 3. Create Factura (Manual Insert simulating the action)
    console.log('Creating Invoice...')
    const { data: factura, error: facError } = await supabase.from('facturas').insert({
        empresa_id: perfil.empresa_id,
        serie: 'TEST',
        numero: '001',
        cliente_id: clienteId,
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

    // 4. Create Lineas
    console.log('Adding Invoice Lines...')
    const { error: linesError } = await supabase.from('lineas_factura').insert([
        {
            factura_id: factura.id,
            concepto: 'Item 1',
            cantidad: 1,
            precio_unitario: 50,
            subtotal: 50,
            iva_porcentaje: 21
        },
        {
            factura_id: factura.id,
            concepto: 'Item 2',
            cantidad: 1,
            precio_unitario: 50,
            subtotal: 50,
            iva_porcentaje: 21
        }
    ])

    if (linesError) {
        console.error('Error creating lines:', linesError)
        process.exit(1)
    }
    console.log('Lines added successfully.')

    // 5. Verify Data Retrieval (Join)
    console.log('Verifying Integrity (Join Fetch)...')
    const { data: check, error: checkError } = await supabase
        .from('facturas')
        .select('*, lineas:lineas_factura(*)')
        .eq('id', factura.id)
        .single()

    if (checkError) {
        console.error('Verification query failed:', checkError)
        process.exit(1)
    }

    if (check.lineas.length !== 2) {
        console.error(`Expected 2 lines, found ${check.lineas.length}`)
        process.exit(1)
    }

    console.log('--- Verification SUCCESS ---')
    console.log(`Invoice ${check.serie}-${check.numero} has ${check.lineas.length} lines.`)

    // Clean up
    await supabase.from('facturas').delete().eq('id', factura.id)
    console.log('Test data cleaned up.')
}

verify().catch(console.error)
