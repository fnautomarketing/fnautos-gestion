# Checklist: Mejoras página Informes

## Alta prioridad
- [x] 1. Resumen de filtros activos debajo de selectores
- [x] 2. Renombrar "Fiscal" → "Desglose IVA", "Clientes y productos" → "Clientes y categorías"
- [x] 3. Mensajes de error sin referencias técnicas (migraciones SQL)
- [x] 4. Totales en tablas (Top clientes, Desglose IVA)

## Media prioridad
- [x] 5. Paleta de colores unificada en gráficos
- [x] 6. Incluir ranking de conceptos en pestaña Clientes
- [x] 7. Eliminar duplicidad evolución (Resumen vs Ventas)

## Tests
- [x] 8. Tests E2E, unitarios y validación BD

## Cómo ejecutar tests antes de producción

```bash
# Unitarios (describirPeriodo, formatFechaRango)
npm run test:run -- src/lib/informes-utils.test.ts

# E2E (página informes completa)
npm run test:e2e -- e2e/informes.spec.ts

# Verificación BD (ejecutar en Supabase SQL Editor)
# Contenido: scripts/verify-informes-db.sql
```
