# Mejoras del dashboard (con datos existentes)

Propuestas de mejora del dashboard usando los datos que ya tiene el sistema (facturas, pagos, clientes, empresas).

---

## 1. Ya implementado: selector de período

- **Mes actual**, **Mes anterior**, **Este trimestre**, **Rango personalizado** (desde/hasta).
- Aplica a la empresa activa (o visión global si eres admin).
- Las tarjetas KPI (facturación, nº facturas, ticket medio, días de cobro) se recalculan para el período elegido.

---

## 2. Resumen del período en la cabecera

- Mostrar de forma explícita el intervalo de fechas que se está viendo.
- Ejemplos: *“1 ene 2026 – 31 ene 2026”*, *“Mes anterior (feb 2026)”*, *“Rango: 15 ene – 20 mar 2026”*.
- Ayuda a no confundir “todo a 0” con “no hay datos en este período”.

---

## 3. Desglose por empresa (solo visión global)

- Si el usuario es admin y está en **Visión global**, además del total consolidado:
  - Una sección “Por empresa” con una tarjeta o fila por empresa (Yenifer, Edison, Villegas) con:
    - Facturación del período, nº facturas, ticket medio.
  - Reutilizar `get_kpis_ventas` llamándola por cada `empresa_id` (o una RPC que devuelva el desglose en una sola llamada).
- Misma lógica de período (mes actual, anterior, trimestre, rango).

---

## 4. Facturas recientes (mini lista)

- Bloque “Últimas facturas” o “Facturas del período” en el dashboard:
  - Enlace a Ventas › Facturas con filtro de fechas aplicado, o
  - Lista corta (5–10) con: número, cliente, total, estado, enlace al detalle.
- Datos: misma tabla `facturas` + `fecha_emision` en el rango del selector.

---

## 5. Estados de factura en el período

- Pequeño resumen por estado: *Emitidas X, Pagadas Y, Pendientes de cobro Z, Anuladas W*.
- Se puede obtener con una query por `estado` y el rango de `fecha_emision` (o reutilizar/ampliar funciones de informes).
- Opcional: minigráfico (barras o donut) “Facturas por estado”.

---

## 6. Comparativa período actual vs anterior (más visible)

- Ya se calculan variaciones % en los KPIs.
- Mejora: una sección corta “Resumen comparativo”:
  - “Facturación: 12.000 € (este período) vs 10.500 € (anterior), +14,3%.”
  - Mismo esquema para nº facturas y ticket medio.
- Reutilizar los mismos datos que ya devuelve `get_kpis_ventas` (actual + anterior).

---

## 7. Alertas rápidas

- **Facturas con vencimiento próximo** (p. ej. próximos 7 días) y no pagadas: número y enlace a listado o detalle.
- **Facturas emitidas sin enviar por email** (si existe registro de envío): contador o lista corta.
- Datos: `facturas` + `fecha_vencimiento`, `estado`, y tabla de envíos de email si aplica.

---

## 8. Accesos directos

- Botones o enlaces fijos en el dashboard:
  - Nueva factura (ya existe).
  - Ver facturas del período (enlace a `/ventas/facturas?desde=...&hasta=...`).
  - Ver pagos del período.
  - Informes (si existe ruta de informes).
- Misma idea de período: que “Ver facturas” lleve ya aplicado el rango seleccionado.

---

## 9. Exportar resumen del período

- Botón “Exportar resumen” que genere un PDF o Excel con:
  - Período, empresa(s), total facturado, nº facturas, ticket medio, días cobro medio.
- Reutilizar datos de `get_kpis_ventas` y, si existe, lógica de exportación de informes.

---

## 10. Persistir período elegido

- Guardar en `localStorage` o en preferencias de usuario (si hay tabla de preferencias) la última opción de período (mes actual, anterior, trimestre, custom + fechas).
- Al volver al dashboard, cargar con ese período en lugar de “Mes actual” por defecto.

---

## Priorización sugerida

| Prioridad | Mejora                         | Esfuerzo | Impacto |
|----------|---------------------------------|----------|---------|
| Alta     | Resumen del período en cabecera | Bajo     | Alto    |
| Alta     | Facturas recientes / del período| Medio    | Alto    |
| Media    | Desglose por empresa (global)  | Medio    | Alto    |
| Media    | Estados de factura en período   | Bajo     | Medio   |
| Media    | Alertas (vencimientos, sin email)| Medio   | Medio   |
| Baja     | Comparativa más visible         | Bajo     | Medio   |
| Baja     | Exportar resumen                | Medio    | Medio   |
| Baja     | Persistir período               | Bajo     | Bajo    |

Todas las propuestas usan datos que el sistema ya tiene (facturas, pagos, clientes, empresas, series, informes/KPIs).
