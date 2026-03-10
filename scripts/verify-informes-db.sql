-- Verificación de funciones RPC para la página Informes
-- Ejecutar en Supabase SQL Editor o: psql -f scripts/verify-informes-db.sql
-- Debe devolver 6 filas con exists=true

SELECT
  proname AS funcion,
  CASE WHEN COUNT(*) > 0 THEN true ELSE false END AS exists
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN (
    'get_kpis_ventas',
    'get_evolucion_facturacion',
    'get_estado_facturas',
    'get_top_clientes',
    'get_facturacion_por_categoria',
    'get_desglose_iva',
    'get_ranking_conceptos'
  )
GROUP BY proname
ORDER BY proname;

-- Verificar que get_kpis_ventas tiene 4 params (p_cliente_id)
SELECT proname, oidvectortypes(proargtypes) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND proname = 'get_kpis_ventas';

-- Verificar permisos conceptos_catalogo
SELECT has_table_privilege('authenticated', 'public.conceptos_catalogo', 'SELECT') AS authenticated_can_select;
