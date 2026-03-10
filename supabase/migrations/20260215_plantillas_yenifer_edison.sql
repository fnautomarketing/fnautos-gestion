-- Crear plantilla Estándar para Yenifer y Edison (misma que en descarga PDF)
-- Villegas ya tiene Premium; Yenifer y Edison usan Estándar

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
  'Estándar (sin logo por defecto)',
  'Plantilla estándar de la empresa',
  true,
  true,
  '#3b82f6',
  '#1e40af',
  'Roboto'
FROM empresas
WHERE id IN (
  'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a',  -- Yenifer
  'af15f25a-7ade-4de8-9241-a42e1b8407da'   -- Edison
)
AND NOT EXISTS (
  SELECT 1 FROM plantillas_pdf WHERE plantillas_pdf.empresa_id = empresas.id
);
