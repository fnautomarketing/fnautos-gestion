const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERROR: Missing Supabase credentials in .env.local');
    // Try .env if .env.local failed
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error('❌ ERROR: Completely unable to find credentials.');
        process.exit(1);
    }
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySync() {
    console.log('\n🔄 INICIANDO VERIFICACIÓN DE SINCRONIZACIÓN DB 🔄\n');

    const testCif = 'B99887766';
    const testName = 'Sync Verification Corp';

    try {
        // 1. Limpieza previa (por si acaso quedó sucio de antes)
        const { error: cleanError } = await supabase
            .from('empresas')
            .delete()
            .eq('cif', testCif); // Hard delete for clean state if possible, or soft if RLS allows

        // Since hard delete might be blocked by RLS even for service role if not careful, 
        // but service role bypasses RLS usually.

        // 2. INSERTAR
        console.log(`1️⃣  Insertando empresa de prueba: ${testName} (${testCif})...`);
        const { data: inserted, error: insertError } = await supabase
            .from('empresas')
            .insert({
                razon_social: testName,
                cif: testCif,
                direccion: 'Calle de Prueba 123',
                ciudad: 'Testopolis',
                pais: 'España',
                activo: true
            })
            .select()
            .single();

        if (insertError) throw new Error(`Falló inserción: ${insertError.message}`);
        console.log('   ✅ Inserción exitosa en Supabase. ID:', inserted.id);

        // 3. VERIFICAR LECTURA
        console.log('\n2️⃣  Verificando que la empresa existe en la DB...');
        const { data: fetched, error: fetchError } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', inserted.id)
            .single();

        if (fetchError) throw new Error(`Falló lectura: ${fetchError.message}`);

        if (fetched.razon_social === testName && fetched.cif === testCif) {
            console.log('   ✅ Datos verificados: La empresa está en la DB con los datos correctos.');
        } else {
            throw new Error('Datos leídos no coinciden con los insertados.');
        }

        // 4. ACTUALIZAR
        console.log('\n3️⃣  Actualizando nombre a "Sync Updated Corp"...');
        const { error: updateError } = await supabase
            .from('empresas')
            .update({ razon_social: 'Sync Updated Corp' })
            .eq('id', inserted.id);

        if (updateError) throw new Error(`Falló actualización: ${updateError.message}`);

        const { data: updated } = await supabase.from('empresas').select('razon_social').eq('id', inserted.id).single();
        console.log(`   ✅ Actualización exitosa. Nuevo nombre en DB: "${updated.razon_social}"`);

        // 5. ELIMINAR (Soft Delete)
        console.log('\n4️⃣  Eliminando empresa (Soft Delete)...');
        const { error: deleteError } = await supabase
            .from('empresas')
            .update({
                deleted_at: new Date().toISOString(),
                activo: false
            })
            .eq('id', inserted.id);

        if (deleteError) throw new Error(`Falló eliminación: ${deleteError.message}`);

        const { data: deleted } = await supabase.from('empresas').select('deleted_at, activo').eq('id', inserted.id).single();

        if (deleted.deleted_at && deleted.activo === false) {
            console.log('   ✅ Eliminación verificada: deleted_at está establecido y activo es false.');
        } else {
            throw new Error('La empresa no aparece como eliminada en la DB.');
        }

        console.log('\n🎉 ¡PRUEBA DE SINCRONIZACIÓN EXITOSA!');
        console.log('Esto confirma que la aplicación escribe y lee correctamente de la base de datos Supabase.');

    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO EN SINCRONIZACIÓN:', error.message);
        process.exit(1);
    }
}

verifySync();
