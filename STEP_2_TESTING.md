# Guía de Pruebas Manuales - Paso 2: Dashboard y Navegación

En este paso verificaremos que el Dashboard carga correctamente y que la navegación entre módulos es fluida.

## Pasos de la Prueba

### 1. Verificación de Datos en el Dashboard
1. Asegúrate de haber iniciado sesión y estar en la ruta `/dashboard`.
2. Observa las tarjetas superiores (KPIs):
   - **Facturación Mensual**
   - **Nº Facturas**
   - **Ticket Medio**
   - **Días Cobro**
3. **Verificación**: 
   - Los números deben ser visibles (pueden ser 0,00€ si no hay datos).
   - Verifica que el diseño sea premium (bordes suaves, sombras, efectos hover).
   - Si los datos tardan un poco en cargar, deberías ver un estado de carga o aparecer gradualmente.

### 2. Navegación Lateral (Sidebar)
1. Haz clic en **"Ventas"** en el menú de la izquierda.
2. **Verificación**: El menú debería desplegarse mostrando: Facturas, Clientes, Pagos e Informes.
3. Haz clic en cada uno de ellos.
4. **Verificación**: 
   - La URL del navegador debe cambiar (ej: `/ventas/facturas`).
   - El contenido principal de la página debe actualizarse.
   - El sidebar corporativo debe mantenerse fijo a la izquierda (en desktop).

### 3. Barra Superior (Navbar) y Tema
1. Haz clic en el icono de **Luna/Sol** en la barra superior.
2. **Verificación**: El modo oscuro/claro debe cambiar instantáneamente en toda la aplicación.
3. Observa las notificaciones (campana). Debería tener un punto rojo indicando actividad.

### 4. Selector de Empresa (Crítico)
1. En la barra superior, haz clic en el selector de empresa (donde aparece el nombre de tu empresa o "Visión Global").
2. Se abrirá un menú desplegable con tus organizaciones.
3. Intenta cambiar a otra empresa o a "Visión Global" (si eres administrador).
4. **Verificación**: 
   - Debería aparecer un diálogo de confirmación (**ConfirmDialog**) preguntándote si deseas cambiar de entorno.
   - Tras confirmar, la página debería recargarse.
   - Verifica que el nombre de la empresa en el selector se haya actualizado.

---
**Siguiente paso sugerido**: Una vez verificada la navegación, el Paso 3 será la **Gestión de Clientes** (Crear, editar y listar clientes).
