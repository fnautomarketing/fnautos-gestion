
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function debugAdminAccess() {
    console.log('--- Debugging Admin Access ---');

    const email = 'admin@stvlogistics.com';

    // 1. Get User
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const user = users.find(u => u.email === email);
    if (!user) {
        console.error(`User ${email} not found.`);
        return;
    }
    console.log(`User found: ${user.id} (${user.email})`);

    // 2. Check Profile Role
    const { data: perfil, error: pError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (pError) {
        console.error('Error fetching profile:', pError);
    } else {
        console.log(`Profile Role: ${perfil.rol}`);
        if (perfil.rol === 'admin') {
            console.log('✅ User IS an Admin.');
        } else {
            console.log('❌ User is NOT an Admin.');
        }
    }

    // 3. fetch ALL companies (what admin SHOULD see)
    const { data: allCompanies, error: cError } = await supabase
        .from('empresas')
        .select('id, razon_social')
        .eq('activo', true);

    if (cError) {
        console.error('Error fetching all companies:', cError);
    } else {
        console.log(`Total Active Companies in DB: ${allCompanies.length}`);
        allCompanies.forEach(c => console.log(` - ${c.razon_social} (${c.id})`));
    }

    // 4. Fetch linked companies (what getUserContext currently sees)
    const { data: linkedCompanies, error: lError } = await supabase
        .from('usuarios_empresas')
        .select('empresa_id')
        .eq('user_id', user.id);

    if (lError) {
        console.error('Error fetching linked companies:', lError);
    } else {
        console.log(`Companies explicitly linked to user: ${linkedCompanies.length}`);
        if (linkedCompanies.length < allCompanies.length) {
            console.log('⚠️ OBSERVATION: Admin is not linked to all companies. Code update required.');
        }
    }
}

debugAdminAccess().catch(console.error);
