-- RLS de lineas_factura: permitir acceso cuando la factura pertenece a empresa del usuario o admin

ALTER TABLE lineas_factura ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lineas_factura_select" ON lineas_factura;
DROP POLICY IF EXISTS "lineas_factura_insert" ON lineas_factura;
DROP POLICY IF EXISTS "lineas_factura_update" ON lineas_factura;
DROP POLICY IF EXISTS "lineas_factura_delete" ON lineas_factura;

CREATE POLICY "lineas_factura_select_vision_global"
ON lineas_factura FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM facturas f WHERE f.id = lineas_factura.factura_id
    AND (
      f.empresa_id IN (
        SELECT empresa_id FROM perfiles WHERE user_id = auth.uid() AND empresa_id IS NOT NULL
        UNION
        SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
      )
      OR (SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin'
    )
  )
);

CREATE POLICY "lineas_factura_insert_vision_global"
ON lineas_factura FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM facturas f WHERE f.id = lineas_factura.factura_id
    AND (
      f.empresa_id IN (
        SELECT empresa_id FROM perfiles WHERE user_id = auth.uid() AND empresa_id IS NOT NULL
        UNION
        SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
      )
      OR (SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin'
    )
  )
);

CREATE POLICY "lineas_factura_update_vision_global"
ON lineas_factura FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM facturas f WHERE f.id = lineas_factura.factura_id
    AND (
      f.empresa_id IN (
        SELECT empresa_id FROM perfiles WHERE user_id = auth.uid() AND empresa_id IS NOT NULL
        UNION
        SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
      )
      OR (SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin'
    )
  )
);

CREATE POLICY "lineas_factura_delete_vision_global"
ON lineas_factura FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM facturas f WHERE f.id = lineas_factura.factura_id
    AND (
      f.empresa_id IN (
        SELECT empresa_id FROM perfiles WHERE user_id = auth.uid() AND empresa_id IS NOT NULL
        UNION
        SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
      )
      OR (SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin'
    )
  )
);
