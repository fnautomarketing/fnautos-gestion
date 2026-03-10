# Task 09: Mejoras de Interfaz y Series

## Objetivo
Optimizar la interfaz de usuario eliminando campos innecesarios, mejorar los filtros de búsqueda y configurar nuevas series de facturación.

## Requisitos Funcionales
1. **UI Facturas**:
   - **Eliminar** el campo 'Fecha de Vencimiento' visible en los formularios de Crear y Editar Factura.
   - La fecha de vencimiento se calculará automáticamente (ej: +30 días o mismo día, según configuración empresa/cliente) o se ocultará.
   - **Validación Visual**: Asegurar que el diseño no se rompe al quitar el campo.

2. **Filtros Avanzados**:
   - En el listado de facturas (`/ventas/facturas`), añadir selectores para:
     - **Mes**: Enero, Febrero, etc.
     - **Año**: 2024, 2025, 2026.
     - **Empresa**: Filtrar por empresa específica (para Admin Global).

3. **Nueva Serie "FAC"**:
   - Crear una nueva serie de facturación con código "FAC" y nombre "Clientes".
   - Asignarla a la empresa correspondiente (o a todas si es general).

## Checklist de Implementación
- [ ] Frontend: Comentar/Eliminar `fechaVencimiento` en `editar-factura-form.tsx`.
- [ ] Frontend: Añadir componentes `Select` para Mes y Año en `facturas/page.tsx`.
- [ ] Backend: Adaptar `getFacturas` para filtrar por rango de fechas (mes/año).
- [ ] SQL: Insertar serie "FAC" en `series_facturacion`.
- [ ] Verificación: Confirmar que al crear factura ya no pide vencimiento y que los filtros funcionan correctamente.

## Plan de Pruebas (Chrome DevTools Expert)
- [ ] **Elements**: Inspeccionar el DOM para asegurar que el campo eliminado no deja residuos visuales.
- [ ] **Network**: Verificar que los filtros de Mes/Año envían los parámetros Query correctos (`?month=1&year=2024`).
- [ ] **Performance**: Medir el tiempo de renderizado de la tabla al aplicar filtros (debe ser < 200ms).
- [ ] **Layout Shifts**: Confirmar que los filtros no causan saltos de layout (CLS).
