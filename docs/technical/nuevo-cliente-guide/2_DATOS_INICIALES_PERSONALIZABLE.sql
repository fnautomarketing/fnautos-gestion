-- =============================================================================
-- SEED MAESTRO: FNAUTOS
-- =============================================================================
-- Propósito: Script de inicialización para un cliente nuevo en Supabase.
--            Ejecutar DESPUÉS de aplicar todas las migraciones en /supabase/migrations/.
--
-- Orden de ejecución:
--   1. Aplicar todas las migraciones (Supabase Dashboard > SQL Editor o CLI)
--   2. Crear el primer usuario en Authentication > Users (correo admin)
--   3. Ejecutar este seed en SQL Editor
--
-- QA Senior: Tras ejecutar este seed, el usuario admin debe poder:
--   - Iniciar sesión sin error "Empresa no encontrada"
--   - Ver el Dashboard con KPIs vacíos (0 facturas, 0 clientes)
--   - Crear su primera factura usando la serie FNA2026
-- =============================================================================

-- 0. Variables de configuración del cliente
--    Ajustar estos valores antes de ejecutar para cada nuevo cliente
DO $$
DECLARE
    v_empresa_id     UUID := gen_random_uuid();
    v_email_admin    TEXT := 'admin@fnautos.com';      -- Cambiar al email del admin real
    v_razon_social   TEXT := 'FNAUTOS S.L.';
    v_nif            TEXT := 'B00000000';              -- Cambiar al NIF real del cliente
    v_nombre_com     TEXT := 'FNAUTOS';
    v_prefijo_serie  TEXT := 'FNA';
    v_anio           TEXT := to_char(now(), 'YYYY');
    v_user_id        UUID;
    v_serie_codigo   TEXT;
BEGIN

    -- =========================================================================
    -- 1. INSERTAR EMPRESA
    -- =========================================================================
    INSERT INTO empresas (
        id,
        razon_social,
        cif,
        nombre_comercial,
        email,
        telefono,
        retencion_predeterminada,
        prefijo_serie,
        activo,
        created_at,
        updated_at
    ) VALUES (
        v_empresa_id,
        v_razon_social,
        v_nif,
        v_nombre_com,
        v_email_admin,
        '+34 000 000 000',          -- Cambiar al teléfono real
        0,
        v_prefijo_serie,
        true,
        now(),
        now()
    )
    ON CONFLICT (cif) DO NOTHING;

    -- Recuperar el ID en caso de que ya existiera (ON CONFLICT DO NOTHING)
    SELECT id INTO v_empresa_id FROM empresas WHERE cif = v_nif LIMIT 1;

    RAISE NOTICE 'Empresa insertada con ID: %', v_empresa_id;

    -- =========================================================================
    -- 2. INSERTAR SERIE DE FACTURACIÓN
    -- =========================================================================
    v_serie_codigo := v_prefijo_serie || v_anio;  -- Ej: FNA2026

    INSERT INTO series_facturacion (
        empresa_id,
        codigo,
        nombre,
        prefijo,
        sufijo,
        digitos,
        numero_inicial,
        numero_actual,
        facturas_emitidas,
        reseteo,
        activa,
        predeterminada
    ) VALUES (
        v_empresa_id,
        v_serie_codigo,
        'Facturación FNAUTOS ' || v_anio,
        '',
        '',
        4,
        1,
        1,
        0,
        'anual',
        true,
        true
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Serie de facturación creada: %', v_serie_codigo;

    -- =========================================================================
    -- 3. PLANTILLA PDF PREDETERMINADA
    -- =========================================================================
    INSERT INTO plantillas_pdf (
        empresa_id,
        nombre,
        descripcion,
        activa,
        predeterminada,
        color_primario,
        color_secundario,
        fuente
    ) VALUES (
        v_empresa_id,
        'Plantilla Estándar FNAUTOS',
        'Plantilla de factura predeterminada para FNAUTOS',
        true,
        true,
        '#2563eb',     -- Azul FNAUTOS (corresponde a clientConfig.colors.brandGold)
        '#1e3a5f',     -- Azul oscuro
        'Roboto'
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Plantilla PDF creada para empresa %', v_empresa_id;

    -- =========================================================================
    -- 4. VINCULAR USUARIO ADMIN A LA EMPRESA (RFC-025)
    --    Requiere que el usuario ya exista en auth.users
    -- =========================================================================
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email_admin LIMIT 1;

    IF v_user_id IS NOT NULL THEN

        -- Asegurar perfil del usuario
        INSERT INTO perfiles (user_id, empresa_id, rol)
        VALUES (v_user_id, v_empresa_id, 'admin')
        ON CONFLICT (user_id) DO UPDATE
            SET empresa_id = v_empresa_id, rol = 'admin';

        -- Vincular usuario a empresa con rol administrador
        INSERT INTO usuarios_empresas (user_id, empresa_id, rol, empresa_activa)
        VALUES (v_user_id, v_empresa_id, 'administrador', true)
        ON CONFLICT (user_id, empresa_id) DO UPDATE
            SET rol = 'administrador', empresa_activa = true;

        RAISE NOTICE 'Usuario admin (%) vinculado a empresa %', v_email_admin, v_empresa_id;
    ELSE
        RAISE WARNING 'Usuario % no encontrado en auth.users. Crear el usuario primero en Authentication > Users y luego reejecutar este bloque.', v_email_admin;
    END IF;

END $$;

-- =============================================================================
-- VERIFICACIÓN FINAL (QA Senior)
-- Ejecutar estas queries para confirmar que el seed se aplicó correctamente:
-- =============================================================================

-- Ver empresa creada
SELECT id, razon_social, cif, nombre_comercial, activo FROM empresas WHERE nombre_comercial = 'FNAUTOS';

-- Ver serie de facturación
SELECT codigo, nombre, predeterminada, activa FROM series_facturacion
WHERE codigo LIKE 'FNA%';

-- Ver plantilla PDF
SELECT nombre, predeterminada, color_primario FROM plantillas_pdf
WHERE nombre LIKE '%FNAUTOS%';

-- Ver usuario vinculado
SELECT ue.empresa_id, ue.rol, ue.empresa_activa, au.email
FROM usuarios_empresas ue
JOIN auth.users au ON au.id = ue.user_id
WHERE au.email LIKE '%fnautos%';
