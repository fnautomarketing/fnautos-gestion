-- Añadir filtro opcional por cliente a las RPCs de informes.
-- p_cliente_id UUID DEFAULT NULL: si se pasa, se filtra por ese cliente; si NULL, se muestran todos.

-- 1. get_kpis_ventas
CREATE OR REPLACE FUNCTION public.get_kpis_ventas(
  p_empresa_id uuid,
  p_fecha_desde date DEFAULT NULL::date,
  p_fecha_hasta date DEFAULT NULL::date,
  p_cliente_id uuid DEFAULT NULL
)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_fecha_desde DATE;
  v_fecha_hasta DATE;
  v_periodo_anterior_desde DATE;
  v_periodo_anterior_hasta DATE;
  v_kpis RECORD;
  v_kpis_anterior RECORD;
BEGIN
  v_fecha_desde := COALESCE(p_fecha_desde, DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'));
  v_fecha_hasta := COALESCE(p_fecha_hasta, DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day');
  v_periodo_anterior_hasta := v_fecha_desde - INTERVAL '1 day';
  v_periodo_anterior_desde := v_periodo_anterior_hasta - (v_fecha_hasta - v_fecha_desde);

  SELECT 
    COALESCE(SUM(total), 0) as facturacion_total,
    COUNT(*) as num_facturas,
    COALESCE(AVG(total), 0) as ticket_medio,
    COALESCE(AVG(COALESCE(fecha_pago, CURRENT_DATE) - fecha_emision), 0) as dias_cobro_promedio
  INTO v_kpis
  FROM facturas
  WHERE (p_empresa_id IS NULL OR empresa_id = p_empresa_id)
    AND (p_cliente_id IS NULL OR cliente_id = p_cliente_id)
    AND fecha_emision BETWEEN v_fecha_desde AND v_fecha_hasta
    AND estado != 'anulada';

  SELECT 
    COALESCE(SUM(total), 0) as facturacion_total,
    COUNT(*) as num_facturas,
    COALESCE(AVG(total), 0) as ticket_medio,
    COALESCE(AVG(COALESCE(fecha_pago, CURRENT_DATE) - fecha_emision), 0) as dias_cobro_promedio
  INTO v_kpis_anterior
  FROM facturas
  WHERE (p_empresa_id IS NULL OR empresa_id = p_empresa_id)
    AND (p_cliente_id IS NULL OR cliente_id = p_cliente_id)
    AND fecha_emision BETWEEN v_periodo_anterior_desde AND v_periodo_anterior_hasta
    AND estado != 'anulada';

  RETURN json_build_object(
    'actual', json_build_object(
      'facturacion_total', v_kpis.facturacion_total,
      'num_facturas', v_kpis.num_facturas,
      'ticket_medio', v_kpis.ticket_medio,
      'dias_cobro_promedio', v_kpis.dias_cobro_promedio
    ),
    'anterior', json_build_object(
      'facturacion_total', v_kpis_anterior.facturacion_total,
      'num_facturas', v_kpis_anterior.num_facturas,
      'ticket_medio', v_kpis_anterior.ticket_medio,
      'dias_cobro_promedio', v_kpis_anterior.dias_cobro_promedio
    ),
    'variaciones', json_build_object(
      'facturacion', CASE 
        WHEN v_kpis_anterior.facturacion_total > 0 THEN 
          ROUND(((v_kpis.facturacion_total - v_kpis_anterior.facturacion_total) / v_kpis_anterior.facturacion_total) * 100, 2)
        ELSE 0 
      END,
      'facturas', v_kpis.num_facturas - v_kpis_anterior.num_facturas,
      'ticket_medio', CASE 
        WHEN v_kpis_anterior.ticket_medio > 0 THEN 
          ROUND(((v_kpis.ticket_medio - v_kpis_anterior.ticket_medio) / v_kpis_anterior.ticket_medio) * 100, 2)
        ELSE 0 
      END,
      'dias_cobro', ROUND(v_kpis.dias_cobro_promedio - v_kpis_anterior.dias_cobro_promedio, 0)
    )
  );
END;
$function$;

-- 2. get_evolucion_facturacion
CREATE OR REPLACE FUNCTION public.get_evolucion_facturacion(
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
      to_char(fecha_emision, 'YYYY-MM') as periodo,
      extract(month from fecha_emision)::int as mes,
      extract(year from fecha_emision)::int as anio,
      COALESCE(SUM(total), 0) as facturacion,
      COUNT(*)::int as num_facturas
    FROM facturas
    WHERE (p_empresa_id IS NULL OR empresa_id = p_empresa_id)
      AND (p_cliente_id IS NULL OR cliente_id = p_cliente_id)
      AND (p_fecha_desde IS NULL OR fecha_emision >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR fecha_emision <= p_fecha_hasta)
      AND estado != 'anulada'
    GROUP BY 1, 2, 3
    ORDER BY 3, 2
  ) t;
  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

-- 3. get_estado_facturas
CREATE OR REPLACE FUNCTION public.get_estado_facturas(
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
      estado,
      COUNT(*)::int as cantidad,
      ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 2) as porcentaje
    FROM facturas
    WHERE (p_empresa_id IS NULL OR empresa_id = p_empresa_id)
      AND (p_cliente_id IS NULL OR cliente_id = p_cliente_id)
      AND (p_fecha_desde IS NULL OR fecha_emision >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR fecha_emision <= p_fecha_hasta)
    GROUP BY estado
  ) t;
  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

-- 4. get_top_clientes
CREATE OR REPLACE FUNCTION public.get_top_clientes(
  p_empresa_id uuid,
  p_fecha_desde date DEFAULT NULL::date,
  p_fecha_hasta date DEFAULT NULL::date,
  p_limite int DEFAULT 10,
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
      c.id as cliente_id,
      c.nombre_fiscal as cliente_nombre,
      COALESCE(SUM(f.total), 0) as facturacion,
      COUNT(f.id)::int as num_facturas
    FROM facturas f
    JOIN clientes c ON f.cliente_id = c.id
    WHERE (p_empresa_id IS NULL OR f.empresa_id = p_empresa_id)
      AND (p_cliente_id IS NULL OR f.cliente_id = p_cliente_id)
      AND (p_fecha_desde IS NULL OR f.fecha_emision >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR f.fecha_emision <= p_fecha_hasta)
      AND f.estado != 'anulada'
    GROUP BY c.id, c.nombre_fiscal
    ORDER BY facturacion DESC
    LIMIT p_limite
  ) t;
  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

-- 5. get_facturacion_por_categoria
CREATE OR REPLACE FUNCTION public.get_facturacion_por_categoria(
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
      COALESCE(cat.categoria, 'Sin Categoría') as categoria,
      COALESCE(SUM(l.subtotal), 0) as facturacion,
      COALESCE(SUM(l.cantidad), 0) as cantidad
    FROM lineas_factura l
    JOIN facturas f ON l.factura_id = f.id
    LEFT JOIN conceptos_catalogo cat ON l.concepto_id = cat.id
    WHERE (p_empresa_id IS NULL OR f.empresa_id = p_empresa_id)
      AND (p_cliente_id IS NULL OR f.cliente_id = p_cliente_id)
      AND (p_fecha_desde IS NULL OR f.fecha_emision >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR f.fecha_emision <= p_fecha_hasta)
      AND f.estado != 'anulada'
    GROUP BY 1
    ORDER BY facturacion DESC
  ) t;
  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

-- 6. get_desglose_iva
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
    GROUP BY l.iva_porcentaje
    ORDER BY l.iva_porcentaje
  ) t;
  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;
