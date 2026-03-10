-- Limpieza: eliminar todas las facturas, quitar Mi Empresa, resetear numeración de las 3 empresas
-- Empresas a mantener: Villegas, Yenifer, Edison
-- Empresa a eliminar: Mi Empresa (9e8d8113-cef8-4da7-accd-5d6de2446c37)

BEGIN;

-- IDs de empresas
-- Villegas: 4b77324c-a10e-4714-b0a4-df4b9c5f6ca5
-- Yenifer:  e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a
-- Edison:   af15f25a-7ade-4de8-9241-a42e1b8407da
-- Mi Empresa (eliminar): 9e8d8113-cef8-4da7-accd-5d6de2446c37

-- 1. Eliminar factura_rectificada_id para evitar FK circular (poner NULL)
UPDATE facturas SET factura_rectificada_id = NULL WHERE factura_rectificada_id IS NOT NULL;

-- 2. Eliminar datos relacionados con facturas (orden por dependencias)
DELETE FROM recordatorios;
DELETE FROM pagos_factura;
DELETE FROM pagos;
DELETE FROM emails_factura;
DELETE FROM eventos_factura;
DELETE FROM lineas_factura;
DELETE FROM facturas;

-- 3. Resetear numeración de series para las 3 empresas
UPDATE series_facturacion
SET numero_actual = numero_inicial,
    facturas_emitidas = 0
WHERE empresa_id IN (
    '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5',  -- Villegas
    'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a',  -- Yenifer
    'af15f25a-7ade-4de8-9241-a42e1b8407da'   -- Edison
);

-- 4. Eliminar series de Mi Empresa
DELETE FROM series_facturacion WHERE empresa_id = '9e8d8113-cef8-4da7-accd-5d6de2446c37';

-- 5. Actualizar perfiles que tenían Mi Empresa → asignar Villegas por defecto
UPDATE perfiles
SET empresa_id = '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5'
WHERE empresa_id = '9e8d8113-cef8-4da7-accd-5d6de2446c37';

-- 6. Eliminar usuarios_empresas de Mi Empresa
DELETE FROM usuarios_empresas WHERE empresa_id = '9e8d8113-cef8-4da7-accd-5d6de2446c37';

-- 7. Eliminar plantillas_pdf de Mi Empresa
DELETE FROM plantillas_pdf WHERE empresa_id = '9e8d8113-cef8-4da7-accd-5d6de2446c37';

-- 8. Eliminar conceptos_catalogo de Mi Empresa (si existe)
DELETE FROM conceptos_catalogo WHERE empresa_id = '9e8d8113-cef8-4da7-accd-5d6de2446c37';

-- 9. Eliminar notificaciones de Mi Empresa (CASCADE podría hacerlo, pero explícito)
DELETE FROM notificaciones WHERE empresa_id = '9e8d8113-cef8-4da7-accd-5d6de2446c37';

-- 10. Eliminar configuración de empresa de Mi Empresa (si existe tabla)
-- configuracion_empresa puede tener empresa_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'configuracion_empresa') THEN
    DELETE FROM configuracion_empresa WHERE empresa_id = '9e8d8113-cef8-4da7-accd-5d6de2446c37';
  END IF;
END $$;

-- 11. Eliminar empresa Mi Empresa
DELETE FROM empresas WHERE id = '9e8d8113-cef8-4da7-accd-5d6de2446c37';

-- 12. Asegurar que cada una de las 3 empresas tiene al menos una serie
INSERT INTO series_facturacion (empresa_id, codigo, nombre, prefijo, sufijo, digitos, numero_inicial, numero_actual, facturas_emitidas, reseteo, activa, predeterminada)
SELECT e.id, 'FAC', 'Facturación ' || COALESCE(e.nombre_comercial, e.razon_social), '', '', 4, 1, 1, 0, 'anual', true, true
FROM empresas e
WHERE e.id IN ('4b77324c-a10e-4714-b0a4-df4b9c5f6ca5', 'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a', 'af15f25a-7ade-4de8-9241-a42e1b8407da')
AND NOT EXISTS (SELECT 1 FROM series_facturacion s WHERE s.empresa_id = e.id);

COMMIT;
