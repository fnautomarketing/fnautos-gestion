
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

async function checkUserCompanyContext() {
    console.log('--- Checking User Company Context (Backend Simulation) ---')

    const email = 'admin@stvlogistics.com'

    // 1. Get User
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw usersError

    const user = users.find(u => u.email === email)
    if (!user) {
        console.error(`User ${email} not found.`)
        return
    }
    console.log(`User found: ${user.id} (${user.email})`)

    // 2. Check table 'usuarios_empresas' (New Logic)
    console.log('\nChecking "usuarios_empresas" table...')
    const { data: userEmpresas, error: ueError } = await supabase
        .from('usuarios_empresas')
        .select(`
            id,
            empresa_id,
            rol,
            empresa_activa,
            empresa:empresas(id, razon_social)
        `)
        .eq('user_id', user.id)

    if (ueError) {
        console.error('Error fetching usuarios_empresas:', ueError)
    } else {
        console.log(`Entries in usuarios_empresas: ${userEmpresas?.length || 0}`)
        if (userEmpresas) console.dir(userEmpresas, { depth: null })
    }

    // 3. Check table 'perfiles' (Fallback Logic)
    console.log('\nChecking "perfiles" table (Fallback)...')
    const { data: perfil, error: pError } = await supabase
        .from('perfiles')
        .select('empresa_id, rol')
        .eq('user_id', user.id)
        .single()

    if (pError) {
        console.error('Error fetching profile:', pError)
    } else {
        console.log('Profile found:', perfil)
    }

    // 4. Diagnose
    if ((!userEmpresas || userEmpresas.length === 0) && perfil?.empresa_id) {
        console.log('\n❌ DIAGNOSIS: Mismatch detected!')
        console.log('User has "empresa_id" in profile but NO entry in "usuarios_empresas".')
        console.log('The "getUserContext" function returns "empresas: []" in this case, causing the empty selector.')
    } else if (userEmpresas && userEmpresas.length > 0) {
        console.log('\n✅ DIAGNOSIS: User has entries in "usuarios_empresas". Selector should work if data is correct.')
    } else {
        console.log('\n❌ DIAGNOSIS: User has NO company assigned in either table.')
    }
}

checkUserCompanyContext().catch(console.error)
