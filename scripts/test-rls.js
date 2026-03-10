const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    // 1. Login
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'logo-tester@stvls.com',
        password: 'LogoTester123!'
    });
    if (loginError) {
        console.error('Login Error:', loginError);
        return;
    }

    console.log('User ID:', session.user.id);

    // 2. Get target company ID (Use Service Role to find one, or just search as user)
    // As admin, user should see all companies.
    const { data: companies, error: listError } = await supabase.from('empresas').select('id, razon_social').limit(1);

    if (listError) console.error('List Error:', listError);
    if (!companies || companies.length === 0) {
        console.log('No companies visible to user.');
        return;
    }

    const empresaId = companies[0].id;
    console.log('Testing update on:', companies[0].razon_social, 'ID:', empresaId);

    // 3. Try Update
    const { data, error } = await supabase
        .from('empresas')
        .update({ logo_url: 'https://test-url.com/logo-debug.png', updated_at: new Date().toISOString() })
        .eq('id', empresaId)
        .select();

    if (error) console.error('Update Error:', error);
    else console.log('Update Success. Rows affected:', data?.length);
}

test();
