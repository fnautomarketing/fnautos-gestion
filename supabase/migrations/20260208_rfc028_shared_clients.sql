-- Hacer empresa_id nullable para permitir clientes compartidos (globales)
ALTER TABLE clientes ALTER COLUMN empresa_id DROP NOT NULL;

-- Actualizar Policies RLS
DROP POLICY IF EXISTS "Clientes visibles por empresa" ON clientes;

CREATE POLICY "Clientes visibles por empresa o compartidos" ON clientes
FOR SELECT
USING (
  empresa_id IS NULL OR 
  empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  )
);

-- Permitir insertar/actualizar solo si el usuario pertenece a la empresa (si se especifica)
-- Para compartidos (empresa_id NULL), por ahora permitimos a cualquier usuario autenticado crear/editar
-- O podríamos restringirlo solo a admins, pero dejémoslo abierto para colaboración simple y luego restringimos si es necesario.
CREATE POLICY "Gestión de clientes" ON clientes
FOR ALL
USING (
  (empresa_id IS NULL) OR 
  (empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  ))
);
