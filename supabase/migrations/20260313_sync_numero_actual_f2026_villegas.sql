-- Sincronizar numero_actual de F2026 (Villegas) con el máximo de facturas emitidas.
-- La factura 0009 fue importada como externa y no incrementó el contador;
-- el próximo número correcto es 0010.
-- Nota: facturas.numero puede ser "0001" (solo dígitos) o "CODIGO-0001"; extraemos el valor numérico.
UPDATE series_facturacion s
SET numero_actual = GREATEST(
    s.numero_actual,
    COALESCE(
        (SELECT MAX(
            COALESCE(NULLIF(trim(regexp_replace(COALESCE(f.numero, '0'), '[^0-9]', '', 'g')), '')::int, 0)
        ) + 1
        FROM facturas f
        WHERE f.serie_id = s.id AND f.estado IN ('emitida', 'pagada')),
        s.numero_inicial
    )
)
WHERE s.codigo = 'F2026'
  AND s.empresa_id = '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5';
