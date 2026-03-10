-- RFC-025: Multi-Company Invoice Support
-- Execute this migration in Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Create pivot table for users <-> companies (N:M)
CREATE TABLE IF NOT EXISTS usuarios_empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    rol TEXT NOT NULL DEFAULT 'operador' CHECK (rol IN ('administrador', 'operador', 'observador')),
    empresa_activa BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, empresa_id)
);

-- 2. Add plantilla_pdf_id to facturas for per-invoice template override
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS plantilla_pdf_id UUID REFERENCES plantillas_pdf(id);

-- 3. Enable RLS for usuarios_empresas
ALTER TABLE usuarios_empresas ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "usuarios_empresas_select" ON usuarios_empresas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "usuarios_empresas_insert" ON usuarios_empresas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usuarios_empresas_update" ON usuarios_empresas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "usuarios_empresas_delete" ON usuarios_empresas
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Performance indexes
CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_user_id ON usuarios_empresas(user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_empresa_id ON usuarios_empresas(empresa_id);

-- 6. Migrate existing perfiles.empresa_id to usuarios_empresas
INSERT INTO usuarios_empresas (user_id, empresa_id, rol, empresa_activa)
SELECT user_id, empresa_id, rol, true
FROM perfiles
WHERE empresa_id IS NOT NULL
ON CONFLICT (user_id, empresa_id) DO NOTHING;

-- 7. Documentation
COMMENT ON TABLE usuarios_empresas IS 'RFC-025: Pivot table allowing users to operate multiple companies';
