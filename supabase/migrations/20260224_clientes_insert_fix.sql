-- Asegurar que INSERT en clientes funcione para usuarios autenticados
DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
CREATE POLICY "clientes_insert"
ON public.clientes FOR INSERT
TO authenticated
WITH CHECK (true);