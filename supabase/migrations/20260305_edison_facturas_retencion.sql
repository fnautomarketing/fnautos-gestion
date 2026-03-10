-- Aplicar retención IRPF -1% a facturas existentes de Edison que no la tienen
-- E2026-0001 y otras facturas de Edison sin retencion_porcentaje
UPDATE facturas
SET
    retencion_porcentaje = -1,
    importe_retencion = ROUND((base_imponible * 1) / 100, 2),
    total = ROUND(base_imponible + iva - (base_imponible * 1) / 100, 2),
    pagado = CASE WHEN estado = 'pagada' THEN ROUND(base_imponible + iva - (base_imponible * 1) / 100, 2) ELSE pagado END
WHERE empresa_id = 'af15f25a-7ade-4de8-9241-a42e1b8407da'
  AND (retencion_porcentaje IS NULL OR retencion_porcentaje = 0)
  AND estado NOT IN ('anulada', 'borrador');
