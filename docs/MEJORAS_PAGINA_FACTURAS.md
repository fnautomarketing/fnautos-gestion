# Mejoras Página de Facturas – Checklist

Documento detallado con todas las mejoras identificadas para la página de facturas. Cada ítem incluye checkbox para marcar el progreso.

---

## 1. Exportación

### 1.1 Exportar a Excel (XLSX)
- [x] Añadir botón "Exportar Excel" junto a "Exportar CSV"
- [x] Usar librería `exceljs` para generar archivos .xlsx
- [x] Contenido del Excel (columnas recomendadas, orden de izquierda a derecha):
  - [x] **Número** (ej. F2026-0001)
  - [x] **Serie**
  - [x] **Cliente** (nombre fiscal)
  - [x] **CIF/NIF**
  - [x] **Fecha Emisión** (formato dd/mm/yyyy)
  - [x] **Fecha Vencimiento** (formato dd/mm/yyyy)
  - [x] **Base Imponible** (€)
  - [x] **IVA** (€)
  - [x] **Descuento** (€)
  - [x] **Retención IRPF** (€)
  - [x] **Total** (€)
  - [x] **Estado** (Emitida, Pagada, etc.)
  - [x] **Externa** (Sí/No)
  - [x] **Empresa** (nombre comercial)
- [x] Opción "Exportar página actual" vs "Exportar todas (filtradas)"
- [x] Formato de números: separador de miles y decimales español (1.234,56)
- [x] Encabezados con estilo (negrita, fondo)
- [x] Ancho de columnas autoajustado

### 1.2 Mejorar Exportar CSV
- [x] Añadir opción "Exportar todas las facturas filtradas" (no solo la página actual)
- [x] Incluir las mismas columnas que el Excel para consistencia
- [x] Aviso claro cuando solo se exporta la página actual (menú diferenciado)

---

## 2. Ordenación por columnas en la tabla

### 2.1 Clic en cabeceras para ordenar
- [x] Hacer las cabeceras de la tabla clicables para ordenar
- [x] Columnas ordenables: Número, Cliente, Fecha Emisión, Fecha Vencimiento, Total, Estado
- [x] Indicador visual de columna ordenada (flecha ↑/↓)
- [x] Alternar ascendente/descendente al hacer clic
- [x] Sincronizar con el filtro "Ordenar" existente

### 2.2 Ordenación numérica correcta para Número
- [x] Ordenar por número de factura de forma numérica: 0001, 0002, 0003, …, 0010, 0011 (no alfabética)
- [x] Considerar serie + número: F2026-0001 antes que F2026-0002
- [x] Parsear `numero` como entero para ordenar (ej. "0009" → 9) vía columna `numero_orden`
- [x] Si hay varias series, ordenar por serie alfabética y luego por número numérico

---

## 3. Rendimiento y datos

### 3.1 Consolidar queries
- [ ] Crear RPC o función que devuelva facturas + stats + enviadaIds en una sola llamada
- [ ] Evitar duplicar la lógica de filtros entre query principal y stats
- [ ] Reducir consultas a `emails_factura` (actualmente 2 veces)

### 3.2 Búsqueda por importe
- [ ] Permitir búsqueda aproximada por importe (rango ±0.01 o tolerancia)
- [ ] O mostrar mensaje cuando no hay coincidencia exacta

### 3.3 Paginación
- [ ] Añadir opción "100 por página" en el selector
- [ ] Añadir "Ir a página X" o input para saltar a página concreta cuando totalPages > 5

---

## 4. UX / Interfaz

### 4.1 Filtros en móvil
- [ ] En viewport móvil: botón "Filtros" que abra Sheet con todos los filtros
- [ ] En desktop: mantener filtros expandidos como ahora
- [ ] Badge con número de filtros activos en el botón "Filtros"

### 4.2 Tabla responsive
- [ ] En móvil: considerar cards por fila en lugar de tabla, o scroll horizontal con indicador
- [ ] Mostrar Fecha Emisión en móvil (segunda línea bajo cliente o tooltip)
- [ ] Agrupar acciones (Ver, PDF, Email) en menú "⋮" en móvil para ahorrar espacio

### 4.3 Estado vacío
- [ ] Mensaje distinto cuando no hay facturas en el sistema vs cuando los filtros no devuelven resultados
- [ ] Sugerencia "Crear primera factura" vs "Ajustar filtros" según el caso

### 4.4 Breadcrumbs
- [ ] Hacer "Ventas" enlace a `/ventas` en el breadcrumb

---

## 5. Accesibilidad

- [ ] Añadir `aria-label` a botones de icono (Eye, Download, Mail, etc.)
- [ ] Añadir `aria-sort` a las cabeceras de columnas ordenables
- [ ] Resumen de filtros activos para lectores de pantalla

---

## 6. Código y mantenimiento

- [ ] Extender tipo `FacturaWithCliente` con `es_externa` y `archivo_url` para eliminar `(factura as any)`
- [ ] Extraer helper para aplicar filtros (evitar duplicación page + stats)

---

## 7. Tests E2E recomendados

Ejecutar tras implementar cambios para verificar que no se rompe nada:

```bash
npm run test:e2e -- e2e/facturas-filtros.spec.ts
npm run test:e2e -- e2e/facturas-series.spec.ts
npm run test:e2e -- e2e/facturas-selector-empresa.spec.ts
npm run test:e2e -- e2e/responsive.spec.ts
```

### 7.1 Tests existentes a mantener
- [ ] `facturas-filtros.spec.ts`: carga, chips estado, búsqueda, período, orden, limpiar
- [ ] `facturas-series.spec.ts`: crear factura, factura externa
- [ ] `facturas-selector-empresa.spec.ts`: facturas por empresa, detalle, PDF
- [ ] `responsive.spec.ts`: sin scroll horizontal en facturas

### 7.2 Tests nuevos a añadir
- [x] **Exportar Excel**: botón visible, clic descarga archivo .xlsx
- [x] **Exportar todas**: opción exporta todas las facturas filtradas (Excel y CSV)
- [x] **Ordenación por columna**: clic en cabecera "Número" ordena y actualiza URL
- [x] **Ordenación por columna**: clic en "Total" ordena ascendente/descendente
- [x] **Ordenación numérica**: columna `numero_orden` + trigger en BD para 0009 antes que 0010

---

## 8. Dependencias

Para exportación Excel se usa **exceljs** (ya instalado). Permite estilos, anchos de columna y formato numérico español.

---

## 9. Resumen de prioridades

| Prioridad | Tarea |
|-----------|-------|
| Alta | Ordenación por clic en columnas (incl. numérica para número) |
| Alta | Exportar a Excel con contenido completo |
| Alta | Exportar todas las facturas filtradas |
| Media | Filtros en Sheet para móvil |
| Media | Consolidar queries (rendimiento) |
| Media | Tests E2E para nuevas funcionalidades |
| Baja | Accesibilidad (aria-label, aria-sort) |
| Baja | Refactor tipos |
