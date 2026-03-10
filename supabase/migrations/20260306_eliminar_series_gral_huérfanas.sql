-- Eliminar series GRAL huérfanas (empresa_id no existe en empresas)
-- Solo deben quedar las series reales por empresa (V2026, F2026, Y2026, E2026, A2026, etc.)

DELETE FROM series_facturacion
WHERE codigo = 'GRAL'
  AND (empresa_id IS NULL OR empresa_id NOT IN (SELECT id FROM empresas));
