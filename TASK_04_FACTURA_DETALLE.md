# Task 04: Detalle de Factura, Historial y Emails

## Objetivo
Verificar la visualización de datos post-emisión y el seguimiento de actividad.

## Checklist

### 1. Detalle de Factura (`/ventas/facturas/[id]`)
- [ ] La cabecera muestra el estado actual con el badge correcto.
- [ ] Las líneas se muestran en una tabla limpia.
- [ ] Los totales (Base, IVA, Total) coinciden con el resumen.

### 2. Historial de Cambios
- [ ] El componente `HistorialCambiosCard` muestra quién, cuándo y qué se cambió.
- [ ] Se registran cambios de estado (ej: de Borrador a Emitida).

### 3. Seguimiento de Emails
- [ ] `EmailActivityCard` y `EmailSummaryCard` (si están en el detalle) muestran el estado de envío.
- [ ] Verificar que el diseño de estos componentes sea coherente con el resto de la UI.

### 4. Acciones Rápidas
- [ ] Botón para Registrar Pago funciona (abre modal o navega).
- [ ] Botón para Generar/Descargar PDF (enlazado a Task 06).
- [ ] Botón para Duplicar Factura (RFC-011) funcional.

## Instrucciones para el Agente
1. Abrir el detalle de una factura existente.
2. Realizar una edición (si es borrador) y verificar que aparezca en el historial.
3. Simular o verificar el envío de un email y ver si se refleja en la actividad.
4. Verificar que en modo móvil el historial y actividad se apilen correctamente bajo el detalle.
