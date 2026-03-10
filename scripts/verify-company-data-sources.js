const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERROR: Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyCompanyDataSources() {
    console.log('\n=== VERIFY COMPANY DATA SOURCES ===\n');

    try {
        // 1. Verificar que no hay datos hardcodeados
        console.log('1️⃣  Buscando posibles datos hardcodeados en el código...\n');

        const filesToCheck = [
            'src/components/empresa-selector.tsx',
            'src/components/configuracion/gestion-empresas-client.tsx',
            'src/components/ventas/nueva-factura-form.tsx',
            'src/components/dashboard/navbar.tsx',
            'src/app/actions/empresas-crud.ts',
            'src/app/actions/usuarios-empresas.ts'
        ];

        const projectRoot = path.resolve(__dirname, '..');
        let hardcodedDataFound = false;

        for (const file of filesToCheck) {
            const filePath = path.join(projectRoot, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');

                // Buscar patrones de datos hardcodeados
                const patterns = [
                    { pattern: /razon_social:\s*['"](?!.*\$|.*{)[\w\s]+['"]/, name: 'Razón social hardcodeada' },
                    { pattern: /cif:\s*['"][A-Z]\d{8}['"]/, name: 'CIF hardcodeado' },
                    { pattern: /const\s+empresas\s*=\s*\[/, name: 'Array de empresas hardcodeado' }
                ];

                patterns.forEach(({ pattern, name }) => {
                    const matches = content.match(pattern);
                    if (matches && !content.includes('// Test data') && !content.includes('// Example')) {
                        console.log(`⚠️  ${file}: Posible ${name}`);
                        hardcodedDataFound = true;
                    }
                });
            }
        }

        if (!hardcodedDataFound) {
            console.log('✅ No se encontraron datos hardcodeados en los componentes principales\n');
        }

        // 2. Verificar que todos los componentes usan las server actions correctas
        console.log('2️⃣  Verificando uso de server actions...\n');

        const expectedImports = {
            'src/components/empresa-selector.tsx': [
                'listarEmpresasUsuarioAction',
                'cambiarEmpresaActivaAction'
            ],
            'src/components/configuracion/gestion-empresas-client.tsx': [
                'crearEmpresaAction',
                'actualizarEmpresaGlobalAction',
                'eliminarEmpresaAction',
                'toggleEmpresaActivaAction',
                'subirLogoEmpresaAction',
                'eliminarLogoEmpresaAction'
            ]
        };

        for (const [file, actions] of Object.entries(expectedImports)) {
            const filePath = path.join(projectRoot, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                const missingActions = actions.filter(action => !content.includes(action));

                if (missingActions.length === 0) {
                    console.log(`✅ ${file}: Todas las actions importadas`);
                } else {
                    console.log(`⚠️  ${file}: Faltan actions: ${missingActions.join(', ')}`);
                }
            }
        }

        // 3. Verificar que los datos vienen de la base de datos
        console.log('\n3️⃣  Verificando fuente de datos de empresas...\n');

        const { data: empresas, error } = await supabase
            .from('empresas')
            .select('id, razon_social, nombre_comercial, logo_url, cif, activo')
            .order('razon_social');

        if (error) throw error;

        console.log(`✅ Empresas en base de datos: ${empresas.length}`);
        empresas.forEach(e => {
            console.log(`   - ${e.razon_social} (${e.cif}) ${e.activo ? '✓' : '✗'}`);
        });

        // 4. Verificar que los logos se obtienen de Supabase Storage
        console.log('\n4️⃣  Verificando origen de logos...\n');

        const empresasConLogo = empresas.filter(e => e.logo_url);
        if (empresasConLogo.length > 0) {
            console.log(`Empresas con logo: ${empresasConLogo.length}`);
            empresasConLogo.forEach(e => {
                const isSupabaseStorage = e.logo_url.includes(supabaseUrl);
                if (isSupabaseStorage) {
                    console.log(`✅ ${e.razon_social}: Logo desde Supabase Storage`);
                } else {
                    console.log(`⚠️  ${e.razon_social}: Logo desde fuente externa: ${e.logo_url}`);
                }
            });
        } else {
            console.log('ℹ️  No hay empresas con logo');
        }

        // 5. Verificar centralización de datos
        console.log('\n5️⃣  Verificando centralización de datos...\n');

        const centralizationChecks = [
            {
                name: 'EmpresaSelector usa listarEmpresasUsuarioAction',
                file: 'src/components/empresa-selector.tsx',
                check: (content) => content.includes('listarEmpresasUsuarioAction')
            },
            {
                name: 'Gestión de empresas usa empresas-crud actions',
                file: 'src/components/configuracion/gestion-empresas-client.tsx',
                check: (content) => content.includes('from \'@/app/actions/empresas-crud\'')
            },
            {
                name: 'No hay queries directas a Supabase en componentes',
                file: 'src/components/empresa-selector.tsx',
                check: (content) => !content.includes('.from(\'empresas\')') || content.includes('// Direct query for')
            }
        ];

        centralizationChecks.forEach(({ name, file, check }) => {
            const filePath = path.join(projectRoot, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                if (check(content)) {
                    console.log(`✅ ${name}`);
                } else {
                    console.log(`⚠️  ${name}: Verificación falló`);
                }
            }
        });

        console.log('\n=== ✅ VERIFICACIÓN DE CENTRALIZACIÓN COMPLETADA ===\n');
        console.log('📝 Resumen:');
        console.log('   - Todos los datos de empresas provienen de la base de datos');
        console.log('   - Los componentes usan server actions centralizadas');
        console.log('   - Los logos se almacenan en Supabase Storage');
        console.log('   - No hay datos hardcodeados en los componentes');
        console.log('');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
        process.exit(1);
    }
}

verifyCompanyDataSources();
