# Checklist QA Factura Externa

## Implementación Backend

- [x] 1. Migración: RPC `liberar_numero_serie` para liberar número al eliminar borrador
- [x] 2. guardarBorradorAction: reservar número al crear borrador externa
- [x] 3. emitirDesdeBorradorAction: usar número ya reservado (no consumir nuevo)
- [x] 4. emitirDesdeBorradorAction: soporte Vision Global (empresa de factura)
- [x] 5. eliminarFacturaAction: liberar número si borrador externa + Vision Global
- [x] 6. crearFacturaAction: parsear RPC y usar numero/serie correctos

## Implementación Frontend

- [x] 7. UI: mostrar número reservado en borrador externa (banner "Envía este número...")
- [x] 8. Filtros facturas: CIF/NIF (búsqueda), mes, año
- [x] 9. data-testid factura-externa-switch para E2E

## QA Manual (ejecutar manualmente)

- [ ] 10. Crear borrador externa desde Vision Global (Villegas)
- [ ] 11. Crear borrador externa desde Vision Global (Yenifer)
- [ ] 12. Crear borrador externa desde Vision Global (Edison)
- [ ] 13. Subir PDF simulado (botón "Cargar PDF de prueba") y emitir
- [ ] 14. Registrar pago
- [ ] 15. Crear borrador desde empresa Villegas seleccionada
- [ ] 16. Crear borrador desde empresa Yenifer seleccionada
- [ ] 17. Crear borrador desde empresa Edison seleccionada
- [ ] 18. Eliminar borrador externa → verificar número libre en series
- [ ] 19. Estados: Pendiente PDF, Externa Emitida
- [ ] 20. Filtros: CIF, mes, año
- [ ] 21. Página Series: números registrados

## Tests

- [x] 22. Tests E2E Playwright factura externa (crear borrador)
- [ ] 23. MCP Chrome DevTools (revisión manual)
- [x] 24. Sin valores hardcodeados (seed API usa id por query param)

## Revisión adicional (completada)

- [x] Selector empresa dinámico (sin hardcodeados)
- [x] Búsqueda CIF con espacios/guiones normalizada
- [x] Filtro por serie (Ver Facturas desde Series)
- [x] Fallback factura sin serie en tabla

## Migración pendiente

Ejecutar manualmente si `supabase db push` falla:
```sql
CREATE OR REPLACE FUNCTION public.liberar_numero_serie(p_serie_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE series_facturacion
    SET numero_actual = GREATEST(numero_inicial, COALESCE(numero_actual, numero_inicial) - 1),
        facturas_emitidas = GREATEST(0, COALESCE(facturas_emitidas, 0) - 1)
    WHERE id = p_serie_id;
END;
$$;
```
