
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

async function fixClientVisibility() {
    console.log('--- Fixing Client Visibility ---')

    const email = 'admin@stvlogistics.com'

    // 1. Get User
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw usersError

    const user = users.find(u => u.email === email)
    if (!user) {
        console.error(`User ${email} not found. Run create-admin-user.ts first.`)
        return
    }

    console.log(`Found user: ${user.id}`)

    // 2. Get Company from Profile
    const { data: profile, error: profileError } = await supabase
        .from('perfiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

    if (profileError || !profile) {
        console.error('Profile not found', profileError)
        return
    }

    const empresaId = profile.empresa_id
    console.log(`Target Empresa ID: ${empresaId}`)

    // 3. Update Clients
    // We will update ALL clients to belong to this company for visibility in this dev environment
    const { error: updateError, count } = await supabase
        .from('clientes')
        .update({ empresa_id: empresaId })
        .neq('empresa_id', empresaId) // Update only if different
        .select('*')

    if (updateError) {
        console.error('Error updating clients:', updateError)
    } else {
        console.log(`Updated clients to empresa_id: ${empresaId}`)
    }

    console.log('--- DONE ---')
}

fixClientVisibility().catch(console.error)
