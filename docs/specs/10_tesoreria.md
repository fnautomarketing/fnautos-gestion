# Especificación de Tesorería

## Resumen
Módulo para el control de la liquidez de la empresa, conciliación bancaria y previsiones de cobros y pagos.

## 1. Posición Global (Dashboard Tesorería)

### Métricas
-   **Saldo Disponible:** Suma de todas las cuentas bancarias configuradas.
-   **Previsión:** Gráfico de flujo de caja proyectado a 30, 60 y 90 días basado en vencimientos de facturas emitidas y recibidas.
-   **Cobros Vencidos:** Alerta de facturas emitidas pendientes de cobro fuera de plazo.
-   **Pagos Próximos:** Alerta de gastos programados a vencer.

## 2. Gestión de Bancos

### Cuentas y Tarjetas
-   **Lista:** Entidades bancarias, IBAN, saldo actual (manual o conectado via API futura).
-   **Movimientos:** Registro de entradas y salidas asociadas a la cuenta.

### Conciliación
-   Emparejamiento de movimientos bancarios (importados via CSV o API) con facturas de venta y compra registradas en el ERP.
-   **Estado:** Conciliado (verde), Pendiente (amarillo), Descuadrado (rojo).

## 3. Previsiones

### Calendario de Tesorería
-   Visualización mensual de entradas y salidas previstas.
-   Permite añadir movimientos manuales extra-contables (aportaciones socios, préstamos, impuestos).

## Verificación

### Pruebas Manuales
-   [ ] Verificar saldo total sumando cuentas.
-   [ ] Simular pago de factura -> Saldo cuenta aumenta -> Factura conciliada.
-   [ ] Simular pago de gasto -> Saldo cuenta disminuye -> Gasto conciliado.
-   [ ] Verificar gráfico de previsión con facturas futuras.
