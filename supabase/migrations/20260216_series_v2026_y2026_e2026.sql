-- Series por empresa: Villegas V2026, Yenifer Y2026, Edison E2026
-- Formato: CODIGO-XXXX (4 dígitos). Secuencia independiente por empresa.
-- Las facturas emitidas quedan registradas en facturas(numero, serie, serie_id).
-- Al cambiar de año (2027), se crean nuevas series V2027, Y2027, E2027.

-- 1. Añadir prefijo_serie a empresas (V, Y, E)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS prefijo_serie text;

-- 2. Asignar prefijos a las 3 empresas conocidas
UPDATE empresas SET prefijo_serie = 'V' WHERE id = '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5';  -- Villegas
UPDATE empresas SET prefijo_serie = 'Y' WHERE id = 'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a';  -- Yenifer
UPDATE empresas SET prefijo_serie = 'E' WHERE id = 'af15f25a-7ade-4de8-9241-a42e1b8407da';  -- Edison

-- 3. Para empresas sin prefijo, usar primera letra de razon_social
UPDATE empresas SET prefijo_serie = UPPER(LEFT(razon_social, 1))
WHERE prefijo_serie IS NULL AND razon_social IS NOT NULL;

-- 4. Desactivar series antiguas (FAC, F2026) como predeterminadas; las nuevas serán predeterminadas
UPDATE series_facturacion SET predeterminada = false
WHERE empresa_id IN (
    '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5',
    'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a',
    'af15f25a-7ade-4de8-9241-a42e1b8407da'
)
AND codigo NOT IN ('V2026', 'Y2026', 'E2026');

-- 5. Insertar series V2026, Y2026, E2026 si no existen
DO $$
BEGIN
    -- Villegas
    IF NOT EXISTS (SELECT 1 FROM series_facturacion WHERE empresa_id = '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5' AND codigo = 'V2026') THEN
        INSERT INTO series_facturacion (empresa_id, codigo, nombre, prefijo, sufijo, digitos, numero_inicial, numero_actual, facturas_emitidas, reseteo, activa, predeterminada)
        VALUES ('4b77324c-a10e-4714-b0a4-df4b9c5f6ca5', 'V2026', 'Facturación Villegas 2026', '', '', 4, 1, 1, 0, 'anual', true, true);
    END IF;
    -- Yenifer
    IF NOT EXISTS (SELECT 1 FROM series_facturacion WHERE empresa_id = 'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a' AND codigo = 'Y2026') THEN
        INSERT INTO series_facturacion (empresa_id, codigo, nombre, prefijo, sufijo, digitos, numero_inicial, numero_actual, facturas_emitidas, reseteo, activa, predeterminada)
        VALUES ('e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a', 'Y2026', 'Facturación Yenifer 2026', '', '', 4, 1, 1, 0, 'anual', true, true);
    END IF;
    -- Edison
    IF NOT EXISTS (SELECT 1 FROM series_facturacion WHERE empresa_id = 'af15f25a-7ade-4de8-9241-a42e1b8407da' AND codigo = 'E2026') THEN
        INSERT INTO series_facturacion (empresa_id, codigo, nombre, prefijo, sufijo, digitos, numero_inicial, numero_actual, facturas_emitidas, reseteo, activa, predeterminada)
        VALUES ('af15f25a-7ade-4de8-9241-a42e1b8407da', 'E2026', 'Facturación Edison 2026', '', '', 4, 1, 1, 0, 'anual', true, true);
    END IF;
END $$;

-- 6. Sincronizar numero_actual con el máximo ya emitido (por si hay facturas previas)
-- Formato numero: CODIGO-XXXX (ej. V2026-0001). Extraemos el número tras el último guión.
UPDATE series_facturacion s
SET numero_actual = GREATEST(
    s.numero_actual,
    COALESCE(
        (SELECT MAX(
            COALESCE(NULLIF(trim(regexp_replace(split_part(COALESCE(f.numero, '0'), '-', 2), '[^0-9]', '', 'g')), '')::int, 0)
        ) + 1
        FROM facturas f
        WHERE f.serie_id = s.id AND f.estado = 'emitida'),
        s.numero_inicial
    )
)
WHERE s.codigo IN ('V2026', 'Y2026', 'E2026');

-- 7. RPC atómico: obtiene siguiente número, incrementa contador, devuelve formato CODIGO-XXXX
CREATE OR REPLACE FUNCTION public.obtener_siguiente_numero_serie(p_serie_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_codigo text;
    v_numero_actual int;
    v_digitos int;
    v_formato text;
BEGIN
    -- Bloquear fila y obtener datos
    SELECT codigo, numero_actual, COALESCE(digitos, 4)
    INTO v_codigo, v_numero_actual, v_digitos
    FROM series_facturacion
    WHERE id = p_serie_id
    FOR UPDATE;

    IF v_codigo IS NULL THEN
        RAISE EXCEPTION 'Serie no encontrada: %', p_serie_id;
    END IF;

    v_formato := v_codigo || '-' || lpad(v_numero_actual::text, v_digitos, '0');

    -- Incrementar contador e incrementar facturas_emitidas
    UPDATE series_facturacion
    SET numero_actual = numero_actual + 1,
        facturas_emitidas = COALESCE(facturas_emitidas, 0) + 1
    WHERE id = p_serie_id;

    RETURN v_formato;
END;
$$;
