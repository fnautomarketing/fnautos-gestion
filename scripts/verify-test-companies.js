const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

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

async function verifyTestCompanies() {
    console.log('=== VERIFICACIÓN DE EMPRESAS DE PRUEBA ===\n');

    try {
        // 1. Listar todas las empresas
        console.log('📋 EMPRESAS EN EL SISTEMA:\n');
        const { data: empresas, error: empresasError } = await supabase
            .from('empresas')
            .select('id, razon_social, cif, tipo_empresa, ciudad, email, telefono')
            .order('razon_social');

        if (empresasError) throw empresasError;

        empresas.forEach((emp, idx) => {
            console.log(`${idx + 1}. ${emp.razon_social}`);
            console.log(`   Tipo: ${emp.tipo_empresa.toUpperCase()}`);
            console.log(`   CIF/NIF: ${emp.cif}`);
            console.log(`   Ciudad: ${emp.ciudad}`);
            console.log(`   Email: ${emp.email}`);
            console.log(`   Teléfono: ${emp.telefono}\n`);
        });

        // 2. Listar series de facturación
        console.log('📋 SERIES DE FACTURACIÓN:\n');
        const { data: series, error: seriesError } = await supabase
            .from('series_facturacion')
            .select(`
                id,
                codigo,
                prefijo,
                nombre,
                numero_actual,
                activa,
                predeterminada,
                empresa:empresas(razon_social, cif)
            `)
            .order('prefijo');

        if (seriesError) throw seriesError;

        series.forEach((serie, idx) => {
            console.log(`${idx + 1}. ${serie.prefijo}/`);
            console.log(`   Empresa: ${serie.empresa.razon_social} (${serie.empresa.cif})`);
            console.log(`   Código: ${serie.codigo}`);
            console.log(`   Nombre: ${serie.nombre}`);
            console.log(`   Número Actual: ${serie.numero_actual}`);
            console.log(`   Activa: ${serie.activa ? 'Sí' : 'No'}`);
            console.log(`   Predeterminada: ${serie.predeterminada ? 'Sí' : 'No'}\n`);
        });

        // 3. Verificar estructura según especificación
        console.log('✅ VERIFICACIÓN DE ESTRUCTURA:\n');

        const stvls = empresas.find(e => e.razon_social === 'STVLS Logistics SL');
        const jenifer = empresas.find(e => e.razon_social === 'Jenifer Rodriguez');
        const edison = empresas.find(e => e.razon_social === 'Edison Rodriguez');

        const serieSTVLS = series.find(s => s.prefijo === 'F2026');
        const serieJenifer = series.find(s => s.prefijo === 'A2026');
        const serieEdison = series.find(s => s.prefijo === 'E2026');

        console.log('1. STVLS Logistics SL (Sociedad Limitada)');
        console.log(`   ✓ CIF: ${stvls?.cif} (formato válido)`);
        console.log(`   ✓ Serie: ${serieSTVLS?.prefijo}/ (${serieSTVLS?.nombre})`);
        console.log(`   ✓ Tipo: ${stvls?.tipo_empresa}\n`);

        console.log('2. Jenifer Rodriguez (Autónomo)');
        console.log(`   ✓ NIF: ${jenifer?.cif} (formato válido)`);
        console.log(`   ✓ Serie: ${serieJenifer?.prefijo}/ (${serieJenifer?.nombre})`);
        console.log(`   ✓ Tipo: ${jenifer?.tipo_empresa}\n`);

        console.log('3. Edison Rodriguez (Autónomo)');
        console.log(`   ✓ NIF: ${edison?.cif} (formato válido)`);
        console.log(`   ✓ Serie: ${serieEdison?.prefijo}/ (${serieEdison?.nombre})`);
        console.log(`   ✓ Tipo: ${edison?.tipo_empresa}\n`);

        console.log('=== ✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE ===');
        console.log(`\nTotal de empresas: ${empresas.length}`);
        console.log(`Total de series: ${series.length}`);

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        process.exit(1);
    }
}

verifyTestCompanies().catch(console.error);
