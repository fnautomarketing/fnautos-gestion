
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

async function verifyAdminLogic() {
    console.log('--- Verifying Admin Logic Simulation ---');

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

    // 2. Fetch User Companies (Simulate existing getUserContext)
    const { data: userEmpresas, error: ueError } = await supabase
        .from('usuarios_empresas')
        .select('id, empresa_id, empresa_activa, rol')
        .eq('user_id', user.id);

    if (ueError) throw ueError;
    console.log(`Initial User Companies: ${userEmpresas.length}`);

    // 3. Fetch Profile (Check Admin)
    const { data: perfil, error: pError } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('user_id', user.id)
        .single();

    if (pError) throw pError;
    console.log(`Profile Role: ${perfil.rol}`);

    const isAdmin = perfil.rol === 'admin';
    let allEmpresas = userEmpresas || [];

    // 4. Simulate the Logic
    if (isAdmin) {
        console.log('User is Admin. Fetching ALL companies...');
        const { data: todasLasEmpresas, error: cError } = await supabase
            .from('empresas')
            .select('id, razon_social, nombre_comercial, logo_url, tipo_empresa');

        if (cError) throw cError;

        if (todasLasEmpresas) {
            console.log(`Total Companies in DB: ${todasLasEmpresas.length}`);

            const existingIds = new Set(allEmpresas.map(ue => ue.empresa_id));
            const additionalEmpresas = todasLasEmpresas
                .filter(e => !existingIds.has(e.id))
                .map(e => ({
                    id: e.id, // Virtual ID using company ID
                    empresa_id: e.id,
                    rol: 'admin',
                    empresa_activa: false,
                    empresa: e
                }));

            allEmpresas = [...allEmpresas, ...additionalEmpresas];
            console.log(`Merged Companies (Final List): ${allEmpresas.length}`);

            allEmpresas.forEach(ue => {
                console.log(` - Company ID: ${ue.empresa_id} | Role: ${ue.rol} | Active: ${ue.empresa_activa}`);
            });

            if (allEmpresas.length > userEmpresas.length) {
                console.log('✅ SUCCESS: Admin logic correctly expands access to all companies.');
            } else if (allEmpresas.length === todasLasEmpresas.length) {
                console.log('✅ SUCCESS: User already had access to all companies via logic.');
            } else {
                console.log('⚠️ WARNING: Logic did not add any new companies (perhaps only 1 exists?).');
            }
        }
    } else {
        console.log('❌ User is NOT Admin. Skipping global fetch.');
    }
}

verifyAdminLogic().catch(console.error);
