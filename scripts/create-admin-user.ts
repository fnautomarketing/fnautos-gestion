
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { webcrypto } from 'crypto'
const crypto = webcrypto as unknown as Crypto

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function createAdminUser() {
    console.log('--- Creating Admin User ---')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const email = 'admin@stvlogistics.com'
    const password = 'password123'

    // 1. Check if user exists
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const existingUser = users.find(u => u.email === email)

    let userId = existingUser?.id

    if (existingUser) {
        console.log('User already exists. Updating password...')
        const { error } = await supabase.auth.admin.updateUserById(existingUser.id, { password })
        if (error) {
            console.error('Error updating password:', error)
            return
        }
        console.log('Password updated.')
    } else {
        console.log('Creating new user...')
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        })
        if (error) {
            console.error('Error creating user:', error)
            return
        }
        userId = data.user.id
        console.log('User created:', userId)
    }

    if (!userId) return

    // 2. Check/Create Profile & Company
    const { data: profile } = await supabase.from('perfiles').select('*').eq('user_id', userId).single()

    if (!profile) {
        console.log('Creating profile...')
        // 2a. Create Company first
        const { data: empresa, error: empError } = await supabase.from('empresas').insert({
            nombre: 'STV Global Logistics',
            cif: 'B12345678',
            direccion: 'Calle Principal 123',
            telefono: '912345678',
            email: 'info@stvlogistics.com',
            web: 'https://stvlogistics.com'
        }).select().single()

        if (empError) {
            console.error('Error creating company:', empError)
            // Try to find existing company if insert fails?
        }

        let empresaId = empresa?.id
        if (!empresaId) {
            // Fallback: try to find ANY company or generate a UUID if companies table allows random IDs (it usually depends on if companies are created dynamically)
            // Let's assume we can create one or fetch one.
            const { data: existingEmpresa } = await supabase.from('empresas').select('id').limit(1).single()
            empresaId = existingEmpresa?.id
            if (!empresaId) {
                // If creating fails and finding fails, we might be stuck, but usually insert works.
                // If schema requires UUID, let's trust the insert worked or logged error.
                // If insert failed due to constraints, we might need to handle it.
                console.log("Could not create or find company.")
            }
        }

        if (empresaId) {
            const { error: profError } = await supabase.from('perfiles').insert({
                user_id: userId,
                empresa_id: empresaId,
                rol: 'admin',
                nombre: 'Admin User',
                apellido: 'System'
            })
            if (profError) console.error('Error creating profile:', profError)
            else console.log('Profile created linked to company:', empresaId)
        }
    } else {
        console.log('Profile already exists.')
    }

    console.log('--- DONE ---')
    console.log(`Credentials:\nEmail: ${email}\nPassword: ${password}`)
}

createAdminUser().catch(console.error)
