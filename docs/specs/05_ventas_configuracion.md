# Especificación de Ventas - Configuración

## Resumen
Configuración centralizada de parámetros esenciales para el ciclo de facturación y gestión de usuarios en el módulo de Ventas.

## 1. Configuración de Empresa

### Datos
-   **Logotipo:** Subida de imagen para encabezado de facturas.
-   **Nombre Comercial:** Razón social.
-   **NIF:** Identificador fiscal.
-   **Dirección:** Sede principal.
-   **Teléfono y Email:** Contacto administrativo.
-   **Registro Mercantil (Opcional):** Datos registrales.
-   **Pie de Página (Opcional):** Texto legal o informativo.

### Acciones
-   Guardar cambios -> Actualización instantánea en futuras facturas.

## 2. Gestión de Conceptos de Facturación

### Definición
-   Lista de items o servicios estándar que se facturan recurrentemente.
-   Predefinir: Nombre, Precio Unitario, IVA, Descripción Corta.

### Acciones
-   Crear Nuevo Concepto.
-   Editar Concepto Existente.
-   Eliminar Concepto (si no está en uso).
-   Listado de Conceptos.

## 3. Series de Facturación

### Definición
-   Secuencias numéricas para facturas (e.g., F2024, REF-2024, R2024).

### Configuración
-   **Nombre:** Identificador interno (e.g., "Serie General", "Serie Rectificativa").
-   **Prefijo:** Texto fijo al inicio (e.g., "F-").
-   **Sufijo:** Texto fijo al final (e.g., "-24").
-   **Próximo Número:** Contador actual y editable.
-   **Por defecto:** Marcar una serie como predeterminada.

### Validaciones
-   No permitir dos series activas con el mismo prefijo en el mismo año.

## 4. Gestión de Usuarios y Roles

### Roles
-   **Administrador:** Acceso total a Ventas + Configuración.
-   **Ventas:** Crear/Editar facturas y clientes.
-   **Visor:** Solo lectura de facturas e informes.

### Listado de Usuarios
-   Nombre, Email, Rol, Estado (Activo/Inactivo).
-   Invitar Nuevo Usuario por Email.
-   Editar Rol / Desactivar Usuario.

## 5. Plantillas de Correo y Documentos

### Correos
-   Plantilla de "Envío de Factura".
-   Plantilla de "Recordatorio de Pago".
-   Variables dinámicas: `{Cliente}`, `{FacturaNumero}`, `{Fecha}`, `{Monto}`.

### PDF (Opciones básicas)
-   Color primario del PDF (para coincidir con marca).
-   Mostrar/Ocultar pie de página.
-   Tamaño de fuente (Normal, Grande).

## Verificación

### Pruebas Manuales
-   [ ] Cambiar logo de empresa -> Verificar en nueva factura.
-   [ ] Crear nuevo concepto -> Verificar autocompletado en factura.
-   [ ] Crear nueva serie -> Verificar numeración consecutiva.
-   [ ] Editar plantilla de correo -> Verificar envío de email con plantilla modificada.
