-- Tabla N:M para asociar clientes a empresas específicas
-- Permite: común para todas (3 filas) o solo para algunas (ej: Edison + Yenifer)

CREATE TABLE IF NOT EXISTS public.clientes_empresas (
    cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (cliente_id, empresa_id)
);

CREATE INDEX IF NOT EXISTS idx_clientes_empresas_empresa_id ON public.clientes_empresas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresas_cliente_id ON public.clientes_empresas(cliente_id);

-- RLS
ALTER TABLE public.clientes_empresas ENABLE ROW LEVEL SECURITY;

-- Usuarios ven solo filas de empresas a las que tienen acceso; admins ven todo
CREATE POLICY "clientes_empresas_select"
ON public.clientes_empresas FOR SELECT
USING (
    empresa_id IN (
        SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
        UNION
        SELECT e.id FROM empresas e
        WHERE EXISTS (SELECT 1 FROM perfiles p WHERE p.user_id = auth.uid() AND p.rol = 'admin')
    )
);

CREATE POLICY "clientes_empresas_insert"
ON public.clientes_empresas FOR INSERT
WITH CHECK (
    empresa_id IN (
        SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
        UNION
        SELECT e.id FROM empresas e
        WHERE EXISTS (SELECT 1 FROM perfiles p WHERE p.user_id = auth.uid() AND p.rol = 'admin')
    )
);

CREATE POLICY "clientes_empresas_delete"
ON public.clientes_empresas FOR DELETE
USING (
    empresa_id IN (
        SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
        UNION
        SELECT e.id FROM empresas e
        WHERE EXISTS (SELECT 1 FROM perfiles p WHERE p.user_id = auth.uid() AND p.rol = 'admin')
    )
);

-- Migrar datos existentes:
-- empresa_id IS NULL → insertar en clientes_empresas para TODAS las empresas
-- empresa_id = X → insertar solo (cliente_id, X)
INSERT INTO public.clientes_empresas (cliente_id, empresa_id)
SELECT c.id, e.id
FROM public.clientes c
CROSS JOIN public.empresas e
WHERE c.empresa_id IS NULL
ON CONFLICT (cliente_id, empresa_id) DO NOTHING;

INSERT INTO public.clientes_empresas (cliente_id, empresa_id)
SELECT id, empresa_id
FROM public.clientes
WHERE empresa_id IS NOT NULL
ON CONFLICT (cliente_id, empresa_id) DO NOTHING;

-- Comentario: a partir de ahora empresa_id en clientes se mantiene NULL para compartidos.
-- La visibilidad se determina por clientes_empresas.