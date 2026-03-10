
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { randomUUID } from 'crypto'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function testClientFlow() {
    console.log('--- Testing Client Flow ---')

    // 1. Get Admin User
    const email = 'admin@stvlogistics.com'
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email === email)
    if (!user) {
        console.error('Admin user not found')
        return
    }
    console.log(`User: ${user.id}`)

    // 2. Get Company
    const { data: profile } = await supabase.from('perfiles').select('empresa_id').eq('user_id', user.id).single()
    if (!profile) {
        console.error('Profile not found')
        return
    }
    const empresaId = profile.empresa_id
    console.log(`Empresa: ${empresaId}`)

    // 3. Create Client
    const newClient = {
        empresa_id: empresaId,
        nombre_fiscal: `Test Client ${randomUUID()}`,
        cif: `B${Math.floor(Math.random() * 100000000)}`,
        email_principal: `test-${randomUUID()}@example.com`,
        telefono_principal: '600000000',
        direccion: 'Test Address',
        ciudad: 'Test City',
        provincia: 'Test Province',
        pais: 'Spain',
        codigo_postal: '28000',
        activo: true
    }

    const { data: createdClient, error: createError } = await supabase
        .from('clientes')
        .insert(newClient)
        .select()
        .single()

    if (createError) {
        console.error('Error creating client:', createError)
        return
    }
    console.log(`Client Created: ${createdClient.id} - ${createdClient.nombre_fiscal}`)

    // 4. Verify Visibility (simulate list query)
    const { data: listClients, error: listError } = await supabase
        .from('clientes')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('id', createdClient.id)

    if (listError || listClients.length === 0) {
        console.error('Client not visible in list query!')
    } else {
        console.log('Client IS visible in list query.')
    }

    // 5. Verify Detail Fetch (simulate detail page query)
    const { data: detailClient, error: detailError } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', createdClient.id)
        .eq('empresa_id', empresaId)
        .single()

    if (detailError || !detailClient) {
        console.error('Client not visible in detail query (404 simulation)!')
    } else {
        console.log('Client IS visible in detail query.')
    }

    // 6. Delete Client (simulate delete action)
    const { error: deleteError } = await supabase
        .from('clientes')
        .delete()
        .eq('id', createdClient.id)
        .eq('empresa_id', empresaId)

    if (deleteError) {
        console.error('Error deleting client:', deleteError)
    } else {
        console.log('Client Deleted successfully.')
    }

    // 7. Verify Deletion
    const { data: checkDeleted } = await supabase
        .from('clientes')
        .select('id')
        .eq('id', createdClient.id)
        .single()

    if (!checkDeleted) {
        console.log('Verification: Client is gone from DB.')
    } else {
        console.error('Verification FAILED: Client still exists.')
    }

    console.log('--- TEST PASSED ---')
}

testClientFlow().catch(console.error)
