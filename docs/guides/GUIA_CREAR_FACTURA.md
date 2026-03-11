
# 📄 Guía para Generar una Nueva Factura de Venta

Esta guía describe el proceso paso a paso para emitir una nueva factura en el sistema **STVLS ERP**.

## 1. Acceso al Formulario
1. Diríjase al menú lateral izquierdo y haga clic en **Ventas**.
2. Seleccione la opción **Facturas**.
3. En la esquina superior derecha, haga clic en el botón azul **+ Nueva Factura**.

---

## 2. Configuración Inicial (Cabecera)

Antes de rellenar los datos económicos, configure el contexto de la factura:

*   **🏢 Empresa Emisora:** Si tiene acceso a múltiples empresas, asegúrese de que está seleccionada la empresa correcta que emitirá la factura.
*   **📄 Plantilla PDF:** Elija el diseño visual que tendrá el documento final (Ej: *Corporativa Estándar*, *Minimalista*).

## 3. Datos del Cliente y Fechas

*   **👤 Cliente:** Seleccione el cliente al que va dirigida la factura desde el desplegable.
    *   *Nota: Si el cliente no aparece, deberá crearlo primero en la sección de "Clientes".*
*   **📅 Fecha de Emisión:** Por defecto es la fecha de hoy.
*   **📅 Fecha de Vencimiento:** Por defecto se calcula a 30 días, pero puede ajustarla según el acuerdo comercial.

## 4. Configuración Económica (Opcional)

Si opera en múltiples monedas:
*   **💱 Divisa:** Seleccione la moneda de la factura (EUR, USD, GBP).
*   **Tipo de Cambio:** Si la divisa no es EUR, puede ajustar el tipo de cambio para los registros internos.

## 5. Líneas de Concepto

Añada los productos o servicios a facturar:

1.  Escriba el **Concepto / Servicio**.
2.  Indique la **Cantidad**.
3.  Establezca el **Precio Unitario** (sin IVA).
4.  El sistema calculará automáticamente el subtotal de la línea.
5.  *Para añadir más líneas, haga clic en el botón "+ Añadir Línea".*
6.  *Para eliminar una línea, haga clic en el icono de la papelera 🗑️.*

## 6. Descuentos y Notas

*   **🏷️ Descuento Global:** Puede aplicar un descuento al total de la base imponible, ya sea por **Porcentaje (%)** o una **Cantidad Fija (€)**.
*   **📝 Notas / Cláusulas:** Añada cualquier información adicional que deba aparecer en la factura (ej: "Condiciones de entrega según contrato").

## 7. Revisión y Emisión

1.  En el panel lateral derecho, revise el **Resumen Económico** (Subtotal, IVA, Total).
2.  Haga clic en el botón **"Emitir Factura"**.
3.  Aparecerá una ventana de confirmación con el importe total.
4.  Confirme la acción haciendo clic en **"Sí, emitir factura"**.

---

### ✅ Resultado
*   El sistema generará automáticamente el **Número de Factura** consecutivo (ej: `FAC-24-001`).
*   Será redirigido al listado de facturas donde verá el nuevo documento con estado **Emitida**.
*   Desde allí podrá descargar el PDF o enviarla por email.
