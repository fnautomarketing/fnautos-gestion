-- Timeline de Eventos: registrar cambios de estado (emitida, pagada, anulada, etc.)
-- El trigger anterior solo disparaba en INSERT. Ahora también en UPDATE cuando cambia estado.

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
