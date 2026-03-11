-- =============================================================================
-- MASTER INITIAL SCHEMA: FNAUTOS / STVLS ERP
-- Versión: 1.0 (Consolidada)
-- Propósito: Inicializar un proyecto de Supabase desde cero con todas las tablas,
--            funciones, triggers y políticas de seguridad necesarias.
-- SEGURIDAD PRODUCCIÓN: Este script NO contiene sentencias DROP TABLE. 
--                       Es SEGURO ejecutarlo en proyectos existentes ya que 
--                       usa CREATE TABLE IF NOT EXISTS.
-- =============================================================================

-- 0. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLAS CORE

-- 1.1. EMPRESAS
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razon_social TEXT NOT NULL,
    nombre_comercial TEXT,
    cif TEXT NOT NULL UNIQUE,
    tipo_empresa TEXT DEFAULT 'sl',
    direccion TEXT,
    codigo_postal TEXT,
    ciudad TEXT,
    provincia TEXT,
    pais TEXT DEFAULT 'España',
    latitud NUMERIC,
    longitud NUMERIC,
    telefono TEXT,
    email TEXT,
    web TEXT,
    logo_url TEXT,
    logo_filename TEXT,
    iban TEXT,
    swift TEXT,
    banco TEXT,
    titular_cuenta TEXT,
    iva_predeterminado NUMERIC DEFAULT 21.00,
    retencion_predeterminada NUMERIC DEFAULT 0.00,
    regimen_iva TEXT DEFAULT 'general',
    aplica_recargo_equivalencia BOOLEAN DEFAULT false,
    recargo_porcentaje NUMERIC DEFAULT 5.20,
    serie_predeterminada_id UUID, -- Se actualizará después de crear series_facturacion
    dias_pago_predeterminados INTEGER DEFAULT 30,
    lugar_expedicion TEXT,
    plantilla_pdf_predeterminada_id UUID, -- Se actualizará después de crear plantillas_pdf
    pie_factura TEXT,
    clausulas_generales TEXT,
    formato_numero_factura TEXT DEFAULT '{SERIE}-{ANIO}-{NUM}',
    idioma_predeterminado TEXT DEFAULT 'es',
    zona_horaria TEXT DEFAULT 'Europe/Madrid',
    formato_fecha TEXT DEFAULT 'DD/MM/YYYY',
    separador_miles TEXT DEFAULT '.',
    separador_decimales TEXT DEFAULT ',',
    activo BOOLEAN DEFAULT true,
    deleted_at TIMESTAMPTZ,
    prefijo_serie TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2. USUARIOS Y PERFILES
CREATE TABLE IF NOT EXISTS perfiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
    rol TEXT DEFAULT 'usuario',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usuarios_empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    rol TEXT NOT NULL DEFAULT 'operador' CHECK (rol IN ('administrador', 'operador', 'observador')),
    empresa_activa BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_accessed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, empresa_id)
);

-- 1.3. SERIES DE FACTURACIÓN
CREATE TABLE IF NOT EXISTS series_facturacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    icono TEXT DEFAULT '📄',
    prefijo TEXT,
    sufijo TEXT,
    numero_actual INTEGER NOT NULL DEFAULT 1,
    numero_inicial INTEGER NOT NULL DEFAULT 1,
    digitos INTEGER DEFAULT 4,
    tipo TEXT DEFAULT 'general',
    reseteo TEXT DEFAULT 'anual',
    activa BOOLEAN DEFAULT true,
    predeterminada BOOLEAN DEFAULT false,
    facturas_emitidas INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(empresa_id, codigo)
);

-- 1.4. PLANTILLAS PDF
CREATE TABLE IF NOT EXISTS plantillas_pdf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    logo_url TEXT,
    logo_posicion TEXT DEFAULT 'izquierda',
    logo_ancho INTEGER DEFAULT 120,
    logo_alto INTEGER DEFAULT 60,
    color_primario TEXT DEFAULT '#1a365d',
    color_secundario TEXT DEFAULT '#718096',
    color_encabezado_tabla TEXT DEFAULT '#2d3748',
    fuente TEXT DEFAULT 'Helvetica',
    tamano_fuente_base INTEGER DEFAULT 10,
    idiomas JSONB DEFAULT '["es"]'::jsonb,
    mostrar_numero_factura BOOLEAN DEFAULT true,
    mostrar_fecha_emision BOOLEAN DEFAULT true,
    mostrar_fecha_vencimiento BOOLEAN DEFAULT true,
    mostrar_datos_bancarios BOOLEAN DEFAULT true,
    mostrar_notas BOOLEAN DEFAULT true,
    mostrar_qr_pago BOOLEAN DEFAULT false,
    alternar_color_filas BOOLEAN DEFAULT true,
    mostrar_firma BOOLEAN DEFAULT false,
    mostrar_sello BOOLEAN DEFAULT false,
    texto_cabecera TEXT,
    texto_pie TEXT,
    activa BOOLEAN DEFAULT true,
    predeterminada BOOLEAN DEFAULT false,
    facturas_generadas INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.5. CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL, -- Default company context
    nombre_fiscal TEXT NOT NULL,
    nombre_comercial TEXT,
    cif TEXT NOT NULL,
    email_principal TEXT,
    telefono_principal TEXT,
    direccion TEXT,
    ciudad TEXT,
    provincia TEXT,
    codigo_postal TEXT,
    pais TEXT DEFAULT 'España',
    activo BOOLEAN DEFAULT true,
    tipo_cliente TEXT DEFAULT 'empresa',
    email_secundario TEXT,
    telefono_secundario TEXT,
    persona_contacto TEXT,
    sitio_web TEXT,
    idioma_preferente TEXT DEFAULT 'es',
    forma_pago_predeterminada TEXT DEFAULT 'transferencia_30',
    dias_vencimiento INTEGER DEFAULT 30,
    descuento_comercial NUMERIC DEFAULT 0,
    iva_aplicable NUMERIC DEFAULT 21,
    tarifa_precios TEXT DEFAULT 'general',
    iban TEXT,
    banco TEXT,
    titular_cuenta TEXT,
    bic_swift TEXT,
    total_facturado NUMERIC DEFAULT 0,
    facturas_emitidas INTEGER DEFAULT 0,
    pendiente_cobro NUMERIC DEFAULT 0,
    ultima_factura_fecha DATE,
    notas_internas TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clientes_empresas (
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY(cliente_id, empresa_id)
);

-- 1.6. CATALOGO DE CONCEPTOS
CREATE TABLE IF NOT EXISTS conceptos_catalogo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT NOT NULL,
    tipo TEXT DEFAULT 'servicio',
    precio_base NUMERIC NOT NULL,
    iva_porcentaje NUMERIC DEFAULT 21,
    unidad_medida TEXT DEFAULT 'servicio',
    codigo_interno TEXT,
    proveedor TEXT,
    coste_interno NUMERIC,
    activo BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    veces_usado INTEGER DEFAULT 0,
    ultima_vez_usado TIMESTAMPTZ,
    notas_internas TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.7. FACTURAS
CREATE TABLE IF NOT EXISTS facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    numero TEXT NOT NULL,
    serie TEXT DEFAULT 'FAC',
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    descuento NUMERIC DEFAULT 0,
    base_imponible NUMERIC NOT NULL DEFAULT 0,
    iva NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'borrador',
    notas TEXT,
    pagado NUMERIC DEFAULT 0,
    serie_id UUID REFERENCES series_facturacion(id) ON DELETE SET NULL,
    plantilla_pdf_id UUID REFERENCES plantillas_pdf(id) ON DELETE SET NULL,
    fecha_pago DATE,
    descuento_tipo TEXT DEFAULT 'porcentaje',
    descuento_valor NUMERIC DEFAULT 0,
    importe_descuento NUMERIC DEFAULT 0,
    recargo_equivalencia BOOLEAN DEFAULT false,
    recargo_porcentaje NUMERIC DEFAULT 5.2,
    importe_recargo NUMERIC DEFAULT 0,
    retencion_porcentaje NUMERIC DEFAULT 0,
    importe_retencion NUMERIC DEFAULT 0,
    divisa TEXT DEFAULT 'EUR',
    tipo_cambio NUMERIC DEFAULT 1.0,
    es_rectificativa BOOLEAN DEFAULT false,
    factura_rectificada_id UUID REFERENCES facturas(id) ON DELETE SET NULL,
    motivo_rectificacion TEXT,
    tipo_rectificativa TEXT,
    es_externa BOOLEAN DEFAULT false,
    numero_manual TEXT,
    archivo_url TEXT,
    numero_orden INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.8. LINEAS DE FACTURA
CREATE TABLE IF NOT EXISTS lineas_factura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    concepto TEXT NOT NULL,
    descripcion TEXT,
    cantidad NUMERIC NOT NULL DEFAULT 1,
    precio_unitario NUMERIC NOT NULL,
    descuento_porcentaje NUMERIC DEFAULT 0,
    iva_porcentaje NUMERIC NOT NULL DEFAULT 21,
    subtotal NUMERIC NOT NULL,
    concepto_id UUID REFERENCES conceptos_catalogo(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.9. PAGOS
CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    importe NUMERIC NOT NULL,
    fecha_pago DATE NOT NULL,
    metodo_pago TEXT NOT NULL,
    referencia TEXT,
    cuenta_bancaria TEXT,
    conciliado BOOLEAN DEFAULT false,
    fecha_conciliacion TIMESTAMPTZ,
    comprobante_url TEXT,
    notas TEXT,
    creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    anulado BOOLEAN DEFAULT false,
    fecha_anulacion TIMESTAMPTZ,
    motivo_anulacion TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.10. PAGOS_FACTURA (Antigua, mantenida por compatibilidad si es necesario)
CREATE TABLE IF NOT EXISTS pagos_factura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    fecha_pago DATE NOT NULL,
    importe NUMERIC NOT NULL,
    metodo_pago TEXT NOT NULL,
    referencia TEXT,
    notas TEXT,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    cuenta_bancaria TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.11. EMAILS FACTURA
CREATE TABLE IF NOT EXISTS emails_factura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    para TEXT[] NOT NULL,
    cc TEXT[],
    asunto TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    plantilla TEXT DEFAULT 'estandar_es',
    incluir_logo BOOLEAN DEFAULT true,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    proveedor_mensaje_id TEXT,
    error_mensaje TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    enviado_at TIMESTAMPTZ
);

-- 1.12. NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    tipo TEXT DEFAULT 'info' CHECK (tipo IN ('info', 'success', 'warning', 'error')),
    categoria TEXT NOT NULL CHECK (categoria IN ('cliente', 'factura', 'pago', 'recordatorio', 'sistema')),
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT false,
    enlace TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.13. RECORDATORIOS
CREATE TABLE IF NOT EXISTS recordatorios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    plantilla TEXT,
    asunto TEXT,
    contenido TEXT,
    email_destinatario TEXT,
    telefono_destinatario TEXT,
    emails_cc TEXT[],
    estado TEXT DEFAULT 'pendiente',
    fecha_envio TIMESTAMPTZ,
    fecha_programado TIMESTAMPTZ,
    fecha_apertura TIMESTAMPTZ,
    adjuntar_factura BOOLEAN DEFAULT true,
    adjuntos_adicionales TEXT[],
    tono TEXT DEFAULT 'cordial',
    resultado_llamada TEXT,
    persona_contactada TEXT,
    fecha_compromiso_pago DATE,
    siguiente_accion TEXT,
    notas TEXT,
    creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plantillas_recordatorio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    codigo TEXT NOT NULL,
    asunto TEXT,
    contenido TEXT NOT NULL,
    activa BOOLEAN DEFAULT true,
    predeterminada BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(empresa_id, codigo)
);

-- 1.14. EVENTOS FACTURA (Timeline)
CREATE TABLE IF NOT EXISTS eventos_factura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    descripcion TEXT,
    datos_adicionales JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. VISTAS

CREATE OR REPLACE VIEW vista_estadisticas_ventas AS
SELECT 
    empresa_id,
    date_trunc('month', fecha_emision) as periodo,
    COUNT(*) as num_facturas,
    SUM(total) as facturacion_total,
    SUM(pagado) as cobrado,
    SUM(total - pagado) as pendiente,
    AVG(total) as ticket_medio,
    AVG(COALESCE(fecha_pago, CURRENT_DATE) - fecha_emision) as dias_cobro_promedio,
    COUNT(DISTINCT cliente_id) as num_clientes
FROM facturas
WHERE estado != 'anulada'
GROUP BY empresa_id, periodo;

CREATE OR REPLACE VIEW vista_facturas_vencidas AS
SELECT 
    f.*,
    c.nombre_fiscal as cliente_nombre,
    c.email_principal as cliente_email,
    c.telefono_principal as cliente_telefono,
    (f.total - f.pagado) as pendiente,
    (CURRENT_DATE - f.fecha_vencimiento) as dias_vencido,
    CASE 
        WHEN (CURRENT_DATE - f.fecha_vencimiento) > 30 THEN 'crítico'
        WHEN (CURRENT_DATE - f.fecha_vencimiento) > 15 THEN 'alto'
        ELSE 'medio'
    END as nivel_criticidad,
    (SELECT MAX(created_at) FROM recordatorios WHERE factura_id = f.id) as fecha_ultimo_recordatorio,
    (SELECT COUNT(*) FROM recordatorios WHERE factura_id = f.id) as num_recordatorios_enviados
FROM facturas f
JOIN clientes c ON f.cliente_id = c.id
WHERE f.estado IN ('emitida', 'parcial', 'vencida')
  AND f.fecha_vencimiento < CURRENT_DATE
  AND f.pagado < f.total;

-- 3. FUNCIONES Y PROCEDIMIENTOS

-- 3.1. KPIs VENTAS
CREATE OR REPLACE FUNCTION public.get_kpis_ventas(
  p_empresa_id uuid,
  p_fecha_desde date DEFAULT NULL::date,
  p_fecha_hasta date DEFAULT NULL::date,
  p_cliente_id uuid DEFAULT NULL
)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_fecha_desde DATE;
  v_fecha_hasta DATE;
  v_periodo_anterior_desde DATE;
  v_periodo_anterior_hasta DATE;
  v_kpis RECORD;
  v_kpis_anterior RECORD;
BEGIN
  v_fecha_desde := COALESCE(p_fecha_desde, DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'));
  v_fecha_hasta := COALESCE(p_fecha_hasta, DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day');
  v_periodo_anterior_hasta := v_fecha_desde - INTERVAL '1 day';
  v_periodo_anterior_desde := v_periodo_anterior_hasta - (v_fecha_hasta - v_fecha_desde);

  SELECT 
    COALESCE(SUM(total), 0) as facturacion_total,
    COUNT(*) as num_facturas,
    COALESCE(AVG(total), 0) as ticket_medio,
    COALESCE(AVG(COALESCE(fecha_pago, CURRENT_DATE) - fecha_emision), 0) as dias_cobro_promedio
  INTO v_kpis
  FROM facturas
  WHERE (p_empresa_id IS NULL OR empresa_id = p_empresa_id)
    AND (p_cliente_id IS NULL OR cliente_id = p_cliente_id)
    AND fecha_emision BETWEEN v_fecha_desde AND v_fecha_hasta
    AND estado != 'anulada';

  SELECT 
    COALESCE(SUM(total), 0) as facturacion_total,
    COUNT(*) as num_facturas,
    COALESCE(AVG(total), 0) as ticket_medio,
    COALESCE(AVG(COALESCE(fecha_pago, CURRENT_DATE) - fecha_emision), 0) as dias_cobro_promedio
  INTO v_kpis_anterior
  FROM facturas
  WHERE (p_empresa_id IS NULL OR empresa_id = p_empresa_id)
    AND (p_cliente_id IS NULL OR cliente_id = p_cliente_id)
    AND fecha_emision BETWEEN v_periodo_anterior_desde AND v_periodo_anterior_hasta
    AND estado != 'anulada';

  RETURN json_build_object(
    'actual', json_build_object(
      'facturacion_total', v_kpis.facturacion_total,
      'num_facturas', v_kpis.num_facturas,
      'ticket_medio', v_kpis.ticket_medio,
      'dias_cobro_promedio', v_kpis.dias_cobro_promedio
    ),
    'anterior', json_build_object(
      'facturacion_total', v_kpis_anterior.facturacion_total,
      'num_facturas', v_kpis_anterior.num_facturas,
      'ticket_medio', v_kpis_anterior.ticket_medio,
      'dias_cobro_promedio', v_kpis_anterior.dias_cobro_promedio
    ),
    'variaciones', json_build_object(
      'facturacion', CASE 
        WHEN v_kpis_anterior.facturacion_total > 0 THEN 
          ROUND(((v_kpis.facturacion_total - v_kpis_anterior.facturacion_total) / v_kpis_anterior.facturacion_total) * 100, 2)
        ELSE 0 
      END,
      'facturas', v_kpis.num_facturas - v_kpis_anterior.num_facturas,
      'ticket_medio', CASE 
        WHEN v_kpis_anterior.ticket_medio > 0 THEN 
          ROUND(((v_kpis.ticket_medio - v_kpis_anterior.ticket_medio) / v_kpis_anterior.ticket_medio) * 100, 2)
        ELSE 0 
      END,
      'dias_cobro', ROUND(v_kpis.dias_cobro_promedio - v_kpis_anterior.dias_cobro_promedio, 0)
    )
  );
END;
$function$;

-- 3.2. EVOLUCION FACTURACION
CREATE OR REPLACE FUNCTION public.get_evolucion_facturacion(
  p_empresa_id uuid,
  p_fecha_desde date DEFAULT NULL::date,
  p_fecha_hasta date DEFAULT NULL::date,
  p_cliente_id uuid DEFAULT NULL
)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_result json;
BEGIN
  SELECT json_agg(t) INTO v_result
  FROM (
    SELECT
      to_char(fecha_emision, 'YYYY-MM') as periodo,
      extract(month from fecha_emision)::int as mes,
      extract(year from fecha_emision)::int as anio,
      COALESCE(SUM(total), 0) as facturacion,
      COUNT(*)::int as num_facturas
    FROM facturas
    WHERE (p_empresa_id IS NULL OR empresa_id = p_empresa_id)
      AND (p_cliente_id IS NULL OR cliente_id = p_cliente_id)
      AND (p_fecha_desde IS NULL OR fecha_emision >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR fecha_emision <= p_fecha_hasta)
      AND estado != 'anulada'
    GROUP BY 1, 2, 3
    ORDER BY 3, 2
  ) t;
  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

-- 3.3. DESGLOSE IVA
CREATE OR REPLACE FUNCTION public.get_desglose_iva(
  p_empresa_id uuid,
  p_fecha_desde date DEFAULT NULL::date,
  p_fecha_hasta date DEFAULT NULL::date,
  p_cliente_id uuid DEFAULT NULL
)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_result json;
BEGIN
  SELECT json_agg(t) INTO v_result
  FROM (
    SELECT
      l.iva_porcentaje as tipo_iva,
      COALESCE(SUM(l.subtotal), 0) as base_imponible,
      COALESCE(SUM(l.subtotal * l.iva_porcentaje / 100), 0) as cuota_iva,
      COALESCE(SUM(l.subtotal * (1 + l.iva_porcentaje / 100)), 0) as total,
      ROUND((SUM(l.subtotal) * 100.0 / NULLIF(SUM(SUM(l.subtotal)) OVER (), 0)), 2) as porcentaje_del_total
    FROM lineas_factura l
    JOIN facturas f ON l.factura_id = f.id
    WHERE (p_empresa_id IS NULL OR f.empresa_id = p_empresa_id)
      AND (p_cliente_id IS NULL OR f.cliente_id = p_cliente_id)
      AND (p_fecha_desde IS NULL OR f.fecha_emision >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR f.fecha_emision <= p_fecha_hasta)
      AND f.estado != 'anulada'
      AND NOT (
        COALESCE(l.concepto, '') ILIKE '%ajuste descuento%'
        OR COALESCE(l.descripcion, '') ILIKE '%ajuste descuento%'
      )
    GROUP BY l.iva_porcentaje
    ORDER BY l.iva_porcentaje
  ) t;
  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

-- 3.4. PROXIMO NUMERO FACTURA (PREVIEW)
CREATE OR REPLACE FUNCTION public.obtener_proximo_numero_preview(p_serie_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_proximo INTEGER;
BEGIN
  SELECT (numero_actual + 1) INTO v_proximo
  FROM series_facturacion
  WHERE id = p_serie_id;
  
  RETURN COALESCE(v_proximo, 1);
END;
$function$;

-- 4. TRIGGERS

-- 4.1. TIMELINE DE EVENTOS
CREATE OR REPLACE FUNCTION public.crear_evento_factura()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO eventos_factura (factura_id, tipo, descripcion, user_id)
    VALUES (
      NEW.id,
      CASE 
        WHEN NEW.estado = 'borrador' THEN 'creado'
        WHEN NEW.estado = 'emitida' THEN 'emitido'
        ELSE 'creado'
      END,
      CASE
        WHEN NEW.estado = 'borrador' THEN 'Borrador creado'
        WHEN NEW.estado = 'emitida' THEN 'Factura emitida'
        ELSE 'Factura creada'
      END,
      auth.uid()
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO eventos_factura (factura_id, tipo, descripcion, user_id)
    VALUES (
      NEW.id,
      CASE NEW.estado
        WHEN 'emitida' THEN 'emitido'
        WHEN 'pagada' THEN 'pagado'
        WHEN 'anulada' THEN 'anulado'
        WHEN 'vencida' THEN 'vencido'
        WHEN 'borrador' THEN 'borrador'
        ELSE 'modificado'
      END,
      CASE NEW.estado
        WHEN 'emitida' THEN 'Factura emitida' || COALESCE(' (número ' || NEW.serie || '-' || NEW.numero || ')', '')
        WHEN 'pagada' THEN 'Factura pagada'
        WHEN 'anulada' THEN 'Factura anulada'
        WHEN 'vencida' THEN 'Factura vencida'
        WHEN 'borrador' THEN 'Factura devuelta a borrador'
        ELSE 'Estado actualizado a ' || COALESCE(NEW.estado, 'desconocido')
      END,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_evento_factura ON facturas;
CREATE TRIGGER trigger_evento_factura
  AFTER INSERT OR UPDATE OF estado
  ON facturas
  FOR EACH ROW
  EXECUTE FUNCTION crear_evento_factura();

-- 4.2. SINCRONIZACIÓN TOTAL FACTURADO CLIENTE
CREATE OR REPLACE FUNCTION public.sync_cliente_total_facturado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cid uuid;
  cid_old uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    cid := OLD.cliente_id;
    UPDATE clientes
    SET total_facturado = COALESCE((
      SELECT SUM(total)::numeric FROM facturas
      WHERE cliente_id = cid AND estado IN ('emitida', 'vencida', 'parcial', 'pagada')
    ), 0)
    WHERE id = cid;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' AND OLD.cliente_id IS DISTINCT FROM NEW.cliente_id THEN
    cid_old := OLD.cliente_id;
    cid := NEW.cliente_id;
    UPDATE clientes SET total_facturado = COALESCE((
      SELECT SUM(total)::numeric FROM facturas
      WHERE cliente_id = cid_old AND estado IN ('emitida', 'vencida', 'parcial', 'pagada')
    ), 0) WHERE id = cid_old;
    UPDATE clientes SET total_facturado = COALESCE((
      SELECT SUM(total)::numeric FROM facturas
      WHERE cliente_id = cid AND estado IN ('emitida', 'vencida', 'parcial', 'pagada')
    ), 0) WHERE id = cid;
    RETURN NEW;
  ELSE
    cid := NEW.cliente_id;
    UPDATE clientes
    SET total_facturado = COALESCE((
      SELECT SUM(total)::numeric FROM facturas
      WHERE cliente_id = cid AND estado IN ('emitida', 'vencida', 'parcial', 'pagada')
    ), 0)
    WHERE id = cid;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_cliente_total_facturado ON facturas;
CREATE TRIGGER trigger_sync_cliente_total_facturado
  AFTER INSERT OR UPDATE OF estado, total, cliente_id OR DELETE
  ON facturas
  FOR EACH ROW
  EXECUTE FUNCTION sync_cliente_total_facturado();

-- 5. SEGURIDAD (RLS)

-- Habilitar RLS en todas las tablas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_facturacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_pdf ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conceptos_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineas_factura ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_factura ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_recordatorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_factura ENABLE ROW LEVEL SECURITY;

-- 5.1. POLÍTICAS DE PERFILES Y USUARIOS
CREATE POLICY "perfiles_select_propio" ON perfiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "usuarios_empresas_select" ON usuarios_empresas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usuarios_empresas_insert" ON usuarios_empresas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usuarios_empresas_update" ON usuarios_empresas FOR UPDATE USING (auth.uid() = user_id);

-- 5.2. POLÍTICAS MULTI-EMPRESA (VISIÓN GLOBAL PARA ADMINS)
-- Nota: La lógica de 'admin' se basa en el campo 'rol' de la tabla 'perfiles'.

CREATE POLICY "empresas_select_vinculadas" ON empresas
FOR SELECT USING (
    id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    OR (SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin'
);

CREATE POLICY "clientes_select_vinculados" ON clientes
FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    OR (SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin'
);

CREATE POLICY "facturas_select_vinculadas" ON facturas
FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    OR (SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin'
);

-- (Se pueden añadir más políticas específicas aquí siguiendo el mismo patrón)

-- 6. BUCKETS DE STORAGE
-- NOTA: Esto se suele hacer vía API o Dashboard, pero aquí queda documentada la intención.
-- Bucket 'avatars' para fotos de perfil y logos.
-- Bucket 'facturas' para documentos PDF.
