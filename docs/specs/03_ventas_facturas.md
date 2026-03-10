# Especificación de Ventas - Facturas

## Resumen
Gestión completa del ciclo de vida de las facturas de venta, desde la creación hasta el cobro, anulación y envío. Proporciona filtros, ordenamiento y acciones avanzadas.

## 1. Listado de Facturas

### Filtros
-   **Búsqueda:** Búsqueda textual por número de factura, nombre de cliente o concepto.
-   **Rango de Fechas:** Filtrar por fecha de emisión o vencimiento.
-   **Estado:** Filtrar por estado de la factura (Pendiente, Pagada, Vencida, Anulada).
-   **Cliente:** Filtrar por cliente específico.

### Columnas de la Tabla
-   **Serie y Número:** Formato `SERIE-AAAA-NNNN` (e.g., F2024-001).
-   **Cliente:** Nombre del cliente.
-   **Fecha Emisión:** Fecha de creación de la factura.
-   **Fecha Vencimiento:** Fecha límite de pago.
-   **Importe Total:** Monto total con impuestos incluidos.
-   **Estado:** Badge visual indicando el estado.
    -   *Pendiente:* Naranja.
    -   *Pagada:* Verde.
    -   *Vencida:* Rojo.
    -   *Anulada:* Gris.
-   **Acciones:** Menú desplegable con opciones (Ver, Editar, Duplicar, Rectificar, Email, Eliminar).

### Paginación
-   Mostrar 10, 25, 50 o 100 facturas por página.
-   Navegación entre páginas (Anterior, Siguiente, Números).

## 2. Creación de Factura

### Formulario
#### Cabecera
-   **Cliente:** Selector de cliente existente con autocompletado o botón para crear nuevo cliente en modal.
-   **Serie:** Selección de serie de facturación activa.
-   **Fecha Emisión:** Selector de fecha (default: hoy).
-   **Fecha Vencimiento:** Selector de fecha o cálculo automático basado en condiciones de pago del cliente.
-   **Notas:** Campo de texto libre para observaciones internas o visibles en factura.

#### Líneas de Factura
-   **Concepto:** Selector de concepto predefinido o entrada de texto libre.
-   **Descripción:** Detalle del servicio/producto.
-   **Cantidad:** Número numérico.
-   **Precio Unitario:** Valor monetario.
-   **IVA:** Selección de tasa de impuesto (e.g., 21%, 10%, 4%).
-   **Descuento:** Porcentaje o monto fijo de descuento por línea.
-   **Total Línea:** Cálculo automático: `(Cantidad * Precio) - Descuento + IVA`.
-   **Acción:** Botón para eliminar línea.
-   **Añadir Línea:** Botón para agregar nueva fila vacía.

#### Totales
-   **Base Imponible:** Suma de `(Cantidad * Precio) - Descuento` de todas las líneas.
-   **Total IVA:** Suma del impuesto calculado.
-   **Total General:** `Base Imponible + Total IVA`.
-   **Retención (IRPF):** Si aplica, campo para porcentaje de retención.

### Acciones de Guardado
-   **Guardar:** Crea la factura en estado "Borrador" o "Pendiente" según configuración.
-   **Guardar y Enviar:** Guarda y abre modal de envío por correo.
-   **Cancelar:** Regresa al listado sin guardar.

## 3. Edición de Factura
-   Permite modificar todos los campos de una factura **mientras no esté en estado "Pagada" o "Anulada"** (o según permisos).
-   Si la factura está pagada, se debe advertir o bloquear la edición de importes.

## 4. Detalles de Factura (Vista)
-   Visualización de la factura en formato similar al PDF.
-   **Estatus de Pago:** Muestra historial de pagos si los hay.
-   **Timeline:** Registro de acciones (creada, enviada, vista, pagada).

## 5. Acciones Específicas

### Ver PDF
-   Generación dinámica del PDF de la factura usando `react-pdf` o similar.
-   Debe incluir: Logo empresa, datos fiscales empresa y cliente, desglose de líneas, totales.

### Enviar por Email
-   Modal con plantilla de correo predefinida.
-   Campos editables: Destinatario (email cliente), Asunto, Cuerpo.
-   Adjunto: PDF de la factura generado automáticamente.
-   Botón "Enviar": Envía correo mediante proveedor configurado (Resend, SendGrid).

### Duplicar Factura
-   Crea una **nueva** factura copiando: Cliente, Líneas, Notas.
-   Asigna **nuevo** número consecutivo y fecha actual.
-   Estado inicial: Borrador/Pendiente.

### Rectificar Factura (Abono)
-   Crea una factura rectificativa vinculada a la original.
-   Importes en negativo.
-   Serie específica de rectificativas (e.g., R2024-...).
-   Estado inicial: Pagada (generalmente se compensa) o Pendiente de devolución.

### Eliminar Factura
-   **Soft Delete:** Marca la factura como eliminada sin borrar el registro de BD (auditabilidad).
-   Solo permitido si no tiene pagos asociados o si es la última de la serie (para evitar huecos).

## Verificación

### Pruebas Manuales
-   [ ] Crear factura completa -> Verificar cálculos de totales e IVA.
-   [ ] Editar factura -> Confirmar cambios guardados.
-   [ ] Duplicar factura -> Verificar nueva numeración y datos copiados.
-   [ ] Generar PDF -> Verificar diseño y datos.
-   [ ] Eliminar factura (con permiso) -> Verificar desaparición del listado activo.
