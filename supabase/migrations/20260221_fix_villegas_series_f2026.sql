-- Corregir serie Villegas: formato F2026-0001 (4 dígitos)
-- 1. Eliminar facturas de Villegas y datos relacionados
-- 2. Ajustar/crear serie F2026 con digitos=4

DO $$
DECLARE
  v_empresa_villegas uuid := '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5';
  v_serie_id uuid;
BEGIN
  -- Eliminar datos relacionados a facturas Villegas
  DELETE FROM eventos_factura WHERE factura_id IN (SELECT id FROM facturas WHERE empresa_id = v_empresa_villegas);
  DELETE FROM pagos_factura WHERE factura_id IN (SELECT id FROM facturas WHERE empresa_id = v_empresa_villegas);
  DELETE FROM emails_factura WHERE factura_id IN (SELECT id FROM facturas WHERE empresa_id = v_empresa_villegas);
  DELETE FROM lineas_factura WHERE factura_id IN (SELECT id FROM facturas WHERE empresa_id = v_empresa_villegas);
  DELETE FROM facturas WHERE empresa_id = v_empresa_villegas;

  -- Desactivar predeterminada en todas las series Villegas
  UPDATE series_facturacion SET predeterminada = false WHERE empresa_id = v_empresa_villegas;

  -- Si existe F2026: corregir digitos y resetear
  UPDATE series_facturacion
  SET digitos = 4, numero_actual = 1, facturas_emitidas = 0, predeterminada = true
  WHERE empresa_id = v_empresa_villegas AND codigo = 'F2026';

  -- Si no existe F2026, crearlo
  IF NOT EXISTS (SELECT 1 FROM series_facturacion WHERE empresa_id = v_empresa_villegas AND codigo = 'F2026') THEN
    INSERT INTO series_facturacion (empresa_id, codigo, nombre, prefijo, sufijo, digitos, numero_inicial, numero_actual, facturas_emitidas, reseteo, activa, predeterminada)
    VALUES (v_empresa_villegas, 'F2026', 'Facturación Villegas 2026', '', '', 4, 1, 1, 0, 'anual', true, true);
  END IF;

  -- Si V2026 existe, quitar predeterminada (F2026 será la predeterminada)
  UPDATE series_facturacion SET predeterminada = false
  WHERE empresa_id = v_empresa_villegas AND codigo = 'V2026';
END $$;
