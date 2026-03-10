# Especificación de Ventas - Pagos

## Resumen
Gestión clara y eficiente de los cobros de facturas, admitiendo pagos parciales y múltiples métodos de registro.

## 1. Listado de Pagos Relevantes

### Vistas
-   **Desde Ventas:** Todas las facturas con saldo pendiente.
-   **Desde Ficha de Cliente:** Pagos específicos de ese cliente.
-   **Desde Factura:** Historial de pagos realizados a esa factura específica.

## 2. Registro de Nuevo Pago

### Formulario
#### Campos
-   **Factura:** Selector de factura pendiente (si se entra desde listado general).
-   **Cliente:** Automático al seleccionar factura.
-   **Monto:** Importe del pago. Por defecto, el saldo pendiente total.
-   **Fecha:** Día en que se recibió el dinero.
-   **Método:** Efectivo, Transferencia, Tarjeta, Cheque, Pagaré.
-   **Referencia:** Campo de texto libre para anotar Nº de transferencia, cheque, etc.
-   **Notas:** Observaciones internas.

### Validaciones
-   Monto no puede exceder el **saldo pendiente** de la factura.
-   Fecha no puede ser posterior a la actual (opcional/advertencia).

### Acciones
-   Guardar -> Registra el pago y actualiza el saldo pendiente de la factura.
-   Si `Saldo Pendiente == 0`, cambia estado de factura a **Pagada**.

## 3. Pagos Parciales

### Lógica
-   Permite introducir un importe menor al total de la factura.
-   La factura permanece en estado **Pendiente** (o **Parcialmente Pagada** si existe ese estado intermedio).
-   Se muestra claramente el: `Total Facturado`, `Total Pagado`, `Restante por Pagar`.

## 4. Historial de Pagos de una Factura

### Tabla
-   Lista cronológica de pagos recibidos para una factura específica.
-   **Fecha, Importe, Método, Referencia, Usuario que registró.**
-   **Acciones:** Editar (solo administradores), Eliminar (revertir pago).

### Revertir Pago (Eliminar)
-   Si se elimina un pago, el importe se suma de nuevo al saldo pendiente de la factura.
-   Si la factura estaba **Pagada**, vuelve a estado **Pendiente**.

## Verificación

### Pruebas Manuales
-   [ ] Registrar pago completo -> Factura pasa a estado Pagada.
-   [ ] Registrar pago parcial -> Saldo pendiente se actualiza correctamente.
-   [ ] Intentar registrar pago mayor al saldo -> Error de validación.
-   [ ] Eliminar pago -> Saldo pendiente se restaura.
-   [ ] Verificar que los pagos aparecen en el resumen financiero del dashboard (Tesoreria).
