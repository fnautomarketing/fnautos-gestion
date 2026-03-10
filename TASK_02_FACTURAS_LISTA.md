# Task 02: Verificación Visual y UX - Listado de Facturas

## Objetivo
Asegurar que el listado de facturas sea informativo, funcional y bien estructurado.

## Checklist

### 1. Lista de Facturas (`/ventas/facturas`)
- [ ] Stats cards superiores muestran datos reales y están alineados.
- [ ] Tabla de facturas carga correctamente con skeletons de carga inicial.
- [ ] Filtros por Estado (Borrador, Emitida, Pagada, Anulada) funcionan.
- [ ] Filtro por Fecha y Búsqueda por Serie/Número funcionan.
- [ ] Paginación al final de la tabla es funcional y visible.
- [ ] El diseño de las filas es limpio y el badge de estado es legible.
- [ ] Hover effect en las filas para indicar que son clickeables.
- [ ] Responsive: En móvil la tabla debe tener scroll horizontal o una vista simplificada.

## Instrucciones para el Agente
1. Navegar a `/ventas/facturas`.
2. Probar cada filtro y verificar que la URL se actualice (si aplica) y los datos cambien.
3. Verificar que no haya errores de "ilike" en la consola de Supabase (especialmente en búsqueda).
4. Capturar screenshots de la lista con y sin filtros aplicados.
5. Documentar cualquier superposición de elementos (ej: sidebar sobre tabla).
