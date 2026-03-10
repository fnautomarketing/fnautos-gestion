# Plan de mejoras responsive – STVLS ERP

Documento detallado para hacer el proyecto **totalmente responsive** en cualquier dispositivo (móvil, tablet, desktop) y cualquier marca. Incluye análisis del estado actual, buenas prácticas del stack (Next.js 16 + Tailwind CSS 4 + Radix UI) y tareas concretas por página/componente.

---

## 1. Stack y referencias

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 16.x | App Router, layouts, RSC |
| React | 19.x | Componentes |
| Tailwind CSS | 4.x | Estilos, breakpoints, utilidades |
| Radix UI | 1.x | Sheet, Dialog, Select, etc. |
| Recharts | 3.x | Gráficos (ResponsiveContainer) |

### Breakpoints Tailwind (mobile-first)

- **sm:** 640px  
- **md:** 768px  
- **lg:** 1024px  
- **xl:** 1280px  
- **2xl:** 1536px  

Regla: estilos base = móvil; prefijos `sm:`, `md:`, `lg:` para pantallas mayores.

### Buenas prácticas aplicables

1. **Mobile-first:** Empezar con layout y tipografía para móvil y añadir `md:` / `lg:` para escalar.
2. **Unidades relativas:** Preferir `rem`, `%`, `vw` y evitar anchos fijos en px cuando rompan en pantallas pequeñas.
3. **Touch targets:** Mínimo 44×44px para botones y enlaces en móvil (accesibilidad).
4. **Tablas:** En móvil, opciones: scroll horizontal con indicador, cards por fila, o columnas prioritarias con `hidden md:table-cell`.
5. **Contenedores:** `max-w-7xl mx-auto` está bien; asegurar `px-4 sm:px-6 lg:px-8` para márgenes laterales.
6. **Recharts:** Siempre usar `ResponsiveContainer` con `width="100%"` y altura en rem/vh o fija razonable.
7. **Sheet/Dialog:** En móvil, Sheet a ancho completo o casi (`w-full` o `max-w-[100vw]`); en desktop limitar con `sm:max-w-sm` / `md:max-w-md`.

---

## 2. Herramientas de testing responsive (gratuitas)

| Herramienta | Tipo | Uso recomendado |
|-------------|------|------------------|
| **Responsively App** | Desktop (open source) | Múltiples viewports a la vez, interacción sincronizada. |
| **Chrome DevTools** | Navegador | Device toolbar, throttling, tamaños custom. |
| **Playwright** | E2E (ya en proyecto) | Tests con `devices['iPhone 12']`, `devices['Pixel 5']`, viewport custom. |
| **BrowserStack Website Scanner** | Online | Escaneo multi-viewport (cuota gratuita limitada). |
| **Responsive Viewer (Chrome)** | Extensión | Varios dispositivos en una sola vista. |

Recomendación: usar **Playwright con varios viewports** en CI/local y **Responsively App** o **Chrome DevTools** para desarrollo visual.

---

## 3. Inventario de páginas y componentes

### 3.1 Auth

| Ruta | Archivo | Observaciones |
|------|---------|---------------|
| `/login` | `(auth)/login/page.tsx` + `login-form.tsx` | Columna izquierda oculta en móvil (`hidden lg:flex`). Formulario en columna derecha; revisar padding y ancho máximo. |

**Tareas login:**

- [x] **Login page:** En móvil, asegurar `p-4 sm:p-6` en la sección del form; `max-w-[440px]` con `px-2 sm:px-4`.
- [x] **Login form (Card):** Botón "Acceder" con `min-h-[44px]`; Card con `w-full min-w-0 max-w-full` para evitar overflow.
- [x] **Auth layout:** `min-h-screen`; body con `overflow-x-hidden` en globals.

### 3.2 Dashboard (layout y shell)

| Componente | Archivo | Observaciones |
|------------|---------|---------------|
| Layout dashboard | `(dashboard)/layout.tsx` | Sidebar `hidden lg:flex`; contenido `lg:pl-64`. Main con `p-4 md:p-8 lg:p-10`, `max-w-7xl`, `pb-32`. |
| Sidebar | `dashboard/sidebar.tsx` | Fijo 264px; solo visible en lg+. En móvil se usa Sheet. |
| Navbar | `dashboard/navbar.tsx` | Búsqueda `hidden md:block`. Botón menú `lg:hidden`. Sheet para menú móvil. |
| Sheet (menú móvil) | `ui/sheet.tsx` | `w-3/4 sm:max-w-sm` para side left/right. En móvil 75% puede ser poco en algunos dispositivos → considerar `w-[85vw] max-w-sm` para mejor uso. |

**Tareas layout:**

- [x] **Layout:** Main con `px-4 sm:px-6 lg:px-8`, `pb-24 md:pb-32`.
- [x] **Navbar:** `gap-2 sm:gap-4`, altura `h-16 sm:h-20`, Sheet con `w-[85vw] max-w-[400px] sm:w-72`.
- [x] **Sheet Content:** Left/right con `w-[85vw] max-w-[400px] sm:max-w-sm` en `ui/sheet.tsx`.
- [x] **Sidebar (desktop):** Ya tiene `overflow-y-auto`.

### 3.3 Dashboard (página principal)

| Bloque | Archivo | Observaciones |
|--------|---------|---------------|
| Cabecera | `dashboard/page.tsx` | Título, breadcrumb, selectores de periodo/vista, botón "Nueva Factura". |
| KPI cards | `dashboard-kpi-cards.tsx` | Grid `gap-4 sm:grid-cols-2 lg:grid-cols-4`. |
| Gráficos | `dashboard-charts.tsx` | Grid `lg:grid-cols-3`, card principal `lg:col-span-2`. Recharts con ResponsiveContainer. |
| Estados del período / Alertas | `dashboard/page.tsx` | Grid `gap-6 lg:grid-cols-3`; alertas `lg:col-span-2`. |
| Desglose empresas | `dashboard/page.tsx` | Grid `sm:grid-cols-2 lg:grid-cols-3`. |
| Facturas recientes | `dashboard/page.tsx` | Lista vertical; enlaces y badges. |

**Tareas dashboard:**

- [x] **Cabecera:** `flex-col sm:flex-row`, botón "Nueva Factura" `w-full sm:w-auto min-h-[44px]`.
- [x] **KPI cards:** `p-4 sm:p-5 min-w-0`, valor con `break-all` y `text-xl sm:text-2xl`.
- [x] **Gráficos:** ResponsiveContainer ya usado; altura fija mantenida.
- [x] **Cards estados/alertas:** Alertas con `flex-wrap` y `min-w-0` en filas.
- [x] **Facturas recientes:** Filas con `flex-wrap`, `min-w-0`, fecha `hidden sm:inline`.

### 3.4 Ventas – Facturas

| Ruta / componente | Archivo | Observaciones |
|-------------------|---------|---------------|
| Listado facturas | `ventas/facturas/page.tsx` | Filtros + tabla. |
| Filtros | `ventas/facturas-filters.tsx` | Muchos controles; en móvil deben colapsar o ir en Sheet/Drawer. |
| Tabla facturas | `ventas/facturas-table.tsx` | Table con overflow-x-auto; celdas con whitespace-nowrap. |
| Nueva factura | `ventas/facturas/nueva/page.tsx` + `nueva-factura-form.tsx` | Formulario largo. |
| Detalle factura | `ventas/facturas/[id]/page.tsx` | Cabecera, acciones, secciones. |
| Editar factura | `ventas/facturas/[id]/editar/page.tsx` | Form + tabla de líneas. |
| PDF | `ventas/facturas/[id]/pdf/page.tsx` | Grid `lg:grid-cols-12` (8+4); preview + panel opciones. |
| Email | `ventas/facturas/[id]/email/page.tsx` | Formulario envío. |

**Tareas facturas:**

- [ ] **Filtros:** En móvil mostrar botón "Filtros" que abra Sheet con todos los filtros apilados; en desktop mantener fila horizontal. Asegurar que Popover/PopoverContent tengan `max-w-[90vw]` en móvil.
- [ ] **FacturasTable:** Mantener `overflow-x-auto`; añadir `-webkit-overflow-scrolling: touch` en globals si hace falta. Considerar en móvil ocultar columnas menos importantes (`hidden md:table-cell`) y mostrar datos clave (número, cliente, total, estado).
- [ ] **Nueva/Editar factura:** Form en una columna; en móvil `max-w-md` o `max-w-full` y padding `px-4`. Tabla de líneas con scroll horizontal y celdas con `min-w-[...]` razonables.
- [ ] **Detalle factura:** Cabecera con título y acciones en columna en móvil; botones `flex-wrap gap-2`.
- [ ] **Página PDF:** En móvil grid 1 columna; preview arriba, opciones abajo. Panel opciones sticky solo en lg (`lg:sticky lg:top-6`). Botones de descarga apilados en móvil.
- [ ] **Email:** Mismo criterio que otros formularios: ancho completo y touch targets ≥ 44px.

### 3.5 Ventas – Clientes

| Ruta / componente | Archivo | Observaciones |
|-------------------|---------|---------------|
| Listado | `ventas/clientes/page.tsx` | Stats + tabla. |
| Tabla clientes | `clientes/clientes-tabla.tsx` | Similar a facturas. |
| Nuevo / Editar | `clientes/nuevo/page.tsx`, `[id]/editar/page.tsx`, `cliente-form.tsx` | Formularios. |

**Tareas clientes:**

- [ ] Tabla: misma estrategia que facturas (scroll horizontal + ocultar columnas en móvil si se define cuáles).
- [ ] Formularios: `max-w-5xl` o similar con `w-full px-4` en móvil; grupos de campos en columna.

### 3.6 Ventas – Pagos, Informes, Facturas vencidas

| Ruta | Archivo | Observaciones |
|------|---------|---------------|
| Pagos | `ventas/pagos/page.tsx`, `pagos-tabla.tsx`, `registrar/page.tsx` | Tablas y formularios. |
| Informes | `ventas/informes/page.tsx`, `informes-graficos.tsx`, `informes-kpis.tsx` | KPIs + gráficos. |
| Facturas vencidas | `ventas/facturas-vencidas/page.tsx`, `vencidas-tabla.tsx` | Tabla. |

**Tareas:**

- [ ] Pagos: misma línea que facturas (tabla responsive, form ancho controlado).
- [ ] Informes: grid de gráficos `md:grid-cols-2 lg:grid-cols-7` ya existe; en móvil 1 columna; alturas de gráficos en rem (ej. `h-[18rem]`) para que escalen.
- [ ] Vencidas: tabla como en facturas.

### 3.7 Configuración

| Ruta | Archivo | Observaciones |
|------|---------|---------------|
| Empresas (admin) | `configuracion/empresas/page.tsx`, `gestion-empresas-client.tsx` | Tabla + modales. |
| Empresa (ventas) | `ventas/configuracion/empresa/page.tsx` | Formulario empresa. |
| Series | `ventas/configuracion/series/page.tsx`, `series-grid.tsx` | Grid de series. |
| Conceptos | `ventas/configuracion/conceptos/page.tsx`, `conceptos-tabla.tsx` | Tabla + importar. |
| Plantillas | `ventas/configuracion/plantillas/page.tsx`, `plantillas-grid.tsx` | Grid. |
| Usuarios | `ventas/configuracion/usuarios/page.tsx` | Contenido. |
| Descarga PDF datos fiscales | `descargar-datos-fiscales-button.tsx` | Botón; ya usable en móvil. |

**Tareas configuración:**

- [ ] **GestionEmpresasClient:** Tabla con `overflow-x-auto`; modal `max-w-2xl w-full max-h-[90vh]` con `p-4 sm:p-6` y contenido con `overflow-y-auto`. En móvil modales a ancho completo o casi (`max-w-[95vw]`).
- [ ] **Empresa form:** Campos en columna; en desktop se puede usar grid de 2 columnas donde tenga sentido.
- [ ] **Series grid / Plantillas grid:** Cards en grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`; cada card con `min-w-0` y texto truncado donde corresponda.
- [ ] **Conceptos:** Tabla responsive como en facturas; página importar con `max-w-4xl` y `overflow-x-auto` en el bloque de preview.
- [ ] **Usuarios:** Contenido con padding y ancho máximo estándar.

### 3.8 Otras páginas

| Ruta | Observaciones |
|------|---------------|
| `/dashboard`, `/ventas`, `/tesoreria`, `/flota`, `/operaciones`, `/gastos`, `/informes`, `/asistente` | Páginas con título y descripción; asegurar `flex-col` en móvil y márgenes `px-4`. |

- [ ] Aplicar mismo patrón: título + descripción + contenido con `max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8`.

### 3.9 Componentes UI base

| Componente | Archivo | Tareas |
|------------|---------|--------|
| **Table** | `ui/table.tsx` | Ya tiene contenedor `overflow-x-auto`. Añadir clase para scroll suave en iOS si hace falta. |
| **Card** | `ui/card.tsx` | CardHeader con grid; asegurar que en móvil no fuerce ancho mínimo. |
| **Button** | `ui/button.tsx` | Variante icon con size; en móvil asegurar mínimo 44px cuando se use en barras de acción. |
| **Sheet** | `ui/sheet.tsx` | Revisar ancho left/right en móvil (ver 3.2). |
| **Dialog** | `ui/dialog.tsx` | Contenido con `max-w-[95vw] sm:max-w-lg` para no salirse en móvil. |
| **Input, Select, Textarea** | `ui/*` | Ya suelen ser `w-full`; en formularios contenedor con `min-w-0` para flex/grid. |
| **DropdownMenu** | `ui/dropdown-menu.tsx` | `min-w-[8rem]`; en pantallas pequeñas comprobar que no se salga del viewport (Radix suele posicionar bien). |

### 3.10 Gráficos (Recharts)

- [ ] Todos los gráficos deben usar `ResponsiveContainer width="100%" height="100%"` con un contenedor con altura definida (ej. `h-[300px]` o `min-h-[16rem]`).
- [ ] En móvil reducir márgenes del gráfico (`margin: { top, right, left, bottom }`) si hace falta para que no se corten etiquetas.
- [ ] Leyenda: en gráficos de tarta/barra, considerar leyenda debajo o colapsada en móvil.

### 3.11 Descarga PDF y vistas PDF

- [ ] Botones "Descargar PDF" / "Generar PDF": tamaño touch-friendly y que no se corten en una fila (wrap o apilar en móvil).
- [ ] Vista previa del PDF en página factura: contenedor con `overflow-auto` y si es iframe o canvas, que escale con `max-w-full` y altura controlada.

---

## 4. Resumen de patrones a aplicar

1. **Contenedores de página:** `w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (o equivalente).
2. **Cabeceras de página:** Título + acciones en `flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`; en móvil botones `w-full sm:w-auto`.
3. **Tablas:** Contenedor `overflow-x-auto`; en móvil ocultar columnas secundarias con `hidden md:table-cell` y/o reducir padding `px-2 md:px-4`.
4. **Formularios:** Contenedor `w-full max-w-* mx-auto px-4`; campos en columna; en desktop opcional grid 2 columnas.
5. **Cards y grids:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (o 4); cards con `min-w-0` y `overflow-hidden` donde haya texto largo.
6. **Modales/Sheet:** En móvil ancho `w-[95vw]` o `min(85vw, 400px)`; en desktop `sm:max-w-md` o `max-w-lg`.
7. **Botones de acción:** Altura mínima 44px en móvil cuando sean principales; agrupar en fila con `flex-wrap gap-2`.
8. **Tipografía:** Títulos `text-2xl sm:text-3xl lg:text-4xl`; cuerpo sin tamaños fijos que rompan en móvil.

---

## 5. Tests responsive con Playwright

- [x] Proyectos en `playwright.config.ts`: `desktop` (Desktop Chrome), `mobile` (iPhone 12), `tablet` (iPad Pro 11).
- [x] Tests en `e2e/responsive.spec.ts`: login, dashboard y facturas sin scroll horizontal.
- [ ] Opcional: test de screenshot por viewport para regresiones visuales.

---

## 6. Orden sugerido de implementación

1. **Global:** Revisar `globals.css` y layout raíz (márgenes, overflow-x hidden en body si procede).
2. **Layout dashboard:** Navbar + Sheet + main (padding y pb).
3. **Login:** Auth layout + login page + login form.
4. **Dashboard:** Cabecera, KPI cards, gráficos, cards de estados/alertas/facturas recientes.
5. **Facturas:** Filtros, tabla, nueva/editar, detalle, PDF, email.
6. **Clientes, Pagos, Vencidas:** Tablas y formularios con el mismo patrón.
7. **Informes:** Grid y gráficos.
8. **Configuración:** Empresas, series, conceptos, plantillas, usuarios.
9. **UI base:** Table, Card, Sheet, Dialog, botones en barras.
10. **Playwright:** Añadir proyectos y tests responsive.

Cuando tengas aprobación, se puede ejecutar este plan siguiendo el skill definido en el proyecto (ver `.cursor/skills/` o documentación interna).
