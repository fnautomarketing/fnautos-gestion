# Plan de Mejoras – Página de Clientes STVLS ERP

Documento de análisis detallado, propuestas de mejora y checklist para elevar la página de clientes al nivel profesional de facturas y dashboard. Incluye comparación con benchmarks y tests que un programador senior ejecutaría.

---

## 1. Análisis del estado actual

### 1.1 Estructura y componentes

| Componente | Ubicación | Estado actual |
|------------|-----------|---------------|
| Página principal | `src/app/(dashboard)/ventas/clientes/page.tsx` | Server component, carga clientes por empresa |
| Stats | `src/components/clientes/clientes-stats.tsx` | 4 cards: Total, Activos, Inactivos, Facturación |
| Tabla | `src/components/clientes/clientes-tabla.tsx` | Búsqueda client-side, tabla desktop + cards móvil |
| Nuevo / Editar | `clientes/nuevo/`, `[id]/editar/` | Formularios con cliente-form |

### 1.2 Diseño actual – puntos fuertes

- ✅ Stats con hover `translate-y-[-2px]`
- ✅ Vista dual: tabla en desktop, cards en móvil
- ✅ Búsqueda por nombre, CIF, email (client-side)
- ✅ Avatar con iniciales y gradiente
- ✅ Dark mode soportado

### 1.3 Oportunidades de mejora detectadas

| Área | Problema actual | Impacto |
|------|-----------------|---------|
| **Breadcrumb** | "Ventas" sin enlace; falta `data-testid` | Navegación inconsistente con facturas |
| **Stats** | Hover básico; sin entrada escalonada; sin data-testid | Sensación genérica |
| **Búsqueda** | Solo client-side; no persiste en URL | No compartible, no bookmarkeable |
| **Filtros** | No hay filtro por estado (activos/inactivos) en UI | Menos control que facturas |
| **Ordenación** | Sin ordenación por columnas | UX inferior a facturas |
| **Exportación** | No hay export CSV/Excel | Limitación para informes |
| **Empty state** | Texto plano "No se encontraron clientes" | Oportunidad de CTA |
| **Touch targets** | Botones 8x8 en móvil | < 44px recomendado |
| **Accesibilidad** | Falta aria-label en iconos | WCAG incompleto |

---

## 2. Benchmarks (alineados con facturas y dashboard)

| Criterio | Facturas | Dashboard | Propuesta Clientes |
|----------|----------|-----------|---------------------|
| Breadcrumb con link | ✅ | ✅ | Ventas → Clientes, data-testid |
| Stats con hover/animación | — | ✅ | Entrada escalonada, ring en hover |
| Filtros en URL | ✅ | — | search, estado (todos/activos/inactivos) |
| Ordenación por columnas | ✅ | — | Nombre, CIF, Facturación, Estado |
| Export CSV/Excel | ✅ | — | Exportar lista de clientes |
| Empty state con CTA | ✅ | ✅ | "Crear cliente" |
| Touch targets 44px | ✅ | ✅ | Botones, links |
| data-testid | ✅ | ✅ | Para E2E |

---

## 3. Propuesta de mejoras – Checklist

### 3.1 Diseño y navegación

- [x] **Breadcrumb**: Enlace "Ventas" a `/ventas`; `data-testid="clientes-breadcrumb"`.
- [x] **Botón Nuevo Cliente**: `min-h-[44px]`, `w-full sm:w-auto`, `hover:shadow-lg`.

### 3.2 Stats (ClientesStats)

- [x] **Hover**: `hover:-translate-y-0.5`, `hover:ring-2 hover:ring-primary/20`, `transition-all duration-200`.
- [x] **Entrada escalonada**: `animate-in fade-in slide-in-from-bottom-2` con delay incremental.
- [x] **data-testid**: `clientes-stat-total`, `clientes-stat-activos`, `clientes-stat-inactivos`, `clientes-stat-facturacion`.
- [x] **Responsive**: `p-4 sm:p-6`, `text-xl sm:text-2xl`.

### 3.3 Búsqueda y filtros

- [x] **Búsqueda en URL**: Parámetro `search` en URL; sincronizar con input (debounce 350ms).
- [x] **Filtro estado**: Pills "Todos | Activos | Inactivos" con `estado` en URL.
- [x] **Limpiar búsqueda**: Botón X en input cuando hay texto.

### 3.4 Tabla – ordenación por columnas

- [x] **Cabeceras clicables**: Cliente, CIF, Facturación, Estado.
- [x] **Indicador ↑/↓** en columna activa.
- [x] **Parámetro URL**: `orden=nombre_asc|nombre_desc|cif_asc|cif_desc|facturacion_asc|facturacion_desc|estado_asc|estado_desc`.

### 3.5 Exportación

- [x] **Botón Exportar**: Menú con "Exportar CSV (página)", "Exportar todos (CSV)", "Exportar todos (Excel)".
- [x] **API** `/api/ventas/clientes/export?format=csv|xlsx&search=&estado=&orden=`.
- [x] **Columnas**: Nombre, CIF, Email, Teléfono, Ciudad, Facturación, Estado.

### 3.6 Empty state

- [x] **Sin resultados**: Mensaje + CTA "Crear cliente" (desktop y móvil).

### 3.7 Responsive (inteligente)

- [x] **Touch targets**: Botones menú y acciones `min-h-[44px]` en móvil.
- [x] **Input búsqueda**: `min-h-[44px]` en móvil.
- [x] **Contacto**: Columna oculta en tabla pequeña (`hidden lg:table-cell`).

### 3.8 Accesibilidad

- [x] **aria-label** en botones de icono (MoreVertical, búsqueda).
- [x] **role="searchbox"** en input búsqueda.

### 3.9 Reducir motion

- [x] **motion-reduce** en animaciones de stats.

---

## 4. Tests que un programador senior implementaría

### 4.1 Tests E2E existentes a mantener

| Test | Archivo | Descripción |
|------|---------|-------------|
| clientes-empresas-facturas | `e2e/clientes-empresas-facturas.spec.ts` | Crear cliente, navegar, facturas |

### 4.2 Tests E2E nuevos

| Test | Descripción | data-testid |
|------|-------------|-------------|
| Breadcrumb visible | Ventas › Clientes | `clientes-breadcrumb` |
| Stats visibles | 4 cards con valores | `clientes-stat-total`, etc. |
| Búsqueda actualiza URL | Escribir y ver `?search=` | — |
| Filtro estado actualiza URL | Clic Activos → `?estado=activos` | — |
| Ordenación por columna | Clic cabecera → URL con `orden=` | — |
| Export CSV descarga archivo | Clic Exportar → CSV | — |
| Empty state con CTA | Sin clientes → "Crear cliente" | — |
| Nuevo Cliente navega | Clic botón → `/ventas/clientes/nuevo` | — |

### 4.3 data-testid recomendados

| Elemento | data-testid |
|----------|-------------|
| Breadcrumb | `clientes-breadcrumb` |
| Stats Total | `clientes-stat-total` |
| Stats Activos | `clientes-stat-activos` |
| Stats Inactivos | `clientes-stat-inactivos` |
| Stats Facturación | `clientes-stat-facturacion` |
| Input búsqueda | `clientes-search` |
| Tabla / lista | `clientes-tabla` o `clientes-list` |
| Fila cliente | `cliente-row` (ya existe `data-client-id`) |

---

## 5. Orden de implementación

1. **Fase 1**: Breadcrumb, stats (hover, animaciones, data-testid), botón Nuevo Cliente.
2. **Fase 2**: Búsqueda y filtros en URL; ordenación por columnas.
3. **Fase 3**: Exportación CSV/Excel (API + botón).
4. **Fase 4**: Empty states, touch targets, accesibilidad.
5. **Fase 5**: Tests E2E.

---

## 6. Resumen ejecutivo

| Prioridad | Tarea | Esfuerzo |
|-----------|-------|----------|
| Alta | Breadcrumb + data-testid | Bajo |
| Alta | Stats: hover, animaciones, data-testid | Bajo |
| Alta | Búsqueda y filtros en URL | Medio |
| Alta | Ordenación por columnas | Medio |
| Media | Exportación CSV/Excel | Medio |
| Media | Empty state con CTA | Bajo |
| Baja | Touch targets, aria-label | Bajo |
