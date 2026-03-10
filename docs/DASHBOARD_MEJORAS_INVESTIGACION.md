# Investigación: Mejoras del Dashboard (estilo Power BI profesional)

Documento de investigación basado en buenas prácticas de la industria, referencias de Power BI y UX de dashboards para proponer mejoras al dashboard del ERP STVLS.

---

## 1. Estado actual del dashboard

### Qué tenemos hoy

- **Página:** `src/app/(dashboard)/dashboard/page.tsx`
- **Componentes:** `DashboardPeriodSelector`, `DashboardCharts` (Recharts: línea + dona)
- **Período global:** selector en cabecera (Mes actual, Mes anterior, Trimestre, YTD, Últimos 12 meses, Rango personalizado). Un solo período aplica a **toda** la página.
- **KPIs mostrados (4 tarjetas):**
  1. Facturación del período
  2. Nº Facturas
  3. Ticket medio
  4. Días Cobro (Promedio)
- **Comparativa:** cada KPI muestra variación % vs “período anterior” (calculado según el rango elegido).
- **Gráficos:** evolución de facturación (línea por mes) y facturas por estado (dona).
- **Otros bloques:** estados del período, vencimientos próximos (7 días), desglose por empresa (visión global), facturas recientes del período.

### Limitaciones detectadas

1. **Sin selector Semana/Mes por KPI:** el período es único para todo; no se puede ver un KPI en “esta semana” y otro en “este mes” desde la misma vista.
2. **Sin cambio de tipo de gráfico:** la evolución es siempre línea; no hay opción bar/area/combo.
3. **Período solo en cabecera:** no hay control “Semana | Mes” visible junto a cada tarjeta.
4. **Más de 4 KPIs y varios bloques:** riesgo de saturación si se añaden más métricas sin reorganizar.

---

## 2. Buenas prácticas (investigación web)

### 2.1 Alineación ERP con KPIs

- Los dashboards ERP deben alinearse con **KPIs críticos del negocio** para decidir más rápido y detectar desvíos.
- Objetivo: **mostrar el dato adecuado, en el formato adecuado**, para que el usuario decida sin leer informes largos.
- Definir primero los KPIs que importan (ventas, cobro, margen, cumplimiento) y luego mapear los datos del ERP a esas fórmulas.

*Referencias: Yodaplus, Oracle CFO KPIs, UXmatters “Designing the ERP Dashboard User Experience”, Sysgenpro.*

### 2.2 Diseño tipo Power BI (Microsoft Learn, Lukas Reese, Medium 2026)

- **Empezar por el usuario:** qué decisiones debe apoyar el dashboard y quién lo usa (no solo “qué datos tenemos”).
- **Jerarquía visual:** lo más importante arriba-izquierda; lectura de arriba abajo y de izquierda a derecha.
- **Evitar sobrecarga:** 5–7 elementos de información distintos como máximo por pantalla; muchos dashboards empresariales tienen 15–20 y generan ruido.
- **Una pantalla sin scroll** para el “executive view”: 3–5 KPIs destacados arriba y 1–2 gráficos de contexto abajo.
- **Tarjetas (cards)** para los números clave; tipografía grande y legible (incluso en proyección).
- **Color con significado:** verde = bien/objetivo, amarillo = riesgo, rojo = mal/desviado.
- **Cohérence:** mismas escalas, orden de ejes y paleta en todos los gráficos.
- **Gráficos:** evitar 3D y gauges para comparaciones; barras/columnas para comparar valores; líneas para tendencias; área para magnitud de cambio.

*Referencias: Microsoft Learn “Tips for Designing a Great Power BI Dashboard”, Lukas Reese, Medium “Power BI best practices 2026”, KnowledgeHut.*

### 2.3 Selector de período (Semana / Mes) en KPIs

- **Patrón recomendado:** un control tipo **button group** (Semana | Mes | Trimestre | Año) con el estado activo resaltado.
- **Alcance:**  
  - **Global:** un solo selector que cambia el período de **todos** los KPIs y gráficos (como ahora).  
  - **Por KPI:** cada tarjeta tiene su propio “Semana | Mes” (o similar) para que el usuario pueda comparar, por ejemplo, facturación “esta semana” con “este mes” en la misma vista.
- Ventaja del **selector por KPI:** flexibilidad para análisis rápido sin cambiar el contexto global (p. ej. “esta semana” en ventas y “este mes” en cobro).
- En Power BI / Looker se suele usar una “tabla desconectada” o un **parámetro global** que aplica a todas las medidas; si se quiere comportamiento “por widget”, cada widget lleva su propio parámetro/selector.

*Referencias: Concurrency “Monthly/Annual Toggle”, Looker Studio Bible (date toggle, parameter day/week/month), Shadcn “Button Group - Timeline Controls”, Medium “dynamically change date frequency in Looker Studio”.*

### 2.4 Cambio dinámico del tipo de gráfico

- **Patrón:** mismo dataset, varios tipos (línea, barra, área, etc.) y un **selector** (dropdown o iconos) que cambia el tipo de visualización.
- **Implementación técnica:**  
  - Chart.js: `chart.config.type = 'bar'` (o `'line'`, `'radar'`) + `chart.update()`.  
  - Recharts: cambiar el componente renderizado (`<Line>` vs `<Bar>` vs `<Area>`) según estado.  
  - Bold BI: parámetro + enlace entre widgets para que un “master” cambie el tipo en otros.
- Tipos útiles para **evolución temporal:** línea (tendencia), barra/columna (comparar períodos), área (énfasis en volumen).
- Evitar: demasiadas opciones en un mismo gráfico; mantener 3–4 tipos relevantes para no confundir.

*Referencias: Chart.js dynamic type change, Bold BI “Dynamic Chart Type Switching”, Highcharts/Stack Overflow “dynamically change chart type”, Zebra BI / IBCS “Choose the Right Chart”.*

### 2.5 KPIs recomendados para dashboards de ventas/ERP

- **Ventas y facturación:** ingresos/facturación total, nº facturas, ticket medio, tendencia (vs período anterior).
- **Cobro y liquidez:** DSO (días de ventas pendientes de cobro), facturas vencidas (count o %), cuentas por cobrar totales, rotación de cobro.
- **Rentabilidad:** margen (bruto/operativo si hay datos), comparativa ingresos vs gastos.
- **Operativo:** estados de facturas (emitida/pagada/borrador), vencimientos próximos, cumplimiento de plazos.

*Referencias: M9 “Dashboards ERP KPIs pyme”, Conecta Software “Ventas BI”, Entel Digital “8 métricas ERP”, ClicData “Cuentas a Cobrar”, Kleva “KPIs cobranza CFO”.*

---

## 3. Resumen: qué debe tener un dashboard “estilo Power BI top mundial”

| Aspecto | Recomendación |
|--------|----------------|
| **Cantidad de KPIs** | 5–7 como máximo en la vista principal; el resto en drill-down o páginas secundarias. |
| **Orden visual** | KPIs principales arriba (cards grandes); luego 1–2 gráficos de contexto. |
| **Período** | Selector global claro (ya lo tenemos) + opción de **Semana | Mes** por KPI (o por sección) para flexibilidad. |
| **Comparativa** | Cada KPI con variación vs período anterior y señal visual (verde/rojo/neutro). |
| **Gráficos** | Tipo elegible por el usuario (línea, barra, área) con los mismos datos; escalas y colores coherentes. |
| **Una pantalla** | Vista ejecutiva sin scroll; detalle en otras vistas o modales. |
| **Accesibilidad** | Contraste, tipografía legible, teclado. |
| **Responsive** | Adaptación a tablet/móvil (cards apiladas, gráficos que no se rompan). |

---

## 4. Propuestas concretas para nuestro dashboard

### 4.1 Selector Semana / Mes por KPI (izquierda → derecha)

- Añadir en **cada tarjeta de KPI** un control pequeño: **Semana | Mes** (o “7d | 30d”) a la derecha de la etiqueta o debajo.
- Comportamiento:
  - **Semana:** último periodo de 7 días (o “semana actual” según definición de negocio).
  - **Mes:** mes actual o lógica actual (según período global).
- Opciones de diseño:
  - **A)** Cada tarjeta tiene su propio estado (cada una puede estar en Semana o en Mes).
  - **B)** Un único toggle global “Vista: Semana | Mes” que aplica a todas las tarjetas (más simple y coherente con “un solo período”).
- Recomendación inicial: **B** para no duplicar lógica ni confundir; si más adelante se pide “esta semana en facturación y este mes en cobro”, implementar **A** con estado por widget.

### 4.2 Selector de tipo de gráfico (evolución de facturación)

- En el bloque “Evolución de facturación” añadir un selector (iconos o dropdown): **Línea | Barras | Área**.
- Mantener el mismo dataset y la misma agrupación temporal; solo cambiar el componente Recharts (`Line` / `Bar` / `Area`).
- Guardar preferencia en `localStorage` para persistir entre sesiones (opcional).

### 4.3 Reorganización visual (estilo Power BI)

- Mantener **4–5 KPIs** en la primera fila; si se añaden más métricas (p. ej. DSO, facturas vencidas), considerar una segunda fila de “KPIs secundarios” o pestañas (Resumen / Cobro / Detalle).
- Un solo **bloque de gráficos** debajo (evolución + distribución), con el selector de tipo de gráfico solo en el gráfico de evolución.
- Estados del período, vencimientos y listas (facturas recientes, desglose) debajo, en grid claro para no saturar.

### 4.4 KPIs adicionales sugeridos (si hay datos)

- **Facturas vencidas** (count o importe) y/o **% facturas vencidas**.
- **DSO** (días de cobro) ya lo tenemos; se puede destacar más o añadir meta (ej. “Objetivo &lt; 45 días”).
- **Margen** o **ingresos netos** si el ERP expone costes/egresos por período.

### 4.5 Mejoras de UX rápidas

- Tooltips en las tarjetas explicando “vs período anterior” (semana anterior / mes anterior según el modo).
- En gráficos: tooltips consistentes, ejes etiquetados y leyenda clara.
- Indicador de carga/skeleton en KPIs y gráficos al cambiar período o tipo de gráfico.
- Considerar **sparklines** en las propias tarjetas de KPI (minigráfico de tendencia) para acercarse más a Power BI.

---

## 5. Referencias y enlaces

- [How to Align ERP Dashboards with Business KPIs \| Yodaplus](https://yodaplus.com/blog/how-to-align-erp-dashboards-with-business-kpis/)
- [20 Key CFO KPIs and Dashboards \| Oracle](https://www.oracle.com/erp/cfo/cfo-kpis/)
- [Designing the ERP Dashboard User Experience \| UXmatters](https://www.uxmatters.com/mt/archives/2025/02/designing-the-erp-dashboard-user-experience.php)
- [Power BI Dashboard Design Best Practices \| Microsoft Learn](https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips)
- [Power BI Dashboard Design Best Practices: 15 Expert Tips \| Lukas Reese](https://lukasreese.com/2025/08/20/power-bi-dashboard-design-best-practices-guide/)
- [Power BI How To: Monthly/Annual Toggle \| Concurrency](https://concurrency.com/blog/power-bi-how-to-adding-a-monthly-annual-toggle-to-a-dashboard/)
- [How to build a parameter to switch between day, week or month \| Looker Studio Bible](https://lookerstudiobible.com/how-to-build-a-parameter-to-switch-between-day-week-or-month-in-looker-studio-108fc07e1ec5)
- [React Button Group - Timeline Controls \| Shadcn](https://www.shadcn.io/patterns/button-group-display-3)
- [Chart.js: Dynamic Changing of Chart Type \| Stack Overflow](https://stackoverflow.com/questions/36949343/chart-js-dynamic-changing-of-chart-type-line-to-bar-as-example)
- [Dashboards ERP: KPIs clave pyme \| M9](https://blog.mproerp.com/dashboards-erp-kpis-clave-pyme/)
- [Visual hierarchy in dashboard design \| LinkedIn / Observable](https://observablehq.com/blog/seven-ways-design-better-dashboards)
- [Choose the Right Chart \| Zebra BI / IBCS](https://zebrabi.com/chart-selector/)

---

*Documento generado a partir de investigación web y análisis del código del dashboard en el repositorio. Última actualización: marzo 2025.*
