-- Sincronizar total_facturado en clientes cuando cambian facturas
-- La columna total_facturado se mantiene actualizada con la suma de facturas emitidas/vencidas/parciales/pagadas

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

-- Sincronizar datos existentes: recalcular total_facturado para todos los clientes
UPDATE clientes c
SET total_facturado = COALESCE((
  SELECT SUM(f.total)::numeric
  FROM facturas f
  WHERE f.cliente_id = c.id
    AND f.estado IN ('emitida', 'vencida', 'parcial', 'pagada')
), 0);
