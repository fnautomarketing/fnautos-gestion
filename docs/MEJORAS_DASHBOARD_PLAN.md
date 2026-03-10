# Plan de Mejoras – Dashboard STVLS ERP

Documento de análisis detallado, propuestas de mejora y checklist para elevar el dashboard al nivel profesional de la página de facturas. Incluye comparación con benchmarks de la industria y tests que un programador senior ejecutaría para no romper nada.

---

## 1. Análisis del estado actual

### 1.1 Estructura y componentes

| Componente | Ubicación | Estado actual |
|------------|-----------|---------------|
| Página principal | `src/app/(dashboard)/dashboard/page.tsx` | Server component, carga KPIs, facturas, vencimientos |
| KPI Cards | `src/components/dashboard/dashboard-kpi-cards.tsx` | 4 tarjetas con sparklines, hover básico (`hover:shadow-lg`) |
| Gráficos | `src/components/dashboard/dashboard-charts.tsx` | Evolución + Pie, selector línea/barra/área |
| Selector período | `src/components/dashboard/dashboard-period-selector.tsx` | Popover con pills y rango custom |
| Selector vista | `src/components/dashboard/dashboard-vista-selector.tsx` | Semana/Mes, pills |
| Loading | `src/app/(dashboard)/dashboard/loading.tsx` | Skeleton básico |

### 1.2 Diseño actual – puntos fuertes

- ✅ Jerarquía clara: KPIs arriba, gráficos, luego listas
- ✅ Uso de colores semánticos (verde/rojo para tendencias)
- ✅ Sparklines en KPI cards
- ✅ Selector de período y vista funcional
- ✅ Dark mode soportado
- ✅ Layout responsive (grid sm:2 lg:4 para KPIs)

### 1.3 Oportunidades de mejora detectadas

| Área | Problema actual | Impacto |
|------|-----------------|---------|
| **Hover** | Solo `hover:shadow-lg` en KPI cards; links sin feedback visual rico | Bajo engagement, sensación genérica |
| **Animaciones** | Layout usa `animate-in fade-in slide-in-from-bottom-4` en main; cards sin entrada escalonada | Sensación estática |
| **Microinteracciones** | Iconos sin hover; botones sin scale/feedback; links sin transición suave | UX poco pulida |
| **Empty states** | "Sin facturas en este período" y "Sin vencimientos pendientes" son texto plano | Oportunidad de ilustración/CTA |
| **Loading** | Skeleton genérico; no refleja estructura real de KPIs/gráficos | Percepción de lentitud |
| **Accesibilidad** | Falta `aria-label` en iconos; gráficos sin `role="img"` y descripción | WCAG incompleto |
| **Consistencia visual** | Cards con bordes/sombras distintas; gradiente solo en KPI | Inconsistencia |
| **Jerarquía tipográfica** | Títulos de sección similares; falta contraste | Escaneo menos eficiente |

---

## 2. Benchmarks de la industria (investigación)

### 2.1 Refero Design – Dashboard UI Best Practices

- **Claridad y foco**: Máximo 3–4 métricas críticas; progressive disclosure (tooltips, paneles expandibles).
- **Jerarquía visual**: Patrón F; métricas clave arriba-izquierda; grid 12 columnas; whitespace generoso.
- **Consistencia y affordance**: Estilos uniformes; elementos interactivos con hover/animación que indiquen que son clicables.
- **Interactividad**: Hover-to-reveal, drill-down, tooltips; transiciones animadas al cambiar filtros.

### 2.2 5of10 – Dashboard Design Best Practices 2025

- **Test de 5 segundos**: El usuario debe captar insights clave en <5 s.
- **Acción sobre información**: Guiar a decisiones, no solo mostrar números.
- **Colores semánticos**: Verde positivo, rojo negativo, amarillo/naranja precaución; paleta daltónica.
- **Loading states**: Skeleton screens; datos obsoletos con "actualizando..."; cargar above-the-fold primero.
- **Empty states**: Ilustraciones, CTAs ("Ajustar filtros", "Importar datos").
- **Interactividad**: Date picker, zoom, click-to-filter, hover tooltips; evitar animaciones que retrasen la información.

### 2.3 Tendencias 2024 (Medium, Smashing Magazine)

- **Data storytelling**: Visualizaciones interactivas + narrativa; hover-to-reveal.
- **Minimalismo**: Menos ruido, más espacio en blanco.
- **Microinteracciones**: Hover, transiciones suaves, feedback inmediato.
- **Personalización**: Widgets configurables, filtros guardados.

### 2.4 Hover y microinteracciones (Cruip, DEV, Freefrontend)

- **Mouse-tracking gradients**: Gradientes radiales que siguen el cursor (`--x`, `--y`).
- **Glow effects**: Blur + radial gradient en posición del cursor.
- **Scale/translate**: `transform: scale(1.02)` o `translateY(-2px)` en hover.
- **Transiciones**: `transition-all duration-300` o `duration-200` para feedback rápido.

---

## 3. Propuesta de mejoras – Checklist

### 3.1 Diseño y jerarquía

- [x] **Breadcrumb**: Añadir `data-testid="dashboard-breadcrumb"` para tests.
- [ ] **Tipografía**: Diferenciar H1 (nombre empresa) vs títulos de sección (uppercase tracking-wider) con mayor contraste de tamaño/peso.
- [ ] **Grid consistente**: Usar `gap-6` uniforme; cards alineadas a columnas 12.
- [ ] **Badge "Datos"**: Mejorar contraste y legibilidad en dark mode.

### 3.2 KPI Cards – hover y animaciones

- [x] **Hover en cards**: `hover:-translate-y-0.5` + `hover:ring-2 hover:ring-primary/20` + `transition-all duration-200`.
- [x] **Borde/glow sutil**: En hover, `ring-2 ring-primary/20`.
- [x] **Icono animado**: Scale ligero `group-hover:scale-105` en icono de cada KPI.
- [x] **Entrada escalonada**: `animation-delay` incremental (0, 75, 150, 225ms) con `animate-in fade-in slide-in-from-bottom-2`.
- [x] **data-testid**: `dashboard-kpi-card-{facturacion,num-facturas,ticket-medio,dias-cobro}`.

### 3.3 Cards de contenido (Estados, Vencimientos, Facturas, Desglose)

- [x] **Hover en filas de lista**: `transition-colors duration-150`; `min-h-[44px]` en móvil para touch targets.
- [x] **Hover en cards de desglose empresa**: `hover:shadow-lg hover:border-primary/20`.
- [x] **Icono ExternalLink**: `group-hover:translate-x-0.5` en hover.
- [x] **Links "Ver todas"**: `hover:text-primary/80` + arrow con `group-hover:translate-x-0.5`.
- [x] **Empty state "Sin facturas"**: Icono FileText + mensaje + CTA "Crear factura".
- [x] **Empty state "Sin vencimientos"**: CheckCircle más prominente; layout responsive.

### 3.4 Gráficos

- [x] **Botones tipo gráfico**: `transition-all duration-200` + `ring-2 ring-primary/20` cuando activo; `active:scale-95`.
- [x] **aria-label** en botones tipo gráfico.
- [ ] **Transición al cambiar tipo**: Fade entre línea/barra/área (Recharts).

### 3.5 Selectores (Período, Vista)

- [x] **Pills**: `transition-colors duration-200`; `active:scale-[0.98]` para feedback táctil.
- [x] **Touch targets**: `min-h-[44px]` en móvil para pills y botones.
- [x] **Botón Nueva Factura**: `hover:shadow-lg transition-shadow duration-200`.

### 3.6 Loading y empty states

- [x] **Loading skeleton**: Estructura real (4 KPI cards, 2 gráficos, grid Estados+Vencimientos).

### 3.7 Accesibilidad

- [x] **aria-label** en botones de icono (Info, tipo gráfico).
- [x] **Focus visible**: `focus-visible:ring-2` en KpiInfoButton.
- [x] **aria-hidden** en iconos decorativos.

### 3.8 Responsive (inteligente)

- [x] **Touch targets**: Mínimo 44px en botones/links móvil (`min-h-[44px]`, `min-w-[44px]`).
- [x] **KPI cards**: `p-4 sm:p-5`, `text-xl sm:text-2xl`; grid `sm:grid-cols-2 lg:grid-cols-4`.
- [x] **Filas de lista**: `p-2 sm:p-3`; `gap-2 sm:gap-3`.
- [x] **Empty vencimientos**: `flex-col sm:flex-row` para icono + texto.

### 3.9 Performance

- [x] **Reducir motion**: `motion-reduce:animate-none`, `motion-reduce:transition-none`, `motion-reduce:hover:translate-y-0`.

---

## 4. Comparación: propuesta vs benchmarks

| Criterio | Benchmark (Refero, 5of10) | Propuesta STVLS | Alineación |
|----------|----------------------------|-----------------|------------|
| Claridad en 5 s | ✅ | KPIs arriba, métricas claras | ✅ |
| Hover en elementos interactivos | ✅ | Cards, links, botones | ✅ |
| Animaciones suaves | ✅ | Entrada escalonada, transiciones | ✅ |
| Empty states con CTA | ✅ | Ilustración + acción | ✅ |
| Loading skeleton realista | ✅ | Estructura real | ✅ |
| Colores semánticos | ✅ | Ya en uso | ✅ |
| Grid consistente | ✅ | 12 columnas, gap uniforme | ✅ |
| Accesibilidad WCAG | ✅ | aria-label, focus, reduced-motion | ✅ |
| Mouse-tracking / glow | Opcional (avanzado) | No incluido (evitar complejidad) | ⚪ |

---

## 5. Tests que un programador senior implementaría

### 5.1 Tests E2E existentes a mantener

| Test | Archivo | Descripción |
|------|---------|-------------|
| `dashboardCargaCorrectamente` | `e2e/dashboard.spec.ts` | KPIs, selector período, botón Nueva Factura |
| `selectorVistaVisible` | `e2e/dashboard.spec.ts` | Semana/Mes |
| `selectorTipoGraficoVisible` | `e2e/dashboard.spec.ts` | Línea/Barra/Área |
| Períodos (actual, anterior, trimestre, ytd, ultimo_anio, custom) | `e2e/dashboard.spec.ts` | URL params |
| Visión global | `e2e/dashboard.spec.ts` | Desglose por empresa |
| Por empresa (Yenifer, Edison, Villegas) | `e2e/dashboard.spec.ts` | Cambio de empresa |

### 5.2 Tests E2E nuevos a añadir (tras mejoras)

| Test | Descripción | data-testid / selector |
|------|-------------|------------------------|
| **KPI cards visibles y con estructura** | Las 4 cards de KPI tienen icono, valor, trend badge | `dashboard-kpi-card` (añadir si no existe) |
| **Hover en KPI card no rompe layout** | Hover no causa overflow ni layout shift | `.hover\\:scale-\\[1\\.02\\]` o clase equivalente |
| **Links de facturas son clicables** | Clic en fila de factura reciente navega a detalle | `href="/ventas/facturas/[id]"` |
| **Links de vencimientos son clicables** | Clic en vencimiento navega a factura | Mismo patrón |
| **Empty state "Sin facturas" visible** | Con período sin datos, mensaje correcto | `getByText('Sin facturas en este período')` |
| **Empty state "Sin vencimientos" visible** | Mensaje positivo cuando no hay vencimientos | `getByText('Sin vencimientos pendientes')` |
| **Breadcrumb visible** | Dashboard › Inicio | `dashboard-breadcrumb` |
| **Badge Datos visible** | Muestra rango de fechas | `dashboard-datos-periodo` |
| **Reduced motion** | Con `prefers-reduced-motion: reduce`, no hay animaciones excesivas | Media query (opcional, difícil en E2E) |

### 5.3 Tests unitarios (opcional, Vitest)

| Test | Componente | Descripción |
|------|------------|-------------|
| `DashboardKpiCards` | dashboard-kpi-cards | Renderiza 4 items con valores correctos |
| `DashboardKpiCards` | dashboard-kpi-cards | Trend badge verde cuando `trendUp`, rojo cuando no |
| `DashboardPeriodSelector` | dashboard-period-selector | Muestra label correcto para cada período |
| `DashboardVistaSelector` | dashboard-vista-selector | Botón activo según `vista` prop |

### 5.4 Checklist de regresión (manual o E2E)

- [ ] **Carga inicial**: Dashboard carga en <3 s (o tiempo aceptable).
- [ ] **Cambio de período**: Mes actual → Mes anterior actualiza KPIs y URL.
- [ ] **Cambio de vista**: Semana → Mes actualiza KPIs y sparklines.
- [ ] **Cambio de tipo gráfico**: Línea → Barra → Área sin error.
- [ ] **Navegación**: Clic en "Nueva Factura" va a `/ventas/facturas/nueva`.
- [ ] **Navegación**: Clic en factura reciente va a detalle.
- [ ] **Navegación**: Clic en vencimiento va a factura.
- [ ] **Visión global**: Con empresa "Todas", aparece desglose por empresa.
- [ ] **Empresa específica**: Con Yenifer/Edison/Villegas, datos filtrados.
- [ ] **Dark mode**: Sin contrastes rotos; textos legibles.
- [ ] **Responsive**: Móvil (375px), tablet (768px), desktop (1280px) sin overflow horizontal.

### 5.5 data-testid recomendados (para no romper tests)

| Elemento | data-testid actual | Añadir si no existe |
|----------|--------------------|----------------------|
| Badge período | `dashboard-datos-periodo` | ✅ Ya existe |
| Botón período | `dashboard-period-btn` | ✅ Ya existe |
| Vista Semana | `dashboard-vista-semana` | ✅ Ya existe |
| Vista Mes | `dashboard-vista-mes` | ✅ Ya existe |
| Tipo gráfico | `dashboard-chart-type-{line,bar,area}` | ✅ Ya existe |
| KPI cards | — | `dashboard-kpi-card-{0,1,2,3}` o `dashboard-kpi-facturacion` |
| Breadcrumb | — | `dashboard-breadcrumb` |
| Card Estados | — | `dashboard-card-estados` |
| Card Vencimientos | — | `dashboard-card-vencimientos` |
| Card Facturas | — | `dashboard-card-facturas` |

---

## 6. Orden de implementación sugerido

1. **Fase 1 – Sin riesgo**: Animaciones CSS (hover, transiciones), data-testid, accesibilidad.
2. **Fase 2 – Visual**: Entrada escalonada en KPI cards, mejoras en empty states.
3. **Fase 3 – Loading**: Skeleton ajustado a estructura real.
4. **Fase 4 – Tests**: Añadir tests E2E nuevos; ejecutar regresión completa.

---

## 7. Resumen ejecutivo

| Prioridad | Tarea | Esfuerzo |
|-----------|-------|----------|
| Alta | Hover y transiciones en KPI cards | Bajo |
| Alta | data-testid para no romper E2E | Bajo |
| Alta | Entrada escalonada en cards | Bajo |
| Media | Empty states con ilustración/CTA | Medio |
| Media | Loading skeleton realista | Medio |
| Media | Accesibilidad (aria-label, focus) | Bajo |
| Baja | Reduced motion | Bajo |
| Baja | Tests E2E adicionales | Medio |

---

## 8. Referencias

- [Refero – Dashboard UI Best Practices](https://refero.design/p/dashboard-ui-best-practices/)
- [5of10 – Dashboard Design Best Practices 2025](https://5of10.com/articles/dashboard-design-best-practices)
- [Smashing Magazine – UX Strategies For Real-Time Dashboards](https://www.smashingmagazine.com/2025/09/ux-strategies-real-time-dashboards/)
- [Cruip – Card Hover Animations with Tailwind CSS](https://cruip.com/make-a-stunning-card-hover-animations-with-tailwind-css)
- [Freefrontend – Stripe-Inspired Cards Hover Effect](https://freefrontend.com/code/stripe-inspired-cards-hover-effect-2026-01-19/)
