# Task 11: Revisión y Consolidación de Pagos

## Objetivo
Asegurar que el módulo de pagos funcione correctamente y registre todas las transacciones sin errores.

## Requisitos Funcionales
1. **Registro de Pagos**:
   - El sistema debe permitir registrar pagos parciales y totales.
   - Al completar el pago, el estado de la factura debe pasar a "Pagada" automáticamente.

2. **Visualización**:
   - El listado de pagos debe mostrar claramente la fecha, importe y factura asociada.
   - Los filtros por estado (Pendiente/Cobrado) deben ser precisos.

## Checklist de Implementación
- [ ] Verificación Manual: Registrar pagos para facturas de prueba en diferentes escenarios (Total, Parcial).
- [ ] Verificación de Estados: Comprobar transición de estado de factura.
- [ ] Corrección de Bugs: Identificar y solucionar cualquier error en el flujo de caja.

## Plan de Pruebas (Chrome DevTools Expert)
- [ ] **Network**: Analizar la petición de registro de pago (Time to First Byte).
- [ ] **Elements**: Verificar que el modal de pagos se comporta correctamente (focus trap, cierre con ESC).
- [ ] **Console**: Monitorizar errores de JavaScript durante el proceso de pago.
- [ ] **Lighthouse**: Auditar accesibilidad del formulario de pagos.
