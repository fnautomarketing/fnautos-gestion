-- RPC para liberar un número reservado cuando se elimina un borrador externa
-- Decrementa numero_actual y facturas_emitidas para que el número quede libre
CREATE OR REPLACE FUNCTION public.liberar_numero_serie(p_serie_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE series_facturacion
    SET numero_actual = GREATEST(numero_inicial, COALESCE(numero_actual, numero_inicial) - 1),
        facturas_emitidas = GREATEST(0, COALESCE(facturas_emitidas, 0) - 1)
    WHERE id = p_serie_id;
END;
$$;
