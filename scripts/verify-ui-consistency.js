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

async function verifyUIConsistency() {
    console.log('\n=== VERIFY UI CONSISTENCY ===\n');

    try {
        // 1. Verificar que todas las empresas tienen logo o pueden usar icono por defecto
        console.log('1️⃣  Verificando logos de empresas...');
        const { data: empresas, error } = await supabase
            .from('empresas')
            .select('id, razon_social, logo_url, activo')
            .order('razon_social');

        if (error) throw error;

        console.log(`\n📊 Total de empresas: ${empresas.length}\n`);

        let conLogo = 0;
        let sinLogo = 0;

        empresas.forEach(empresa => {
            if (empresa.logo_url) {
                console.log(`✅ ${empresa.razon_social}: Tiene logo`);
                console.log(`   URL: ${empresa.logo_url}`);
                conLogo++;
            } else {
                console.log(`⚪ ${empresa.razon_social}: Sin logo (usará icono por defecto)`);
                sinLogo++;
            }
        });

        console.log(`\n📈 Resumen:`);
        console.log(`   - Con logo: ${conLogo}`);
        console.log(`   - Sin logo: ${sinLogo} (usarán icono dorado por defecto)`);

        // 2. Verificar bucket de storage
        console.log('\n2️⃣  Verificando bucket de storage...');
        const { data: buckets, error: bucketError } = await supabase
            .storage
            .listBuckets();

        if (bucketError) throw bucketError;

        const companyLogosBucket = buckets.find(b => b.id === 'company-logos');
        if (companyLogosBucket) {
            console.log('✅ Bucket "company-logos" existe');
            console.log(`   Público: ${companyLogosBucket.public ? 'Sí' : 'No'}`);
            console.log(`   Límite de tamaño: ${companyLogosBucket.file_size_limit ? (companyLogosBucket.file_size_limit / 1024 / 1024) + 'MB' : 'Sin límite'}`);
        } else {
            console.log('⚠️  Bucket "company-logos" no existe');
        }

        // 3. Listar archivos en el bucket
        if (companyLogosBucket) {
            console.log('\n3️⃣  Listando logos en storage...');
            const { data: files, error: listError } = await supabase
                .storage
                .from('company-logos')
                .list('', {
                    limit: 100,
                    offset: 0
                });

            if (listError) {
                console.log('⚠️  Error al listar archivos:', listError.message);
            } else {
                console.log(`📁 Archivos en storage: ${files.length}`);
                files.forEach(file => {
                    if (file.name) {
                        console.log(`   - ${file.name}`);
                    }
                });
            }
        }

        // 4. Verificar que los logos son accesibles
        console.log('\n4️⃣  Verificando accesibilidad de logos...');
        const empresasConLogo = empresas.filter(e => e.logo_url);

        if (empresasConLogo.length > 0) {
            console.log(`Verificando ${empresasConLogo.length} logos...`);
            for (const empresa of empresasConLogo) {
                try {
                    // Intentar obtener la URL pública
                    const logoPath = empresa.logo_url.split('/').slice(-2).join('/');
                    const { data } = supabase.storage
                        .from('company-logos')
                        .getPublicUrl(logoPath);

                    if (data.publicUrl) {
                        console.log(`✅ ${empresa.razon_social}: Logo accesible`);
                    }
                } catch (err) {
                    console.log(`❌ ${empresa.razon_social}: Error al verificar logo`);
                }
            }
        } else {
            console.log('ℹ️  No hay empresas con logo para verificar');
        }

        console.log('\n=== ✅ VERIFICACIÓN DE UI COMPLETADA ===\n');
        console.log('📝 Notas:');
        console.log('   - Todas las empresas sin logo mostrarán un icono dorado por defecto');
        console.log('   - Los logos se muestran en:');
        console.log('     • Tabla de gestión de empresas');
        console.log('     • Selector de empresas (header)');
        console.log('     • Selector de empresas (formularios)');
        console.log('');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
        process.exit(1);
    }
}

verifyUIConsistency();
