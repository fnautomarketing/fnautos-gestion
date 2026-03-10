const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const email = 'logo-tester@stvls.com';
const password = 'LogoTester123!';

async function createAdmin() {
    // 1. Check if user exists
    let { data: { users }, error } = await supabase.auth.admin.listUsers();
    let user = users.find(u => u.email === email);

    if (!user) {
        console.log('Creating user...');
        const { data, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });
        if (createError) throw createError;
        user = data.user;
    } else {
        console.log('User exists.');
        // Update password just in case
        await supabase.auth.admin.updateUserById(user.id, { password });
    }

    // 2. Assign to a company (create one if needed)
    const { data: empresa } = await supabase.from('empresas').select('id').limit(1).single();
    let empresaId = empresa?.id;

    if (!empresaId) {
        const { data: newEmpresa } = await supabase.from('empresas').insert({
            razon_social: 'Test Corp',
            cif: 'B12345678',
            updated_at: new Date().toISOString()
        }).select().single();
        empresaId = newEmpresa.id;
    }

    // 3. Update Profile to 'admin'
    const { error: profileError } = await supabase
        .from('perfiles')
        .upsert({
            user_id: user.id,
            empresa_id: empresaId,
            rol: 'admin',
        }, { onConflict: 'user_id' });

    if (profileError) {
        console.error('Profile Error:', profileError);
    } else {
        console.log('User ready:', email, password);
    }
}

createAdmin().catch(console.error);
