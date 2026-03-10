-- Columna numero_orden para ordenación numérica correcta (0001, 0002, ..., 0010)
-- Extrae la parte numérica final del campo numero (ej. "0009" o "F2026-0009" -> 9)

ALTER TABLE facturas ADD COLUMN IF NOT EXISTS numero_orden integer;

-- Rellenar valores existentes
UPDATE facturas
SET numero_orden = COALESCE(
  (regexp_match(numero, '[0-9]+$'))[1]::integer,
  0
)
WHERE numero_orden IS NULL;

-- Trigger para mantener numero_orden al insertar/actualizar
CREATE OR REPLACE FUNCTION set_numero_orden()
RETURNS trigger AS $$
BEGIN
  NEW.numero_orden := COALESCE(
    (regexp_match(NEW.numero, '[0-9]+$'))[1]::integer,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_numero_orden ON facturas;
CREATE TRIGGER trigger_set_numero_orden
  BEFORE INSERT OR UPDATE OF numero ON facturas
  FOR EACH ROW EXECUTE FUNCTION set_numero_orden();
