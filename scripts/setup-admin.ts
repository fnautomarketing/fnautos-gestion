
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars desde la raíz del proyecto (compatible con ESM/CJS)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function setupAdmin() {
    console.log('--- Setting up Global Admin: administracion@stvls.com ---')

    const email = 'administracion@stvls.com'
    const password = 'TecM@s.$4' // Standard initial password

    // 1. Check if user exists, if so get ID, if not create
    let userId
    const { data: usersResponse, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    const existingUser = usersResponse.users.find(u => u.email === email)

    if (existingUser) {
        console.log(`User ${email} already exists. ID: ${existingUser.id}`)
        userId = existingUser.id
        // Update password just in case
        await supabase.auth.admin.updateUserById(userId, { password: password })
        console.log('Password updated.')
    } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: 'Administración STVLS' }
        })
        if (createError) throw createError
        console.log(`User created. ID: ${newUser.user.id}`)
        userId = newUser.user.id
    }

    // 2. Identify the 3 target companies + "Mi Empresa" (system default)
    // We want to link the user to ALL companies found in the DB
    const { data: companies, error: companiesError } = await supabase.from('empresas').select('id, razon_social')
    if (companiesError) throw companiesError

    console.log('Found companies:', companies.map(c => c.razon_social).join(', '))

    // 3. Link user to companies
    // First, remove existing links for this user to avoid duplicates if re-running
    await supabase.from('usuarios_empresas').delete().eq('user_id', userId)

    const links = companies.map(c => ({
        user_id: userId,
        empresa_id: c.id,
        rol: 'administrador',
        empresa_activa: false // Will set one as active later
    }))

    // Set the first one (STVLS preferably) as active
    const stvls = companies.find(c => c.razon_social.includes('Villegas') || c.razon_social.includes('STVLS'))
    if (stvls) {
        const link = links.find(l => l.empresa_id === stvls.id)
        if (link) link.empresa_activa = true
    } else if (links.length > 0) {
        links[0].empresa_activa = true
    }

    const { error: linkError } = await supabase.from('usuarios_empresas').insert(links)
    if (linkError) throw linkError
    console.log(`Linked user to ${links.length} companies.`)

    // 4. Delete ALL other users
    const usersToDelete = usersResponse.users.filter(u => u.email !== email).map(u => u.id)

    if (usersToDelete.length > 0) {
        console.log(`Deleting ${usersToDelete.length} old users...`)
        for (const uid of usersToDelete) {
            const { error: delError } = await supabase.auth.admin.deleteUser(uid)
            if (delError) console.error(`Failed to delete user ${uid}:`, delError)
            else console.log(`Deleted user ${uid}`)
        }
    } else {
        console.log('No other users to delete.')
    }


    // 5. Update perfiles table
    console.log('--- Updating Profiles ---')
    const activeLink = links.find(l => l.empresa_activa) || links[0]
    if (activeLink) {
        const { error: profileError } = await supabase
            .from('perfiles')
            .upsert({
                user_id: userId,
                empresa_id: activeLink.empresa_id,
                rol: 'admin'
            }, { onConflict: 'user_id' })

        if (profileError) console.error('Error updating profile:', profileError)
        else console.log(`Updated perfiles for user ${userId} with company ${activeLink.empresa_id}`)
    }

    console.log('--- Setup Complete ---')
    console.log(`Credentials: ${email} / ${password}`)
}

setupAdmin().catch(console.error)
