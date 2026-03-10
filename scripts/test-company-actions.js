const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERROR: Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompanyActions() {
    console.log('\n=== TEST COMPANY ACTIONS ===\n');

    try {
        // 1. Crear empresa de prueba
        console.log('1️⃣  Creando empresa de prueba...');
        const { data: newEmpresa, error: createError } = await supabase
            .from('empresas')
            .insert({
                razon_social: 'Test Actions Company SL',
                cif: 'B99999999',
                tipo_empresa: 'sl',
                ciudad: 'Test City',
                activo: true
            })
            .select()
            .single();

        if (createError) throw createError;
        console.log(`✅ Empresa creada: ${newEmpresa.razon_social} (ID: ${newEmpresa.id})`);

        // 2. Verificar que está activa
        console.log('\n2️⃣  Verificando estado activo...');
        const { data: empresaActiva } = await supabase
            .from('empresas')
            .select('activo')
            .eq('id', newEmpresa.id)
            .single();

        if (empresaActiva.activo) {
            console.log('✅ Empresa está activa');
        } else {
            throw new Error('Empresa debería estar activa');
        }

        // 3. Desactivar empresa (toggle)
        console.log('\n3️⃣  Desactivando empresa...');
        const { error: toggleError } = await supabase
            .from('empresas')
            .update({ activo: false })
            .eq('id', newEmpresa.id);

        if (toggleError) throw toggleError;

        const { data: empresaInactiva } = await supabase
            .from('empresas')
            .select('activo')
            .eq('id', newEmpresa.id)
            .single();

        if (!empresaInactiva.activo) {
            console.log('✅ Empresa desactivada correctamente');
        } else {
            throw new Error('Empresa debería estar inactiva');
        }

        // 4. Reactivar empresa
        console.log('\n4️⃣  Reactivando empresa...');
        const { error: reactivateError } = await supabase
            .from('empresas')
            .update({ activo: true })
            .eq('id', newEmpresa.id);

        if (reactivateError) throw reactivateError;
        console.log('✅ Empresa reactivada correctamente');

        // 5. Intentar eliminar empresa (verificar que no tiene facturas)
        console.log('\n5️⃣  Verificando que no tiene facturas...');
        const { count } = await supabase
            .from('facturas')
            .select('*', { count: 'exact', head: true })
            .eq('empresa_id', newEmpresa.id);

        if (count === 0) {
            console.log('✅ Empresa no tiene facturas asociadas');
        } else {
            throw new Error(`Empresa tiene ${count} facturas`);
        }

        // 6. Eliminar empresa (soft delete)
        console.log('\n6️⃣  Eliminando empresa (soft delete)...');
        const { error: deleteError } = await supabase
            .from('empresas')
            .update({ activo: false })
            .eq('id', newEmpresa.id);

        if (deleteError) throw deleteError;
        console.log('✅ Empresa eliminada (marcada como inactiva)');

        // 7. Limpiar: eliminar empresa de prueba
        console.log('\n7️⃣  Limpiando: eliminando empresa de prueba...');
        const { error: cleanupError } = await supabase
            .from('empresas')
            .delete()
            .eq('id', newEmpresa.id);

        if (cleanupError) throw cleanupError;
        console.log('✅ Empresa de prueba eliminada de la base de datos');

        console.log('\n=== ✅ TODOS LOS TESTS DE ACCIONES PASARON ===\n');
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testCompanyActions();
