# Informe de Pruebas STEP 5 - Pagos y Cobros

**Fecha:** 14 feb 2026  
**Referencia:** STEP_5_TESTING.md

---

## Resumen Ejecutivo

✅ **CORRECCIONES APLICADAS Y SISTEMA PREPARADO PARA PRUEBAS**

Se han identificado y corregido varios problemas en el flujo de pagos. El sistema está listo para ejecutar las pruebas manuales descritas en STEP_5_TESTING.md.

---

## Correcciones Aplicadas

### 1. Vista de Pagos no mostraba registros ✅

**Problema:** La acción `registrarPagoAction` insertaba solo en `pagos_factura`, pero la vista `vista_pagos_dashboard` (usada en Ventas > Pagos) lee de la tabla `pagos`. La tabla `pagos` estaba vacía.

**Solución:** Se modificó `registrarPagoAction` para insertar en **ambas** tablas:
- `pagos_factura` → Historial en detalle de factura
- `pagos` → Vista del dashboard de pagos

### 2. Estado "Parcial" no se actualizaba ✅

**Problema:** La factura solo cambiaba a "pagada" cuando el total estaba cubierto. No existía el estado "parcial" para facturas con pagos parciales.

**Solución:** Se actualizó la lógica para que cuando hay pagos pero no se cubre el total, el estado cambie a `parcial`.

### 3. Badge y filtros para estado "Parcial" ✅

**Ficheros modificados:**
- `detalle-factura-header.tsx` → Badge "Parcial" (naranja)
- `facturas-table.tsx` → Badge de estado en tabla
- `facturas-filters.tsx` → Opción "Parcial" en filtro de estado
- `resumen-factura-pago.tsx` → Ya tenía soporte para parcial

### 4. Validación de exceso de pago en frontend ✅

**Problema:** El formulario solo validaba mínimo (0.01€), no máximo. El backend ya validaba, pero la UX era mejor con validación en frontend.

**Solución:** Se añadió validación dinámica `z.max(pendienteActual + 0.01)` en el schema del formulario de registrar pago.

### 5. Botón "Registrar Pago" en facturas pagadas ✅

**Problema:** El botón seguía activo en facturas pagadas, permitiendo intentar registrar pagos adicionales.

**Solución:** 
- Botón deshabilitado cuando `estado === 'pagada'`
- Redirección automática en la página `/ventas/facturas/[id]/pago` si la factura ya está pagada

### 6. Validación de exceso en backend ✅

**Existente:** La acción ya validaba correctamente:
```ts
if (validated.importe > pendiente + 0.01) {
    return { success: false, error: `El importe del pago (${validated.importe}€) excede el pendiente (${pendiente.toFixed(2)}€)` }
}
```

---

## Guía de Pruebas Manuales (Paso a Paso)

### Requisito previo

Necesitas una **factura emitida** con estado "emitida" o "parcial" y pendiente > 0. Si la factura del Step 4 (1210€) ya está pagada, crea una nueva:

1. **Ventas > Facturas > Nueva Factura**
2. Cliente: Cliente Exitoso SL (o el que uses)
3. Línea: Concepto "Servicios de Consultoría Tech", Cant 1, Precio 1000€, IVA 21%
4. Total: 1210€
5. Guardar Borrador → Emitir Factura

---

### 1. Registro de Pago Parcial ✅

1. **Ventas > Facturas** → Buscar la factura emitida (1210€)
2. Clic en la factura → Ver detalle
3. Clic en **"Registrar Pago"**
4. Rellenar:
   - **Importe:** `500`
   - **Fecha:** Hoy
   - **Método:** Transferencia
5. Seleccionar **"Pago Parcial"** (radio)
6. Clic en **"Guardar Pago"**

**Verificación esperada:**
- Estado de la factura: **Parcial** (badge naranja)
- Historial de pagos: 1 registro de 500€
- Pendiente: 710€

---

### 2. Registro de Pago Total (Liquidación) ✅

1. En la misma factura, clic en **"Registrar Pago"**
2. Importe: `710` (restante)
3. El sistema detectará que cubre el total → **"Pago Total (Liquida factura)"** se seleccionará automáticamente
4. Clic en **"Guardar Pago"**

**Verificación esperada:**
- Estado: **Pagada**
- Pendiente: 0,00€
- Historial: 2 registros (500€ + 710€)

---

### 3. Verificación en el Listado de Pagos ✅

1. **Ventas > Pagos** (menú lateral)
2. Tab **"Cobrados"** o **"Todos"**

**Verificación esperada:**
- Los dos registros (500€ y 710€) deben aparecer
- Asociados al cliente correcto
- Método: Transferencia

---

### 4. Prueba de Límite (Exceso de Pago) ✅

**Opción A:** Crear otra factura emitida, registrar un pago con importe mayor al pendiente (ej. pendiente 100€, intentar 150€).

**Opción B:** En una factura parcial, intentar registrar un pago que exceda el pendiente.

**Verificación esperada:**
- Toast de error: "El importe del pago (X€) excede el pendiente (Y€)"
- El pago no se registra

---

### 5. Factura ya pagada ✅

1. Ir al detalle de una factura **pagada**
2. Clic en **"Registrar Pago"**

**Verificación esperada:**
- El botón **"Registrar Pago"** debe estar **deshabilitado** (gris)
- Si se accede directamente por URL a `/ventas/facturas/[id]/pago`, debe redirigir al detalle de la factura

---

## Ficheros Modificados

| Fichero | Cambio |
|---------|--------|
| `src/app/actions/pagos.ts` | Insertar en `pagos` + `pagos_factura`; actualizar estado a `parcial` |
| `src/components/ventas/pagos/registrar-pago-form.tsx` | Validación max importe ≤ pendiente |
| `src/components/ventas/detalle-factura-header.tsx` | Badge parcial; deshabilitar Registrar Pago si pagada |
| `src/components/ventas/facturas-table.tsx` | Badge estado parcial |
| `src/components/ventas/facturas-filters.tsx` | Filtro estado parcial |
| `src/app/(dashboard)/ventas/facturas/[id]/pago/page.tsx` | Redirección si factura pagada |

---

## Conclusión

El flujo de pagos y cobros está corregido y listo para las pruebas STEP 5. El usuario debe:

1. Crear una factura emitida (si no tiene una disponible)
2. Seguir el flujo de pago parcial (500€) + pago total (710€)
3. Verificar en Ventas > Pagos
4. Probar el límite de exceso de pago
5. Confirmar que el botón Registrar Pago está deshabilitado en facturas pagadas

**Siguiente paso:** Generación de PDFs y Envío por Email (opcional).
