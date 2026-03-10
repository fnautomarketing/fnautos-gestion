-- RPC de solo lectura: devuelve el próximo número de factura SIN consumirlo.
-- Útil para mostrar preview en el formulario de nueva factura antes de emitir.
CREATE OR REPLACE FUNCTION public.obtener_proximo_numero_preview(p_serie_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_codigo text;
    v_numero_actual int;
    v_digitos int;
    v_formato text;
BEGIN
    -- Solo lectura, sin FOR UPDATE (no bloquea ni incrementa)
    SELECT codigo, numero_actual, COALESCE(digitos, 4)
    INTO v_codigo, v_numero_actual, v_digitos
    FROM series_facturacion
    WHERE id = p_serie_id;

    IF v_codigo IS NULL THEN
        RETURN NULL;
    END IF;

    v_formato := v_codigo || '-' || lpad(v_numero_actual::text, v_digitos, '0');
    RETURN v_formato;
END;
$$;
