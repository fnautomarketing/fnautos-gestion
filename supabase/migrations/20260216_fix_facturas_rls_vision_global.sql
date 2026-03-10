-- RLS de facturas: permitir a admins y usuarios con acceso crear/ver/editar facturas de todas sus empresas
-- Incluye Vision Global: admin puede operar sobre cualquier empresa

-- Habilitar RLS si no está
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes (por si existen con otros nombres)
DROP POLICY IF EXISTS "facturas_select" ON facturas;
DROP POLICY IF EXISTS "facturas_insert" ON facturas;
DROP POLICY IF EXISTS "facturas_update" ON facturas;
DROP POLICY IF EXISTS "facturas_delete" ON facturas;
DROP POLICY IF EXISTS "Ver facturas de su empresa" ON facturas;
DROP POLICY IF EXISTS "Crear facturas en su empresa" ON facturas;
DROP POLICY IF EXISTS "Actualizar facturas de su empresa" ON facturas;
DROP POLICY IF EXISTS "Eliminar facturas de su empresa" ON facturas;
DROP POLICY IF EXISTS "Usuarios pueden ver facturas de su empresa" ON facturas;
DROP POLICY IF EXISTS "Usuarios pueden insertar facturas" ON facturas;
DROP POLICY IF EXISTS "Usuarios pueden actualizar facturas" ON facturas;
DROP POLICY IF EXISTS "Usuarios pueden eliminar facturas" ON facturas;

-- SELECT: ver facturas donde empresa_id está en empresas del usuario O es admin
CREATE POLICY "facturas_select_vision_global"
ON facturas FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM perfiles WHERE user_id = auth.uid() AND empresa_id IS NOT NULL
    UNION
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  )
  OR (SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin'
);

-- INSERT: crear facturas donde empresa_id está en empresas del usuario O es admin
CREATE POLICY "facturas_insert_vision_global"
ON facturas FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM perfiles WHERE user_id = auth.uid() AND empresa_id IS NOT NULL
    UNION
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  )
  OR (SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin'
);

-- UPDATE: actualizar facturas donde empresa_id está en empresas del usuario O es admin
CREATE POLICY "facturas_update_vision_global"
ON facturas FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM perfiles WHERE user_id = auth.uid() AND empresa_id IS NOT NULL
    UNION
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  )
  OR (SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin'
)
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM perfiles WHERE user_id = auth.uid() AND empresa_id IS NOT NULL
    UNION
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  )
  OR (SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin'
);

-- DELETE: eliminar facturas donde empresa_id está en empresas del usuario O es admin
CREATE POLICY "facturas_delete_vision_global"
ON facturas FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM perfiles WHERE user_id = auth.uid() AND empresa_id IS NOT NULL
    UNION
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  )
  OR (SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin'
);
