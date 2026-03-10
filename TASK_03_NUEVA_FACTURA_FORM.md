# Task 03: Verificación Visual y Funcional - Formulario de Nueva Factura

## Objetivo
Validar el flujo de creación de facturas, incluyendo multi-divisa, cálculos automáticos y UX premium.

## Checklist

### 1. Layout y Scroll (`/ventas/facturas/nueva`)
- [ ] El Resumen Económico (derecha) es sticky y sigue el scroll o es fácilmente accesible.
- [ ] No hay elementos cortados en el formulario de datos de cabecera.
- [ ] Los botones de "Emitir" y "Cancelar" están siempre visibles o al final del flujo.

### 2. Funcionalidad Financiera
- [ ] Selector de Cliente carga la lista completa.
- [ ] Selector de Serie muestra las series activas y auto-incrementa (simulado).
- [ ] **Multi-divisa (RFC-029)**:
    - [ ] Cambiar a USD muestra el campo de "Tipo de Cambio".
    - [ ] El símbolo de la divisa ($ o £) se actualiza en los totales.
    - [ ] Los cálculos de totales respetan el cambio si es necesario (o se mantiene en la divisa elegida).
- [ ] **Líneas de Factura**:
    - [ ] Añadir/Eliminar líneas funciona sin errores de estado.
    - [ ] El cálculo del subtotal por línea es instantáneo.
    - [ ] Aplicar descuento (%) y ver reflejado en el total.
    - [ ] Selección de IVA por línea.

### 3. UX y Feedback
- [ ] Modal de confirmación antes de emitir definitivamente.
- [ ] Toast de éxito tras la creación.
- [ ] Redirección correcta al detalle de la factura creada o a la lista.

## Instrucciones para el Agente
1. Navegar a `/ventas/facturas/nueva`.
2. Crear una factura en **EUR** con 2 líneas y descuento.
3. Crear una factura en **USD** con tipo de cambio manual.
4. Verificar que el "Resumen Económico" no se solape con el pie de página.
5. Capturar screenshots del proceso y de los errores de validación si los hay.
