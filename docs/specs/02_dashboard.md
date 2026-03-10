# Especificación del Dashboard Principal

## Resumen
El Dashboard es el centro de control principal de STVLS-ERP. Proporciona una visión general instantánea del estado de la empresa con métricas clave y acceso rápido a las funciones más utilizadas.

## 1. Diseño General (Layout)

### Estructura
-   **Sidebar:** Navegación lateral persistente con enlaces a todos los módulos principales (Ventas, Gastos, RRHH, Flota, Tesorería, Operaciones, Informes, Configuración).
-   **Header:** Barra superior con título de la página actual, búsqueda global, notificaciones y perfil de usuario.
-   **Content Area:** Área principal dinámica donde se carga el contenido de cada módulo.

## 2. Tarjetas KPI (Indicadores Clave de Rendimiento)

### Métricas Visualizables
-   **Total Ingresos (Mes Actual):** Suma de facturas emitidas en el mes actual. Comparativa con el mes anterior.
-   **Total Gastos (Mes Actual):** Suma de gastos registrados en el mes actual. Comparativa con el mes anterior.
-   **Facturas Pendientes:** Número y monto total de facturas emitidas pero no cobradas (vencidas y no vencidas).
-   **Número de Clientes Activos:** Conteo de clientes con al menos una factura en el último año.
-   **Flujo de Caja:** Gráfico de línea o barras mostrando ingresos vs. gastos mes a mes.

### Interactividad
-   Hacer clic en una tarjeta KPI redirige al módulo correspondiente (e.g., clic en "Facturas Pendientes" lleva a `/ventas/facturas?estado=pendiente`).
-   [ ] Implementar filtrado de rango de fechas para los KPIs.

## 3. Actividad Reciente

### Lista de Eventos
-   Muestra las últimas 5-10 acciones importantes realizadas en el sistema.
-   **Tipos de Eventos:**
    -   Nueva factura creada.
    -   Pago registrado.
    -   Nuevo cliente añadido.
    -   Nuevo empleado registrado.
-   **Formato:** [Icono] [Descripción Breve] [Usuario] [Hace X tiempo].

## 4. Accesos Directos

### Botones de Acción Rápida
-   "Nueva Factura" -> `/ventas/facturas/nueva`
-   "Registrar Gasto" -> `/gastos/nuevo` (si existe)
-   "Nuevo Cliente" -> `/ventas/clientes/nuevo`

## Verificación

### Pruebas Manuales
-   [ ] Verificar que la barra lateral colapsa y expande correctamente en móviles.
-   [ ] Confirmar que los enlaces de navegación llevan a las rutas correctas.
-   [ ] Comprobar que los KPIs se actualizan al crear una nueva factura o gasto.
-   [ ] Verificar que el gráfico de flujo de caja se renderiza correctamente.
