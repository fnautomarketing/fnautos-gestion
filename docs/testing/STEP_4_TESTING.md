# Guía de Pruebas Manuales - Paso 4: Facturación y Series

En este paso verificaremos la creación de facturas, el uso de series de facturación y la vinculación con los clientes creados en el paso anterior.

## Pasos de la Prueba

### 1. Configuración de Series (Opcional pero Recomendado)
1. Navega a **Ventas > Configuración > Series** (si el menú existe, si no, ve directamente al siguiente paso).
2. **Verificación**: Asegúrate de que existe al menos una serie (ej: Serie `A` o `2024`).
3. El sistema suele crear una serie predeterminada al inicio.

### 2. Crear una Factura como Borrador (Draft)
1. Navega a **Ventas > Facturas** y haz clic en **"+ Nueva Factura"**.
2. **Selecciona un Cliente**: Elige el cliente que creaste en el Step 3 (`STV Test Client S.L.`).
3. **Añade Líneas de Detalle**:
   - Concepto: `Servicios de Consultoría Tech`
   - Cantidad: `1`
   - Precio: `1000`
   - IVA: `21%`
4. Haz clic en **"Guardar Borrador"** (no "Emitir").
5. **Verificación**: 
   - Deberías ver un mensaje de éxito.
   - En el listado de facturas, la factura debe aparecer con estado **"Borrador"** y número temporal (ej: `000` o similar).
   - El total debe ser `1210,00€`.

### 3. Emitir Factura (Finalizar)
1. Haz clic en la factura en borrador para abrirla o editarla.
2. Esta vez, haz clic en **"Emitir Factura"** (o similar, para pasar de borrador a emitida).
3. **Verificación**: 
   - El sistema debe asignar un número real basado en la serie (ej: `SERIE-001`).
   - El estado debe cambiar a **"Emitida"**.
   - Ya no debería ser editable (según la lógica de negocio estándar de ERPs).

### 4. Prueba de Lógica Financiera (Retenciones)
1. Intenta crear una nueva factura.
2. Si el cliente es una **Empresa** o **Autónomo**, intenta aplicar una **Retención IRPF** (ej: 15%).
3. **Verificación**: El total debe recalcularse correctamente: `Subtotal + IVA - Retención`.
4. Si intentas aplicar retención a un cliente marcado como **Particular**, el sistema debería mostrar un error al intentar guardar (según reglas de negocio detectadas).

### 5. Listado y Filtros
1. En **Ventas > Facturas**, usa los filtros de estado (Borrador, Emitida, Pagada).
2. **Verificación**: La tabla debe actualizarse para mostrar solo las facturas que coincidan con el estado seleccionado.

---
**Siguiente paso sugerido**: Una vez verificado el flujo de ingresos, el Paso 5 será la **Gestión de Pagos y Cobros** (marcar facturas como pagadas, registrar ingresos).
