-- Actualizar RLS de clientes para usar clientes_empresas
-- Un cliente es visible si tiene al menos una fila en clientes_empresas para una empresa del usuario

DROP POLICY IF EXISTS "Clientes visibles por empresa o compartidos" ON public.clientes;
DROP POLICY IF EXISTS "Gestión de clientes" ON public.clientes;

-- SELECT: ver clientes que tienen fila en clientes_empresas para alguna empresa del usuario
CREATE POLICY "clientes_select_por_empresas"
ON public.clientes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clientes_empresas ce
    WHERE ce.cliente_id = clientes.id
    AND ce.empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
      UNION
      SELECT e.id FROM empresas e
      WHERE EXISTS (SELECT 1 FROM perfiles p WHERE p.user_id = auth.uid() AND p.rol = 'admin')
    )
  )
);

-- INSERT: cualquier usuario autenticado puede crear (empresa_id = NULL, luego insertamos en clientes_empresas)
CREATE POLICY "clientes_insert"
ON public.clientes FOR INSERT
WITH CHECK (true);

-- UPDATE: si el cliente pertenece a alguna empresa del usuario
CREATE POLICY "clientes_update"
ON public.clientes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.clientes_empresas ce
    WHERE ce.cliente_id = clientes.id
    AND ce.empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
      UNION
      SELECT e.id FROM empresas e
      WHERE EXISTS (SELECT 1 FROM perfiles p WHERE p.user_id = auth.uid() AND p.rol = 'admin')
    )
  )
);

-- DELETE: si el cliente pertenece a alguna empresa del usuario
CREATE POLICY "clientes_delete"
ON public.clientes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.clientes_empresas ce
    WHERE ce.cliente_id = clientes.id
    AND ce.empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
      UNION
      SELECT e.id FROM empresas e
      WHERE EXISTS (SELECT 1 FROM perfiles p WHERE p.user_id = auth.uid() AND p.rol = 'admin')
    )
  )
);