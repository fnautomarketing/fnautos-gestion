
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

async function fixUserCompanyContext() {
    console.log('--- Fixing User Company Context (Data Migration) ---');

    const email = 'admin@stvlogistics.com';

    // 1. Get User
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const user = users.find(u => u.email === email);
    if (!user) {
        console.error(`User ${email} not found.`);
        return;
    }
    console.log(`User found: ${user.id}`);

    // 2. Get Profile Company
    const { data: perfil, error: pError } = await supabase
        .from('perfiles')
        .select('empresa_id, rol')
        .eq('user_id', user.id)
        .single();

    if (!perfil?.empresa_id) {
        console.error('User has no company in profile either. Cannot fix.');
        return;
    }
    console.log(`Target Empresa ID: ${perfil.empresa_id}`);

    // 3. Insert into usuarios_empresas
    console.log('Inserting missing record into "usuarios_empresas"...');

    const { error: insertError } = await supabase
        .from('usuarios_empresas')
        .insert({
            user_id: user.id,
            empresa_id: perfil.empresa_id,
            rol: perfil.rol || 'administrador',
            empresa_activa: true
        });

    if (insertError) {
        console.error('Error inserting record:', insertError);
    } else {
        console.log('✅ FIX APPLIED: User successfully linked to company in "usuarios_empresas".');
        console.log('The Company Selector in the Frontend should now work correctly.');
    }
}

fixUserCompanyContext().catch(console.error);
