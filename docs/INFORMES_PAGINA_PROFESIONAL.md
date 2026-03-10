# Página de Informes Profesional – STVLS ERP

Documento de investigación, buenas prácticas y checklist para llevar la página de Informes a nivel profesional (contenido, estructura, branding, filtros, gráficos, responsive y tests).

---

## 1. Investigación: contenido profesional de una página de informes

### 1.1 Principios de diseño (BI / dashboards 2024–2025)

- **Claridad sobre complejidad:** El usuario debe captar el insight principal en unos segundos.
- **Acción sobre información:** Los datos deben llevar a decisiones (no solo mostrar números).
- **Velocidad sobre exhaustividad:** Menos gráficos bien elegidos mejor que muchos.
- **Jerarquía visual (patrón F):**
  - **Arriba-izquierda:** KPI o indicador más crítico.
  - **Fila superior:** 3–5 KPIs principales con valor actual, período anterior y tendencia.
  - **Centro:** 2–3 gráficos de evolución temporal (línea/barra).
  - **Abajo:** Tablas detalle, rankings, desgloses (ordenables/filtrables).

### 1.2 Estructura recomendada: pestañas o secciones

- **Opción A – Pestañas (tabs):** Resumen | Ventas y evolución | Clientes y productos | Fiscal (IVA, conceptos). Máximo ~4–6 pestañas; menos de 8 visuales por vista (mejor adopción).
- **Opción B – Una sola página con secciones colapsables:** Cabecera con filtros globales; secciones “Resumen”, “Evolución”, “Rankings”, “Desglose IVA” con acordeón o scroll.
- **Recomendación para este proyecto:** Tabs (Resumen, Ventas, Clientes y productos, Fiscal) para no saturar una sola pantalla y alinear con buenas prácticas de BI.

### 1.3 Filtros

- **Obligatorios:** Rango de fechas (desde/hasta) aplicado a todos los informes.
- **Recomendables:** Presets (Este mes, Mes anterior, Este trimestre, Últimos 12 meses, Personalizado).
- **Implementados:** Filtro por **Empresa** (Todas o una concreta) y por **Cliente** (Todos o uno); aplicados en backend vía RPCs con `p_empresa_id` y `p_cliente_id`.
- Los filtros se aplican en backend; todos los tabs y la exportación Excel respetan empresa y cliente seleccionados.

### 1.4 Gráficos y visualización

- **Línea:** Evolución temporal (facturación, número de facturas); máximo 2–3 series por gráfico.
- **Barras:** Comparativas (top clientes, ranking conceptos); horizontal para muchos ítems.
- **Tarta/Donut:** Distribución (estados de facturas, categorías, IVA por tipo).
- **Big number cards:** KPIs con valor, variación % y tendencia (flecha arriba/abajo).
- Títulos que comuniquen insight cuando sea posible (ej. “Facturación creció 12% vs mes anterior”).
- Máximo 5 colores con significado; accesibilidad (rojo/verde + icono o texto).

### 1.5 Exportación y branding

- **Excel:** Múltiples hojas (KPIs, Evolución, Top clientes, Ranking conceptos, Desglose IVA) con formato claro.
- **PDF (opcional):** Resumen ejecutivo de 1–2 páginas con KPIs y un gráfico principal.
- **Branding:** Logo, nombre de la app (STVLS ERP), título del informe y rango de fechas en cabecera; pie con “Generado el [fecha]”.

---

## 2. Buenas prácticas para nuestro stack

### 2.1 Backend (Next.js App Router, Server Actions, Supabase)

- **Server Actions** para cada informe: ya existen `getKPIsAction`, `getEvolucionFacturacionAction`, `getEstadoFacturasAction`, `getTopClientesAction`, `getFacturacionPorCategoriaAction`, `getDesgloseIVAAction`, `getRankingConceptosAction`.
- **Un solo contexto de fechas y empresa:** Las acciones reciben `fechaDesde`, `fechaHasta` y opcionalmente `empresaId`; respetar `getUserContext()` para visión global vs una empresa.
- **Manejo de errores:** Devolver `{ success, data?, error? }`; en UI mostrar estado de carga y mensaje si falla.
- **RPCs Supabase:** Las funciones `get_evolucion_facturacion`, `get_estado_facturas`, `get_top_clientes`, `get_facturacion_por_categoria`, `get_desglose_iva`, `get_ranking_conceptos` ya están en migraciones; no duplicar lógica en el cliente.

### 2.2 Frontend (React 19, Next.js 16, Tailwind 4, Recharts)

- **Filtrar datos antes de pasarlos a Recharts:** Los gráficos reciben datos ya filtrados por fechas (y empresa si aplica).
- **ResponsiveContainer** con `width="100%"` y altura en rem o vh; contenedor con altura definida (`h-[300px]` o `min-h-[16rem]`).
- **Tooltips personalizados** para fechas y moneda (formato es-ES).
- **Estados de carga:** Skeleton o spinner por sección o por tab; no bloquear toda la página.
- **URL o estado:** Considerar query params (`?desde=&hasta=&tab=`) para compartir o refrescar sin perder filtros.

### 2.3 Diseño y responsive (Tailwind, patrón Informes)

- **Contenedores:** `w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Cabecera de página:** Título + descripción + filtros y botones en `flex-col sm:flex-row`, botones `w-full sm:w-auto` y `min-h-[44px]` en móvil.
- **Grid de gráficos:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-*` según sección; cards con `min-w-0` para evitar overflow.
- **Tabs:** Radix Tabs o componente tipo tabs; en móvil pueden ser scroll horizontal o acordeón según espacio.
- **Date range picker:** En móvil ancho completo o `max-w-[90vw]`; presets accesibles.

---

## 3. Análisis del proyecto actual

### 3.1 Qué hay hoy

| Elemento | Ubicación | Estado |
|-----------|-----------|--------|
| Página Informes | `app/(dashboard)/ventas/informes/page.tsx` | Una sola vista, sin tabs |
| Filtro fechas | `DatePickerWithRange` | Solo rango libre, sin presets |
| KPIs | `InformesKPIs` | 4 cards: Facturación, Facturas, Ticket medio, Días cobro |
| Gráficos | `InformesGraficos` | Evolución, Estados (pie), Top clientes (barra), Categorías (pie) |
| Export Excel | `exportarInformeExcelAction` | KPIs + Top clientes + Ranking conceptos (no mostrado en UI) |
| Backend | `actions/informes.ts` | getDesgloseIVAAction, getRankingConceptosAction existen pero no se usan en UI |

### 3.2 Informes realmente útiles que podemos ofrecer

1. **Resumen ejecutivo (tab Resumen):** Mismos 4 KPIs + variación vs período anterior; 1 gráfico de evolución breve; texto tipo “Facturación del período: X€ (+Y% vs anterior)”.
2. **Ventas y evolución (tab Ventas):** Evolución temporal (línea), estados de facturas (donut), opcional segunda serie (nº facturas).
3. **Clientes y productos (tab Clientes/Productos):** Top clientes (barra horizontal), ventas por categoría (pie), ranking de conceptos (tabla o barra) usando `getRankingConceptosAction`.
4. **Fiscal (tab Fiscal):** Desglose IVA por tipo (tabla + pie o barra) usando `getDesgloseIVAAction`.
5. **Exportación:** Excel con todas las hojas (KPIs, Evolución, Top clientes, Ranking conceptos, Desglose IVA); cabecera con logo y rango de fechas.

### 3.3 Datos ya disponibles en backend

- KPIs (facturación, num_facturas, ticket_medio, dias_cobro) con variación.
- Evolución mensual (periodo, facturacion, num_facturas).
- Estado facturas (estado, cantidad, porcentaje).
- Top clientes (cliente_nombre, facturacion, num_facturas).
- Facturación por categoría (categoria, facturacion, cantidad).
- **Desglose IVA** (tipo_iva, base_imponible, cuota_iva, total, porcentaje_del_total).
- **Ranking conceptos** (concepto_nombre, categoria, cantidad_vendida, ingresos, porcentaje).

---

## 4. Checklist de ejecución

Usar este checklist y ir tachando al completar cada ítem. Aplicar **responsive** solo a esta página según patrones de `docs/RESPONSIVE_MEJORAS_PLAN.md` (contenedores, cabecera, grids, touch targets).

### 4.1 Estructura y navegación

- [x] Añadir **tabs** en la página de Informes: Resumen | Ventas | Clientes y productos | Fiscal.
- [x] Mantener **un solo filtro de rango de fechas** global arriba (visible en todas las pestañas).
- [x] Añadir **presets de fechas** (Este mes, Mes anterior, Este trimestre, Últimos 12 meses) junto al date range picker.
- [ ] (Opcional) Reflejar tab activa en query param `?tab=` para deep link.

### 4.2 Cabecera y branding

- [ ] Título de página: “Informes” o “Informes y analítica” con descripción breve.
- [ ] Botones de acción en la cabecera: **Exportar Excel** y (opcional) **Exportar PDF**; en móvil apilados o en fila con wrap.
- [ ] En el Excel exportado: cabecera con “STVLS ERP – Informe de ventas” y rango de fechas; pie “Generado el [fecha]”.

### 4.3 Tab Resumen

- [ ] Mostrar los 4 KPIs actuales (Facturación, Facturas emitidas, Ticket medio, Días cobro) con variación % y flecha.
- [ ] Un gráfico de evolución (línea) resumido o sparkline.
- [ ] Texto de insight opcional (ej. “Facturación del período: X€”).

### 4.4 Tab Ventas

- [ ] Gráfico de **evolución de facturación** (línea) con ResponsiveContainer y altura responsive.
- [ ] Gráfico de **estado de facturas** (donut/pie) con leyenda y colores accesibles.
- [ ] Tooltips con formato moneda y fecha en español.

### 4.5 Tab Clientes y productos

- [ ] **Top clientes** (barra horizontal) ya existe; asegurar que use `getTopClientesAction` con límite configurable (ej. 10).
- [ ] **Ventas por categoría** (pie) ya existe.
- [ ] **Ranking de conceptos:** nueva card/tabla o gráfico usando `getRankingConceptosAction` (top 10 conceptos por ingresos).

### 4.6 Tab Fiscal

- [ ] Llamar a `getDesgloseIVAAction(fechaDesde, fechaHasta)`.
- [ ] Mostrar **tabla** con columnas: Tipo IVA %, Base, Cuota, Total, % del total.
- [ ] Opcional: gráfico de barras o pie con desglose por tipo de IVA.

### 4.7 Exportación

- [ ] Botón “Exportar Excel” que llame a `exportarInformeExcelAction`; incluir en el Excel hoja de **Desglose IVA** si no está.
- [ ] Mensajes de éxito/error con toast; botón deshabilitado mientras exporta.
- [ ] Nombre de archivo: `informe_ventas_YYYY-MM-DD_YYYY-MM-DD.xlsx`.

### 4.8 Responsive (solo esta página)

- [ ] Contenedor principal con `px-4 sm:px-6 lg:px-8` y `max-w-7xl mx-auto`.
- [ ] Cabecera: título + filtros + botones en `flex-col sm:flex-row`; botones con `min-h-[44px]` y `w-full sm:w-auto` en móvil.
- [ ] Tabs: en móvil scroll horizontal o estilo full-width; touch-friendly.
- [ ] Grid de gráficos: `grid-cols-1 md:grid-cols-2 lg:grid-cols-*`; cards con `min-w-0` y altura de gráficos en rem/vh.
- [ ] Date picker y popovers con `max-w-[90vw]` en móvil.
- [ ] Sin scroll horizontal en viewports 320px–1920px.

### 4.9 Tests

- [ ] **Backend:** Test unitario o de integración que verifique que cada action (getKPIs, getEvolucion, getEstado, getTopClientes, getFacturacionPorCategoria, getDesgloseIVA, getRankingConceptos) devuelve `success: true` y estructura esperada con fechas válidas (o mock).
- [ ] **Frontend:** Test de componente o E2E que abra `/ventas/informes`, seleccione rango de fechas y compruebe que se muestran KPIs y al menos un gráfico (sin error).
- [ ] **Diseño/UX:** Revisión manual en viewport móvil y desktop; comprobar que tabs, filtros y export son usables.
- [x] **Responsive E2E:** Incluir en `e2e/responsive.spec.ts` que en viewport móvil la página Informes no tenga scroll horizontal.

### 4.10 Limpieza y documentación

- [x] Componentes separados por tab; página sin duplicar lógica.
- [x] Actualizar este MD tachando ítems completados del checklist.
- [ ] (Opcional) Añadir tooltips de “qué significa” en KPIs de la página Informes (igual que en dashboard y facturas).

---

## 5. Orden sugerido de implementación

1. Estructura: tabs + presets de fechas + misma cabecera.
2. Tab Resumen (KPIs + un gráfico).
3. Tab Ventas (evolución + estados).
4. Tab Clientes y productos (top clientes + categorías + ranking conceptos).
5. Tab Fiscal (desglose IVA).
6. Export Excel (completar con Desglose IVA si falta).
7. Ajustes responsive y toques de branding.
8. Tests backend, frontend y responsive.
9. Revisión final y tachado del checklist.

---

## 6. Referencias

- Dashboard Design Best Practices 2024–2025 (claridad, jerarquía F, &lt;8 visuales).
- Next.js + Recharts: filtrar datos antes de pasarlos al gráfico; ResponsiveContainer; tooltips personalizados.
- Responsive: `docs/RESPONSIVE_MEJORAS_PLAN.md` y skill `responsive-plan-executor` aplicado solo a esta página.
- Stack: Next.js 16, React 19, Tailwind 4, Radix UI, Recharts, Server Actions, Supabase RPC.
