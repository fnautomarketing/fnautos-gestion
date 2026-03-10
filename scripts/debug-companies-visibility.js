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

async function debugVisibility() {
    console.log('\n=== 🕵️ ANALIZANDO VISIBILIDAD DE EMPRESAS ===\n');

    try {
        // 1. Obtener TODAS las empresas (incluyendo eliminadas)
        const { data: allCompanies, error } = await supabase
            .from('empresas')
            .select('*')
            .order('razon_social');

        if (error) throw error;

        console.log(`📊 Total empresas en DB: ${allCompanies.length}`);
        console.log('---------------------------------------------------');
        console.log('| ID | Razón Social | CIF | Activo | Eliminado (deleted_at) | ¿Visible en App? |');
        console.log('---------------------------------------------------');

        let visibleCount = 0;
        let hiddenCount = 0;

        allCompanies.forEach(empresa => {
            const isDeleted = !!empresa.deleted_at;
            // La app filtra: .is('deleted_at', null)
            const isVisible = !isDeleted;

            if (isVisible) visibleCount++;
            else hiddenCount++;

            console.log(
                `| ${empresa.id.substring(0, 6)}... | ` +
                `${empresa.razon_social.padEnd(20).substring(0, 20)} | ` +
                `${empresa.cif.padEnd(9)} | ` +
                `${empresa.activo ? '✅ SI ' : '❌ NO '} | ` +
                `${isDeleted ? '🗑️ SI (' + new Date(empresa.deleted_at).toLocaleDateString() + ')' : '⬜ NO'} | ` +
                `${isVisible ? '👁️ VISIBLE' : '👻 OCULTO'} |`
            );
        });

        console.log('---------------------------------------------------');
        console.log(`\n🔎 RESUMEN:`);
        console.log(`   - Visible en la App: ${visibleCount}`);
        console.log(`   - Ocultas (Eliminadas): ${hiddenCount}`);

        if (hiddenCount > 0) {
            console.log('\n💡 NOTA: Las empresas marcadas como "OCULTO" tienen fecha de eliminación (deleted_at).');
            console.log('   La aplicación ESTÁ DISEÑADA para no mostrarlas por defecto.');
            console.log('   Si necesitas recuperar una, contacta al administrador o revisa la base de datos.');
        }

    } catch (error) {
        console.error('❌ Error al consultar Supabase:', error.message);
    }
}

debugVisibility();
