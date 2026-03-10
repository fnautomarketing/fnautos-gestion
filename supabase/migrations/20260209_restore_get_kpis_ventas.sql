CREATE OR REPLACE FUNCTION public.get_kpis_ventas(p_empresa_id uuid, p_fecha_desde date DEFAULT NULL::date, p_fecha_hasta date DEFAULT NULL::date)
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
  -- Usar último mes si no se especifica
  v_fecha_desde := COALESCE(p_fecha_desde, DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'));
  v_fecha_hasta := COALESCE(p_fecha_hasta, DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day');
  
  -- Calcular periodo anterior (mismo rango de días)
  v_periodo_anterior_hasta := v_fecha_desde - INTERVAL '1 day';
  v_periodo_anterior_desde := v_periodo_anterior_hasta - (v_fecha_hasta - v_fecha_desde);
  
  -- KPIs del periodo actual
  SELECT 
    COALESCE(SUM(total), 0) as facturacion_total,
    COUNT(*) as num_facturas,
    COALESCE(AVG(total), 0) as ticket_medio,
    COALESCE(AVG(COALESCE(fecha_pago, CURRENT_DATE) - fecha_emision), 0) as dias_cobro_promedio
  INTO v_kpis
  FROM facturas
  WHERE empresa_id = p_empresa_id
    AND fecha_emision BETWEEN v_fecha_desde AND v_fecha_hasta
    AND estado != 'anulada';
  
  -- KPIs del periodo anterior
  SELECT 
    COALESCE(SUM(total), 0) as facturacion_total,
    COUNT(*) as num_facturas,
    COALESCE(AVG(total), 0) as ticket_medio,
    COALESCE(AVG(COALESCE(fecha_pago, CURRENT_DATE) - fecha_emision), 0) as dias_cobro_promedio
  INTO v_kpis_anterior
  FROM facturas
  WHERE empresa_id = p_empresa_id
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
$function$
