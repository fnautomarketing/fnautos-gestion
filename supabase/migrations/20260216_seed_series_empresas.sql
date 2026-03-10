-- Asegurar que cada empresa tiene al menos una serie para el año actual
-- Usa prefijo_serie (V, Y, E) o primera letra de razon_social. Formato: PREFIJO+AÑO (V2026, Y2026, E2026)

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
)
SELECT
    e.id,
    COALESCE(e.prefijo_serie, UPPER(LEFT(e.razon_social, 1))) || to_char(now(), 'YYYY'),
    'Facturación ' || COALESCE(e.nombre_comercial, e.razon_social) || ' ' || to_char(now(), 'YYYY'),
    '',
    '',
    4,
    1,
    1,
    0,
    'anual',
    true,
    true
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM series_facturacion s
    WHERE s.empresa_id = e.id
    AND s.codigo = COALESCE(e.prefijo_serie, UPPER(LEFT(e.razon_social, 1))) || to_char(now(), 'YYYY')
);
