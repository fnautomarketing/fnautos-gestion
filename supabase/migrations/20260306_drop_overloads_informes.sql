-- Eliminar sobrecargas antiguas (3 params) para evitar ambigüedad con las nuevas (4 params con p_cliente_id).
-- PostgreSQL no puede elegir entre get_kpis_ventas(uuid,date,date) y get_kpis_ventas(uuid,date,date,uuid) en visión global.

DROP FUNCTION IF EXISTS public.get_kpis_ventas(uuid, date, date);
DROP FUNCTION IF EXISTS public.get_evolucion_facturacion(uuid, date, date);
DROP FUNCTION IF EXISTS public.get_estado_facturas(uuid, date, date);
DROP FUNCTION IF EXISTS public.get_top_clientes(uuid, date, date, integer);
DROP FUNCTION IF EXISTS public.get_facturacion_por_categoria(uuid, date, date);
DROP FUNCTION IF EXISTS public.get_desglose_iva(uuid, date, date);
