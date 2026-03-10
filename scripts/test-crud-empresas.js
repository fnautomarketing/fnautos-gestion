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

async function testCRUDEmpresas() {
    console.log('=== TEST CRUD EMPRESAS ===\n');

    let empresaTestId = null;

    try {
        // 1. CREAR EMPRESA
        console.log('1. CREANDO NUEVA EMPRESA...');
        const { data: nuevaEmpresa, error: createError } = await supabase
            .from('empresas')
            .insert({
                razon_social: 'Test Company SL',
                nombre_comercial: 'TestCo',
                cif: 'B99999999',
                tipo_empresa: 'sl',
                direccion: 'Calle Test 123',
                codigo_postal: '28001',
                ciudad: 'Madrid',
                provincia: 'Madrid',
                pais: 'España',
                telefono: '+34 900 000 001',
                email: 'test@testcompany.com',
                iva_predeterminado: 21,
                retencion_predeterminada: 0,
                regimen_iva: 'general',
                aplica_recargo_equivalencia: false,
                recargo_porcentaje: 5.2,
                dias_pago_predeterminados: 30,
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

        if (createError) throw createError;
        empresaTestId = nuevaEmpresa.id;
        console.log(`✅ Empresa creada: ${nuevaEmpresa.razon_social} (ID: ${empresaTestId})\n`);

        // 2. LEER EMPRESA
        console.log('2. LEYENDO EMPRESA...');
        const { data: empresaLeida, error: readError } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', empresaTestId)
            .single();

        if (readError) throw readError;
        console.log(`✅ Empresa leída: ${empresaLeida.razon_social}`);
        console.log(`   CIF: ${empresaLeida.cif}`);
        console.log(`   Ciudad: ${empresaLeida.ciudad}\n`);

        // 3. ACTUALIZAR EMPRESA
        console.log('3. ACTUALIZANDO EMPRESA...');
        const { data: empresaActualizada, error: updateError } = await supabase
            .from('empresas')
            .update({
                nombre_comercial: 'TestCo Updated',
                telefono: '+34 900 000 002',
                updated_at: new Date().toISOString()
            })
            .eq('id', empresaTestId)
            .select()
            .single();

        if (updateError) throw updateError;
        console.log(`✅ Empresa actualizada: ${empresaActualizada.nombre_comercial}`);
        console.log(`   Nuevo teléfono: ${empresaActualizada.telefono}\n`);

        // 4. LISTAR TODAS LAS EMPRESAS
        console.log('4. LISTANDO TODAS LAS EMPRESAS...');
        const { data: todasEmpresas, error: listError } = await supabase
            .from('empresas')
            .select('id, razon_social, cif, activo')
            .order('razon_social');

        if (listError) throw listError;
        console.log(`✅ Total de empresas: ${todasEmpresas.length}`);
        todasEmpresas.forEach(e => {
            console.log(`   - ${e.razon_social} (${e.cif}) - ${e.activo ? 'Activa' : 'Inactiva'}`);
        });
        console.log('');

        // 5. DESACTIVAR EMPRESA
        console.log('5. DESACTIVANDO EMPRESA...');
        const { error: deactivateError } = await supabase
            .from('empresas')
            .update({ activo: false, updated_at: new Date().toISOString() })
            .eq('id', empresaTestId);

        if (deactivateError) throw deactivateError;
        console.log(`✅ Empresa desactivada\n`);

        // 6. VERIFICAR ESTADO
        console.log('6. VERIFICANDO ESTADO...');
        const { data: empresaDesactivada } = await supabase
            .from('empresas')
            .select('activo')
            .eq('id', empresaTestId)
            .single();

        console.log(`✅ Estado actual: ${empresaDesactivada.activo ? 'Activa' : 'Inactiva'}\n`);

        // 7. ELIMINAR EMPRESA (SOFT DELETE ya está hecho, ahora hard delete para limpiar)
        console.log('7. ELIMINANDO EMPRESA DE PRUEBA...');
        const { error: deleteError } = await supabase
            .from('empresas')
            .delete()
            .eq('id', empresaTestId);

        if (deleteError) throw deleteError;
        console.log(`✅ Empresa eliminada correctamente\n`);

        console.log('=== ✅ TODOS LOS TESTS PASARON CORRECTAMENTE ===');

    } catch (error) {
        console.error('❌ ERROR EN TEST:', error);

        // Limpieza en caso de error
        if (empresaTestId) {
            console.log('\nLimpiando empresa de prueba...');
            await supabase
                .from('empresas')
                .delete()
                .eq('id', empresaTestId);
        }

        process.exit(1);
    }
}

testCRUDEmpresas().catch(console.error);
