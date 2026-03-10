-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  tipo text CHECK (tipo IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
  categoria text CHECK (categoria IN ('cliente', 'factura', 'pago', 'recordatorio', 'sistema')) NOT NULL,
  titulo text NOT NULL,
  mensaje text NOT NULL,
  leida boolean DEFAULT false,
  enlace text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX idx_notificaciones_user_id ON notificaciones(user_id);
CREATE INDEX idx_notificaciones_empresa_id ON notificaciones(empresa_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_created_at ON notificaciones(created_at DESC);

-- RLS Policies
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias notificaciones" 
ON notificaciones FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias notificaciones" 
ON notificaciones FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Sistema puede crear notificaciones"
ON notificaciones FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuarios pueden eliminar sus propias notificaciones"
ON notificaciones FOR DELETE
USING (auth.uid() = user_id);

-- Función para crear notificación
CREATE OR REPLACE FUNCTION crear_notificacion(
  p_user_id uuid,
  p_empresa_id uuid,
  p_tipo text,
  p_categoria text,
  p_titulo text,
  p_mensaje text,
  p_enlace text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_notificacion_id uuid;
BEGIN
  INSERT INTO notificaciones (
    user_id,
    empresa_id,
    tipo,
    categoria,
    titulo,
    mensaje,
    enlace,
    metadata
  ) VALUES (
    p_user_id,
    p_empresa_id,
    p_tipo,
    p_categoria,
    p_titulo,
    p_mensaje,
    p_enlace,
    p_metadata
  ) RETURNING id INTO v_notificacion_id;
  
  RETURN v_notificacion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar notificaciones antiguas (más de 30 días)
CREATE OR REPLACE FUNCTION limpiar_notificaciones_antiguas() RETURNS void AS $$
BEGIN
  DELETE FROM notificaciones 
  WHERE created_at < NOW() - INTERVAL '30 days' 
  AND leida = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
