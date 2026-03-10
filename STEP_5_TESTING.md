# Guía de Pruebas Manuales - Paso 5: Pagos y Cobros

En este paso verificaremos cómo cerrar el ciclo de una factura registrando su cobro.

## Pasos de la Prueba

### 1. Registro de Pago Parcial
1. Navega a **Ventas > Facturas** y busca la factura que emitiste en el Step 4 (la de 1210,00€).
2. Haz clic en la factura para ver su detalle.
3. Busca el botón o sección de **"Registrar Pago"**.
4. Rellena los datos:
   - **Importe**: `500` (menos del total).
   - **Fecha**: Hoy.
   - **Método**: Transferencia.
5. Haz clic en **"Registrar"**.
6. **Verificación**: 
   - El estado de la factura debería cambiar a **"Parcial"** (o mantenerse en emitida pero mostrando el importe pendiente).
   - Debería aparecer un registro en el historial de pagos de la factura por 500€.

### 2. Registro de Pago Total (Liquidación)
1. En la misma factura, vuelve a registrar un pago.
2. Introduce el importe restante (`710`).
3. Asegúrate de que la opción **"Marcar como pagada"** esté activa o que el sistema detecte que el total está cubierto.
4. Haz clic en **"Registrar"**.
5. **Verificación**: 
   - El estado de la factura debe cambiar a **"Pagada"**.
   - El importe pendiente debe ser `0,00€`.

### 3. Verificación en el Listado de Pagos
1. Navega al menú lateral **Ventas > Pagos** (si existe el módulo independiente).
2. **Verificación**: 
   - Deberías ver los dos registros de pago que acabas de realizar (el de 500€ y el de 710€).
   - Deben estar asociados al cliente `STV Test Client S.L.`.

### 4. Prueba de Límite (Exceso de Pago)
1. Intenta registrar un pago adicional en una factura que ya está pagada o cuyo importe exceda el total.
2. **Verificación**: El sistema debería mostrar un error indicando que el importe del pago excede el total pendiente de la factura.

---
**Felicidades**: Has completado las 5 fases principales de prueba del ciclo de ventas. El siguiente paso opcional sería la **Generación de PDFs** y **Envío por Email**.
