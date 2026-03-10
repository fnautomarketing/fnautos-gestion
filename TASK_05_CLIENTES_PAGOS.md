# Task 05: Clientes y Gestión de Pagos

## Objetivo
Verificar el CRM básico y el flujo de cobros.

## Checklist

### 1. Gestión de Clientes (`/ventas/clientes`)
- [ ] Listado de clientes con stats (Total Clientes, Activos, etc.).
- [ ] Búsqueda por nombre o CIF funciona.
- [ ] Crear Nuevo Cliente: validación de campos obligatorios.
- [ ] Editar cliente existente.
- [ ] Verificar que no se puede eliminar un cliente con facturas asociadas (si aplica lógica).

### 2. Gestión de Pagos (`/ventas/pagos`)
- [ ] El dashboard de pagos muestra Facturación Total vs Cobrado.
- [ ] Las pestañas (Todos, Pendientes, Cobrados, Vencidos) filtran la tabla correctamente.
- [ ] Registrar un pago desde la tabla o desde el detalle de la factura.
- [ ] Verificar que el pago actualiza el estado de la factura de "Emitida" a "Pagada" o "Parcial".
- [ ] Visualización de archivos adjuntos (comprobantes) si aplica.

## Instrucciones para el Agente
1. Navegar a `/ventas/clientes` y crear un cliente nuevo.
2. Emitir una factura a ese cliente.
3. Ir a `/ventas/pagos` y registrar el cobro de esa factura.
4. Confirmar que la factura ahora aparece como "Pagada".
5. Capturar screenshots de las stats de pagos antes y después de registrar el cobro.
