-- Garantizar permisos para clientes_empresas
GRANT SELECT, INSERT, DELETE ON public.clientes_empresas TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.clientes_empresas TO service_role;