-- RLS de series_facturacion: permitir ver series de todas las empresas del usuario
-- (perfiles.empresa_id + usuarios_empresas) y admin ve todas

DROP POLICY IF EXISTS "Ver series de su empresa" ON series_facturacion;

CREATE POLICY "Ver series de su empresa"
ON series_facturacion FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM perfiles WHERE user_id = auth.uid() AND empresa_id IS NOT NULL
    UNION
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  )
  OR (SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin'
);
