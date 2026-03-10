
BEGIN;

-- 1. Updates to RLS for global admin access
-- Policy for usuarios_empresas: allow if user is owner OR admin (global)
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias vinculaciones" ON usuarios_empresas;
CREATE POLICY "Usuarios pueden ver sus propias vinculaciones"
ON usuarios_empresas FOR SELECT
USING (
  auth.uid() = user_id
  OR 
  (SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin'
);

-- Policy for empresas: allow if user belongs to empresa OR is admin (global)
DROP POLICY IF EXISTS "Usuarios pueden ver empresas a las que pertenecen" ON empresas;
CREATE POLICY "Usuarios pueden ver empresas a las que pertenecen"
ON empresas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM usuarios_empresas
    WHERE usuarios_empresas.empresa_id = empresas.id
    AND usuarios_empresas.user_id = auth.uid()
  )
  OR
  (SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin'
);

-- 2. Insert default PDF template if not exists
INSERT INTO plantillas_pdf (
  empresa_id, 
  nombre, 
  descripcion, 
  activa, 
  predeterminada, 
  color_primario,
  color_secundario,
  fuente
) 
SELECT 
  id, 
  'Plantilla Básica', 
  'Plantilla estándar de la empresa', 
  true, 
  true, 
  '#3b82f6',
  '#1e40af',
  'Roboto'
FROM empresas
WHERE NOT EXISTS (
  SELECT 1 FROM plantillas_pdf WHERE plantillas_pdf.empresa_id = empresas.id
);

COMMIT;
