# Especificación de Ventas - Clientes

## Resumen
Gestión integral de la base de datos de clientes, incluyendo información fiscal, de contacto y configuración de facturación.

## 1. Listado de Clientes

### Vistas
-   **Tabla:** Lista paginada con columnas clave.
-   **Tarjetas:** Vista de cuadrícula con información resumida (nombre, teléfono, email).

### Filtros
-   **Búsqueda:** Por nombre, NIF/CIF, email o teléfono.
-   **Estado:** Activos vs Inactivos.

### Columnas de la Tabla
-   **Nombre:** Nombre fiscal o comercial.
-   **NIF/CIF:** Identificador fiscal.
-   **Email:** Correo principal de contacto.
-   **Teléfono:** Número de teléfono principal.
-   **Dirección:** Ciudad o dirección corta.
-   **Saldo Pendiente:** Suma de facturas no pagadas (visualización opcional/avanzada).
-   **Acciones:** Ver detalle, Editar, Eliminar/Archivar.

## 2. Creación/Edición de Cliente

### Formulario
#### Datos Fiscales
-   **Nombre Fiscal:** Requerido.
-   **NIF/CIF:** Requerido, con validación de formato según país.
-   **Dirección:** Calle, Número, Piso, etc.
-   **Código Postal:** Validación numérica.
-   **Ciudad:** Texto.
-   **Provincia:** Selector o texto.
-   **País:** Selector de país (default: España).

#### Datos de Contacto
-   **Email:** Para envío de facturas.
-   **Teléfono:** Contacto telefónico.
-   **Persona de Contacto:** Nombre de la persona responsable.
-   **Web:** URL del sitio web (opcional).

#### Configuración de Facturación
-   **Días de Vencimiento:** Número de días para calcular fecha de vencimiento por defecto (e.g., 30, 60).
-   **Método de Pago Preferido:** Transferencia, domiciliación, etc.
-   **IBAN:** Para remesas bancarias (si aplica).
-   **Notas Internas:** Observaciones sobre el cliente no visibles en facturas.

### Validaciones
-   NIF/CIF único en el sistema (advertencia si duplicado).
-   Email con formato válido.

## 3. Detalle de Cliente

### Dashboard del Cliente
-   **Resumen:** Tarjetas con Total Facturado (Año), Total Pendiente, Última Factura.
-   **Datos:** Visualización limpia de toda la información del cliente.
-   **Historial de Facturas:** Tabla filtrada mostrando solo las facturas de este cliente.
-   **Gráfico:** Evolución de facturación últimos 12 meses.

## 4. Acciones

### Eliminar Cliente
-   **Restricción:** No se puede eliminar un cliente si tiene facturas asociadas. En su lugar, se ofrece "Archivar" o "Desactivar".
-   **Confirmación:** Modal de advertencia antes de borrar.

## Verificación

### Pruebas Manuales
-   [ ] Crear nuevo cliente con todos los datos -> Verificar guardado correcto.
-   [ ] Intentar crear cliente con NIF duplicado -> Verificar aviso.
-   [ ] Editar cliente existente -> Cambios reflejados en listado y detalle.
-   [ ] Verificar que el cliente aparece en el selector al crear una factura.
-   [ ] Verificar historial de facturas en la ficha del cliente.
