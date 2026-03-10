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

    // 2. Find Edison
    const { data: edison, error: findError } = await supabase
        .from('empresas')
        .select('id, razon_social')
        .ilike('razon_social', '%Edison%')
        .single();

    if (findError) {
        console.error('Find Edison Error:', findError);
        return;
    }

    console.log('Testing update on:', edison.razon_social, 'ID:', edison.id);

    // 3. Try Update
    const { data, error } = await supabase
        .from('empresas')
        .update({ logo_url: 'https://test-url.com/logo-edison.png', updated_at: new Date().toISOString() })
        .eq('id', edison.id)
        .select();

    if (error) console.error('Update Error:', error);
    else console.log('Update Success. Rows affected:', data?.length);
}

test();
