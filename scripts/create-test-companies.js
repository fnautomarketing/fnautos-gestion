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

async function createTestCompanies() {
    console.log('=== CREANDO 3 EMPRESAS DE PRUEBA ===\n');

    try {
        // 1. STVLS - Sociedad Limitada
        console.log('1. Creando STVLS (Sociedad Limitada)...');
        const { data: stvls, error: stvlsError } = await supabase
            .from('empresas')
            .insert({
                razon_social: 'STVLS Logistics SL',
                nombre_comercial: 'STVLS',
                cif: 'B89890001',
                tipo_empresa: 'sl',
                direccion: 'Calle Gran Vía 123, Piso 5',
                codigo_postal: '28013',
                ciudad: 'Madrid',
                provincia: 'Madrid',
                pais: 'España',
                telefono: '+34 910 123 456',
                email: 'info@stvls.com',
                web: 'https://www.stvls.com',
                iban: 'ES9121000418450200051332',
                banco: 'Banco Santander',
                titular_cuenta: 'STVLS Logistics SL',
                iva_predeterminado: 21,
                retencion_predeterminada: 0,
                regimen_iva: 'general',
                aplica_recargo_equivalencia: false,
                recargo_porcentaje: 5.2,
                dias_pago_predeterminados: 30,
                lugar_expedicion: 'Madrid',
                formato_numero_factura: '{SERIE}-{ANIO}-{NUM}',
                idioma_predeterminado: 'es',
                zona_horaria: 'Europe/Madrid',
                formato_fecha: 'DD/MM/YYYY',
                separador_miles: '.',
                separador_decimales: ',',
                activo: true
            })
            .select()
            .single();

        if (stvlsError) throw stvlsError;
        console.log(`✅ STVLS creada: ${stvls.id}`);
        console.log(`   CIF: ${stvls.cif}`);
        console.log(`   Email: ${stvls.email}\n`);

        // 2. Jenifer Rodriguez - Autónomo
        console.log('2. Creando Jenifer Rodriguez (Autónomo)...');
        const { data: jenifer, error: jeniferError } = await supabase
            .from('empresas')
            .insert({
                razon_social: 'Jenifer Rodriguez',
                nombre_comercial: 'JR Consulting',
                cif: '12345678Z',
                tipo_empresa: 'autonomo',
                direccion: 'Avenida Diagonal 456',
                codigo_postal: '08029',
                ciudad: 'Barcelona',
                provincia: 'Barcelona',
                pais: 'España',
                telefono: '+34 933 456 789',
                email: 'jenifer.rodriguez@jrconsulting.es',
                web: null,
                iban: 'ES7620770024003102575766',
                banco: 'CaixaBank',
                titular_cuenta: 'Jenifer Rodriguez',
                iva_predeterminado: 21,
                retencion_predeterminada: 15,
                regimen_iva: 'general',
                aplica_recargo_equivalencia: false,
                recargo_porcentaje: 5.2,
                dias_pago_predeterminados: 15,
                lugar_expedicion: 'Barcelona',
                formato_numero_factura: '{SERIE}-{ANIO}-{NUM}',
                idioma_predeterminado: 'es',
                zona_horaria: 'Europe/Madrid',
                formato_fecha: 'DD/MM/YYYY',
                separador_miles: '.',
                separador_decimales: ',',
                activo: true
            })
            .select()
            .single();

        if (jeniferError) throw jeniferError;
        console.log(`✅ Jenifer Rodriguez creada: ${jenifer.id}`);
        console.log(`   CIF: ${jenifer.cif}`);
        console.log(`   Email: ${jenifer.email}\n`);

        // 3. Edison Rodriguez - Autónomo
        console.log('3. Creando Edison Rodriguez (Autónomo)...');
        const { data: edison, error: edisonError } = await supabase
            .from('empresas')
            .insert({
                razon_social: 'Edison Rodriguez',
                nombre_comercial: 'ER Tech Solutions',
                cif: '87654321X',
                tipo_empresa: 'autonomo',
                direccion: 'Calle Mayor 789',
                codigo_postal: '46001',
                ciudad: 'Valencia',
                provincia: 'Valencia',
                pais: 'España',
                telefono: '+34 963 789 012',
                email: 'edison.rodriguez@ertech.es',
                web: 'https://www.ertech.es',
                iban: 'ES1000492352082414205416',
                banco: 'BBVA',
                titular_cuenta: 'Edison Rodriguez',
                iva_predeterminado: 21,
                retencion_predeterminada: 15,
                regimen_iva: 'general',
                aplica_recargo_equivalencia: false,
                recargo_porcentaje: 5.2,
                dias_pago_predeterminados: 30,
                lugar_expedicion: 'Valencia',
                formato_numero_factura: '{SERIE}-{ANIO}-{NUM}',
                idioma_predeterminado: 'es',
                zona_horaria: 'Europe/Madrid',
                formato_fecha: 'DD/MM/YYYY',
                separador_miles: '.',
                separador_decimales: ',',
                activo: true
            })
            .select()
            .single();

        if (edisonError) throw edisonError;
        console.log(`✅ Edison Rodriguez creado: ${edison.id}`);
        console.log(`   CIF: ${edison.cif}`);
        console.log(`   Email: ${edison.email}\n`);

        // Crear series de facturación para cada empresa
        console.log('4. Creando series de facturación...\n');

        // Serie para STVLS
        const { error: serieSTVLSError } = await supabase
            .from('series_facturacion')
            .insert({
                empresa_id: stvls.id,
                nombre: 'Facturas 2026',
                prefijo: 'F2026',
                descripcion: 'Serie principal de facturas para 2026',
                activa: true,
                predeterminada: true,
                contador_actual: 0
            });

        if (serieSTVLSError) throw serieSTVLSError;
        console.log(`✅ Serie F2026/ creada para STVLS`);

        // Serie para Jenifer
        const { error: serieJeniferError } = await supabase
            .from('series_facturacion')
            .insert({
                empresa_id: jenifer.id,
                nombre: 'Facturas 2026',
                prefijo: 'A2026',
                descripcion: 'Serie de facturas autónomo 2026',
                activa: true,
                predeterminada: true,
                contador_actual: 0
            });

        if (serieJeniferError) throw serieJeniferError;
        console.log(`✅ Serie A2026/ creada para Jenifer Rodriguez`);

        // Serie para Edison
        const { error: serieEdisonError } = await supabase
            .from('series_facturacion')
            .insert({
                empresa_id: edison.id,
                nombre: 'Facturas 2026',
                prefijo: 'E2026',
                descripcion: 'Serie de facturas autónomo 2026',
                activa: true,
                predeterminada: true,
                contador_actual: 0
            });

        if (serieEdisonError) throw serieEdisonError;
        console.log(`✅ Serie E2026/ creada para Edison Rodriguez\n`);

        // Listar todas las empresas y series
        console.log('5. Verificando empresas creadas...\n');
        const { data: empresas } = await supabase
            .from('empresas')
            .select(`
                id,
                razon_social,
                cif,
                tipo_empresa,
                ciudad,
                email
            `)
            .order('razon_social');

        console.log('📋 EMPRESAS EN EL SISTEMA:');
        empresas.forEach((emp, idx) => {
            console.log(`\n${idx + 1}. ${emp.razon_social}`);
            console.log(`   Tipo: ${emp.tipo_empresa.toUpperCase()}`);
            console.log(`   CIF: ${emp.cif}`);
            console.log(`   Ciudad: ${emp.ciudad}`);
            console.log(`   Email: ${emp.email}`);
        });

        console.log('\n\n6. Verificando series de facturación...\n');
        const { data: series } = await supabase
            .from('series_facturacion')
            .select(`
                id,
                prefijo,
                nombre,
                empresa:empresas(razon_social)
            `)
            .order('prefijo');

        console.log('📋 SERIES DE FACTURACIÓN:');
        series.forEach((serie, idx) => {
            console.log(`\n${idx + 1}. ${serie.prefijo}/`);
            console.log(`   Empresa: ${serie.empresa.razon_social}`);
            console.log(`   Nombre: ${serie.nombre}`);
        });

        console.log('\n\n=== ✅ PROCESO COMPLETADO EXITOSAMENTE ===');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        process.exit(1);
    }
}

createTestCompanies().catch(console.error);
