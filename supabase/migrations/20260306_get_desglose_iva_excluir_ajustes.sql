-- Excluir líneas de ajuste/descuento del desglose IVA
-- Las líneas tipo "Ajuste descuento 5% (PDF)" son descuentos, no ventas con IVA 0%.
-- No deben aparecer en el desglose fiscal por tipo de IVA.

CREATE OR REPLACE FUNCTION public.get_desglose_iva(
  p_empresa_id uuid,
  p_fecha_desde date DEFAULT NULL::date,
  p_fecha_hasta date DEFAULT NULL::date,
  p_cliente_id uuid DEFAULT NULL
)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_result json;
BEGIN
  SELECT json_agg(t) INTO v_result
  FROM (
    SELECT
      l.iva_porcentaje as tipo_iva,
      COALESCE(SUM(l.subtotal), 0) as base_imponible,
      COALESCE(SUM(l.subtotal * l.iva_porcentaje / 100), 0) as cuota_iva,
      COALESCE(SUM(l.subtotal * (1 + l.iva_porcentaje / 100)), 0) as total,
      ROUND((SUM(l.subtotal) * 100.0 / NULLIF(SUM(SUM(l.subtotal)) OVER (), 0)), 2) as porcentaje_del_total
    FROM lineas_factura l
    JOIN facturas f ON l.factura_id = f.id
    WHERE (p_empresa_id IS NULL OR f.empresa_id = p_empresa_id)
      AND (p_cliente_id IS NULL OR f.cliente_id = p_cliente_id)
      AND (p_fecha_desde IS NULL OR f.fecha_emision >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR f.fecha_emision <= p_fecha_hasta)
      AND f.estado != 'anulada'
      -- Excluir líneas de ajuste/descuento (no son base imponible fiscal)
      AND NOT (
        COALESCE(l.concepto, '') ILIKE '%ajuste descuento%'
        OR COALESCE(l.descripcion, '') ILIKE '%ajuste descuento%'
      )
    GROUP BY l.iva_porcentaje
    ORDER BY l.iva_porcentaje
  ) t;
  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;
