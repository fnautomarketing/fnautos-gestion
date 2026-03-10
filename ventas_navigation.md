# Mapa de Navegación y Mejoras - Módulo de Ventas

## Estructura Actual del Sitio (Site Map)

El módulo de ventas se encuentra bajo la ruta base `/ventas` y cuenta con la siguiente estructura jerárquica:

### 1. Gestión de Clientes (`/ventas/clientes`)
- **Listado Principal**: `/ventas/clientes` (Tabla de clientes, búsqueda y filtros)
- **Creación**: `/ventas/clientes/nuevo` (Formulario de alta)
- **Detalle**: `/ventas/clientes/[id]` (Perfil del cliente, historial, estadísticas)
- **Edición**: `/ventas/clientes/[id]/editar` (Modificar datos del cliente)

### 2. Gestión de Facturas (`/ventas/facturas`)
- **Listado Principal**: `/ventas/facturas` (Tabla de facturas, filtros por estado/fecha)
- **Creación**: `/ventas/facturas/nueva` (Formulario de nueva factura)
- **Gestión Individual**: `/ventas/facturas/[id]` 
  - **Edición**: `/ventas/facturas/[id]/editar`
  - **Visualización/PDF**: `/ventas/facturas/[id]/pdf`
  - **Envío Email**: `/ventas/facturas/[id]/email`
  - **Gestión Pagos**: `/ventas/facturas/[id]/pago`

### 3. Tesorería y Cobros
- **Pagos Recibidos**: `/ventas/pagos` (Historial global de cobros)
  - **Registrar Pago**: `/ventas/pagos/registrar` (Ingreso manual sin factura previa o anticipo)
- **Facturas Vencidas**: `/ventas/facturas-vencidas` (Gestión de deuda y reclamaciones)

### 4. Informes y Analítica (`/ventas/informes`)
- **Dashboard**: `/ventas/informes` (KPIs, gráficos, exportación a Excel)

### 5. Configuración (`/ventas/configuracion`)
- **Catálogo de Conceptos**: `/ventas/configuracion/conceptos`
  - **Detalle/Edición**: `/ventas/configuracion/conceptos/[id]`
  - **Importación**: `/ventas/configuracion/conceptos/importar` (Carga masiva CSV)
  - **Creación**: `/ventas/configuracion/conceptos/nuevo`
- **Plantillas de Diseño**: `/ventas/configuracion/plantillas`
  - **Edición**: `/ventas/configuracion/plantillas/[id]`
  - **Creación**: `/ventas/configuracion/plantillas/nueva`
- **Series de Facturación**: `/ventas/configuracion/series`
  - **Edición**: `/ventas/configuracion/series/[id]`
  - **Creación**: `/ventas/configuracion/series/nueva`

---

## Propuestas de Mejora de Navegación (`RFC-Nav`)

### 1. Estandarización de Breadcrumbs (Migas de Pan)
Se detecta inconsistencia en la presencia de breadcrumbs. Se recomienda implementarlos globalmente en el layout de ventas para facilitar el retorno a niveles superiores.
- **Formato Sugerido**: `Inicio > Ventas > [Submódulo] > [Acción/Detalle]`
- **Ejemplo**: `Inicio > Ventas > Clientes > Cliente #123 > Editar`

### 2. Menú Contextual en Detalles
En las páginas de detalle (ej: Factura o Cliente), añadir una barra de herramientas o "Tab Bar" superior para navegar rápidamente entre sub-vistas sin volver atrás.
- **Para Factura (`/ventas/facturas/[id]`)**:
  - `[Vista General] | [Pagos] | [PDF] | [Emails] | [Historial]`
- **Para Cliente (`/ventas/clientes/[id]`)**:
  - `[Perfil] | [Facturas] | [Presupuestos] | [Estadísticas]`

### 3. Accesos Rápidos (Shortcuts)
Implementar un botón global de "Creación Rápida" (+) en el navbar o sidebar que permita:
- Nueva Factura
- Nuevo Cliente
- Registrar Pago
Esto reduce clics para las acciones más frecuentes.

### 4. Consistencia en Nomenclatura de URLs
- Actualmente existen `/nuevo` (masculino) y `/nueva` (femenino) dependiendo de la entidad.
- **Propuesta**: Mantener la concordancia gramatical es correcto en español, pero se podría estandarizar a `/crear` o `/alta` si se busca uniformidad técnica, aunque la semántica actual es amigable para el usuario.

### 5. Feedback Visual de Estado
En el Sidebar, asegurar que la sección activa esté resaltada no solo en el nivel principal (Ventas), sino en el sub-item específico (ej: Clientes vs Facturas) para que el usuario siempre sepa dónde está.
