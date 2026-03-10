-- Migration: Add RLS Policies to usuarios_empresas
-- Apply this in Supabase SQL Editor

-- Enable RLS
ALTER TABLE usuarios_empresas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "usuarios_pueden_ver_sus_empresas" ON usuarios_empresas;
DROP POLICY IF EXISTS "usuarios_pueden_unirse_a_empresas" ON usuarios_empresas;
DROP POLICY IF EXISTS "usuarios_pueden_actualizar_sus_empresas" ON usuarios_empresas;
DROP POLICY IF EXISTS "usuarios_pueden_eliminar_sus_empresas" ON usuarios_empresas;

-- SELECT: Users can see their own company associations
CREATE POLICY "usuarios_pueden_ver_sus_empresas"
ON usuarios_empresas FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: Users can add themselves to companies
CREATE POLICY "usuarios_pueden_unirse_a_empresas"
ON usuarios_empresas FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their records
CREATE POLICY "usuarios_pueden_actualizar_sus_empresas"
ON usuarios_empresas FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Users can remove themselves from companies
CREATE POLICY "usuarios_pueden_eliminar_sus_empresas"
ON usuarios_empresas FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON usuarios_empresas TO authenticated;
