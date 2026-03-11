# Reporte de Revisión QA - Factura Externa y Mejoras

## Cambios aplicados

### 1. Sin hardcodeados en selector de empresa
- **nueva-factura-form.tsx**: Eliminados IDs fijos Villegas/Yenifer/Edison. Ahora recibe `empresas` desde la página y renderiza el selector dinámicamente.

### 2. Búsqueda CIF/NIF mejorada
- **facturas/page.tsx**: Búsqueda por CIF con y sin espacios/guiones/puntos (ej. "B 12345678" encuentra "B12345678").

### 3. Filtro por serie
- **facturas/page.tsx**: Añadido `params.serie` para filtrar por `serie_id`. El enlace "Ver Facturas" desde la página Series ahora funciona.

### 4. Eliminar factura en Vision Global
- **eliminarFacturaAction**: Ya soporta Vision Global (RLS permite admin). Sin filtro `empresa_id` cuando `isGlobal`.

### 5. Factura sin serie
- **facturas-table.tsx**: Fallback cuando `factura.serie` es null para evitar "null-0001".

### 6. Migración liberar_numero_serie
- Script `scripts/apply-liberar-migration.mjs` con instrucciones.
- Ejecutar SQL manualmente en Supabase si `db push` falla.

## Tests E2E

- 7 tests en `e2e/facturas-series.spec.ts`
- Incluye: login, nueva factura, flujo completo, factura externa borrador, filtros, series

## Pendiente manual

1. **Aplicar migración** en Supabase SQL Editor si no está aplicada.
2. **QA manual**: Crear borrador externa, cargar PDF, emitir, eliminar, verificar número libre.
3. **MCP Chrome DevTools**: Revisión visual si está disponible.
