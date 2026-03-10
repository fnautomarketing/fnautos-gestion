const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERROR: Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function restoreAllCompanies() {
    console.log('\n=== 🚑 RESTAURANDO TODAS LAS EMPRESAS ELIMINADAS ===\n');

    try {
        // 1. Obtener empresas eliminadas
        const { data: deletedCompanies, error: fetchError } = await supabase
            .from('empresas')
            .select('*')
            .not('deleted_at', 'is', null);

        if (fetchError) throw fetchError;

        if (!deletedCompanies || deletedCompanies.length === 0) {
            console.log('✅ No hay empresas eliminadas para restaurar.');
            return;
        }

        console.log(`📋 Encontradas ${deletedCompanies.length} empresas eliminadas.`);

        let restoredCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        // 2. Procesar una por una para manejar conflictos de CIF
        for (const company of deletedCompanies) {
            process.stdout.write(`   - Restaurando "${company.razon_social}" (${company.cif})... `);

            // Verificar si ya existe alguna ACTIVA con ese CIF
            const { data: activeDuplicate } = await supabase
                .from('empresas')
                .select('id')
                .eq('cif', company.cif)
                .is('deleted_at', null)
                .maybeSingle();

            if (activeDuplicate) {
                console.log('⚠️ SKIPPED (Ya existe una activa con este CIF)');
                skippedCount++;
                continue;
            }

            // Intentar restaurar
            const { error: updateError } = await supabase
                .from('empresas')
                .update({
                    deleted_at: null,
                    activo: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', company.id);

            if (updateError) {
                console.log(`❌ ERROR: ${updateError.message}`);
                errorCount++;
            } else {
                console.log('✅ OK');
                restoredCount++;
            }
        }

        console.log('\n-----------------------------------');
        console.log(`📊 RESUMEN FINAL:`);
        console.log(`   - Restauradas: ${restoredCount}`);
        console.log(`   - Omitidas (Duplicados): ${skippedCount}`);
        console.log(`   - Errores: ${errorCount}`);
        console.log('-----------------------------------');
        console.log('\n👉 Ya puedes recargar la aplicación para ver las empresas.');

    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO:', error.message);
    }
}

restoreAllCompanies();
