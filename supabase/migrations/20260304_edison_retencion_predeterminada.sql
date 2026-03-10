-- Retención IRPF -1% por defecto para empresa Edison
-- Las facturas de Edison tienen siempre retención del 1% (mostrada como RET-1% / -1%)
UPDATE empresas
SET retencion_predeterminada = -1
WHERE id = 'af15f25a-7ade-4de8-9241-a42e1b8407da';
