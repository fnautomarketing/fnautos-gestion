
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

async function verifyInvoiceCreation() {
    console.log('--- Verifying Invoice Creation Internal Logic ---');

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

    // 2. Get Company from Profile
    const { data: profile, error: profileError } = await supabase
        .from('perfiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single();

    if (profileError || !profile || !profile.empresa_id) {
        console.error('User has no company assigned via profile.');
        return;
    }
    const empresaId = profile.empresa_id;
    console.log(`Empresa ID: ${empresaId}`);

    // 3. Get first Client
    const { data: clientes, error: clientError } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', empresaId)
        .limit(1);

    if (clientError) {
        console.error('Error fetching clients:', clientError);
        return;
    }

    if (!clientes || clientes.length === 0) {
        console.error('No clients found for this company. Form will be empty.');
        // Try creating a dummy client internally just for the test? No, better warn user.
        return;
    }
    const cliente = clientes[0];
    console.log(`Client found: ${cliente.nombre_fiscal} (${cliente.id})`);

    // 4. Test Invoice Insertion (Simulate Frontend Submit)
    // The frontend sends these fields. It relies on DB triggers for 'serie' and 'numero'.
    const testInvoicePayload = {
        empresa_id: empresaId,
        cliente_id: cliente.id,
        fecha_emision: new Date().toISOString().split('T')[0],
        fecha_vencimiento: new Date().toISOString().split('T')[0],
        subtotal: 100,
        base_imponible: 100,
        iva: 21,
        total: 121,
        estado: 'emitida',
        notas: 'TEST INTERNAL VERIFICATION - TO BE DELETED',
        divisa: 'EUR',
        tipo_cambio: 1.0,
        descuento_tipo: 'porcentaje',
        descuento_valor: 0,
        importe_descuento: 0
    };

    console.log('Attempting to insert test invoice...');

    const { data: factura, error: insertError } = await supabase
        .from('facturas')
        .insert(testInvoicePayload)
        .select()
        .single();

    if (insertError) {
        console.error('❌ INSERTION FAILED:', insertError.message);
        console.error('Details:', insertError);
    } else {
        console.log('✅ INSERTION SUCCESSFUL!');
        console.log('Generated Invoice ID:', factura.id);
        console.log('Generated Serie:', factura.serie);
        console.log('Generated Numero:', factura.numero);

        if (!factura.serie || !factura.numero) {
            console.warn('⚠️ WARNING: Serie or Numero is missing even after successful insertion!');
        }

        // 5. Cleanup
        console.log('Cleaning up test invoice...');
        const { error: deleteError } = await supabase.from('facturas').delete().eq('id', factura.id);
        if (deleteError) console.error('Error cleaning up:', deleteError);
        else console.log('Cleanup done.');
    }
}

verifyInvoiceCreation().catch(error => {
    console.error('Script Error:', error);
    process.exit(1);
});
