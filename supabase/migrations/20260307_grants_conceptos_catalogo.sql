-- Permisos para que la pestaña "Clientes y productos" (get_ranking_conceptos) pueda leer conceptos_catalogo.
-- Sin esto, authenticated recibe "permission denied for table conceptos_catalogo".

GRANT SELECT ON public.conceptos_catalogo TO authenticated;
GRANT SELECT ON public.conceptos_catalogo TO service_role;
