# Especificación de Gestión de Gastos

## Resumen
Registro y clasificación de todos los gastos operativos de la empresa para control financiero y deducciones fiscales.

## 1. Listado de Gastos

### Vistas
-   **Tabla:** Fecha, Proveedor, Concepto/Categoría, Base, IVA, Total, Estado (Pagado/Pendiente), Adjunto.

### Filtros
-   **Búsqueda:** Proveedor, Concepto.
-   **Rango de Fechas:** Mes actual, Año fiscal, Personalizado.
-   **Categoría:** Combustible, Alquiler, Suministros, Nóminas, Marketing, etc.
-   **Estado:** Pagado, Pendiente.

## 2. Registro de Gasto

### Formulario
-   **Proveedor:** Nombre o NIF (con autocompletado si ya existe).
-   **Fecha:** Fecha de la factura/ticket.
-   **Referencia:** Nº de factura del proveedor.
-   **Concepto:** Descripción breve.
-   **Categoría:** Selector de categorías contables (editable en configuración).
-   **Base Imponible:** Monto antes de impuestos.
-   **Tipo de IVA:** Selector (21%, 10%, 4%, Exento).
-   **Total:** Calculado automáticamente (permite ajuste manual por redondeo).
-   **Método de Pago:** Caja, Banco, Tarjeta...
-   **Estado de Pago:** Pagado (fecha pago) o Pendiente (fecha vencimiento).
-   **Adjunto:** Subida de PDF o Foto del ticket/factura (OCR opcional futuro).

### Vinculaciones
-   **Vehículo:** Si es combustible/reparación, seleccionar matrícula.
-   **Proyecto/Obra:** Si es imputable a un cliente o proyecto específico.

## 3. Categorías de Gastos

### Gestión
-   Lista editable de categorías (e.g., "Suministros", "Arrendamientos", "Reparaciones", "Sueldos y Salarios").
-   Asignación de cuenta contable (opcional).

## Verificación

### Pruebas Manuales
-   [ ] Registrar gasto simple -> Verificar cálculo de IVA.
-   [ ] Registrar gasto con adjunto -> Verificar visualización del archivo.
-   [ ] Filtrar gastos por proveedor.
-   [ ] Verificar totales en Dashboard de Gastos.
