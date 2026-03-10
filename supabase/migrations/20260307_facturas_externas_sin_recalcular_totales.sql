-- Facturas externas: no recalcular totales (respetar valores del PDF)
-- El trigger calcular_totales_factura sobrescribía base, iva, total, etc.
-- Para es_externa=true, mantener los valores insertados/actualizados sin recalcular.

CREATE OR REPLACE FUNCTION public.calcular_totales_factura()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_subtotal DECIMAL(12,2);
    v_descuento_valor DECIMAL(10,2);
    v_importe_descuento DECIMAL(12,2);
    v_base_imponible DECIMAL(12,2);
    v_iva DECIMAL(12,2);
    v_total_iva DECIMAL(12,2);
    v_recargo_porcentaje DECIMAL(5,2);
    v_importe_recargo DECIMAL(12,2);
    v_retencion_porcentaje DECIMAL(5,2);
    v_efecto_retencion DECIMAL(12,2);
    v_importe_retencion DECIMAL(12,2);
    v_total DECIMAL(12,2);
BEGIN
    -- Facturas externas: no recalcular, respetar valores del PDF
    IF COALESCE(NEW.es_externa, false) = true THEN
        RETURN NEW;
    END IF;

    -- 1. Calculate subtotal from invoice lines
    SELECT COALESCE(SUM(subtotal), 0) INTO v_subtotal
    FROM lineas_factura
    WHERE factura_id = NEW.id;
    
    NEW.subtotal := v_subtotal;
    
    -- 2. Calculate Discount
    v_descuento_valor := COALESCE(NEW.descuento_valor, 0);
    
    IF NEW.descuento_tipo = 'porcentaje' THEN
        v_importe_descuento := (v_subtotal * v_descuento_valor) / 100;
    ELSE
        v_importe_descuento := v_descuento_valor;
    END IF;
    
    IF v_importe_descuento > v_subtotal THEN
        v_importe_descuento := v_subtotal;
    END IF;

    NEW.importe_descuento := v_importe_descuento;
    
    -- 3. Calculate Base Imponible
    v_base_imponible := v_subtotal - v_importe_descuento;
    NEW.base_imponible := v_base_imponible;

    -- 4. Calculate IVA
    DECLARE
        v_iva_total_lines DECIMAL(12,2);
    BEGIN
        SELECT COALESCE(SUM(subtotal * (iva_porcentaje / 100)), 0) INTO v_iva_total_lines
        FROM lineas_factura
        WHERE factura_id = NEW.id;
        
        IF v_subtotal > 0 THEN
            v_total_iva := v_iva_total_lines * (1 - (v_importe_descuento / v_subtotal));
        ELSE
            v_total_iva := 0;
        END IF;
    END;
    
    NEW.iva := v_total_iva;

    -- 5. Calculate Recargo de Equivalencia
    IF NEW.recargo_equivalencia THEN
        v_recargo_porcentaje := COALESCE(NEW.recargo_porcentaje, 5.2);
        v_importe_recargo := (v_base_imponible * v_recargo_porcentaje) / 100;
    ELSE
        v_importe_recargo := 0;
    END IF;
    
    NEW.importe_recargo := v_importe_recargo;

    -- 6. Calculate Retencion IRPF
    v_retencion_porcentaje := COALESCE(NEW.retencion_porcentaje, 0);
    v_efecto_retencion := (v_base_imponible * v_retencion_porcentaje) / 100;
    v_importe_retencion := ABS(v_efecto_retencion);
    NEW.importe_retencion := v_importe_retencion;

    -- 7. Calculate Total
    v_total := v_base_imponible + v_total_iva + v_importe_recargo + v_efecto_retencion;
    
    NEW.total := v_total;
    
    RETURN NEW;
END;
$function$;
