# Especificación de Operaciones

## Resumen
Módulo central para la planificación y seguimiento de los servicios de transporte y logística.

## 1. Listado de Órdenes de Servicio

### Vistas
-   **Tabla:** Fecha, Cliente, Ruta, Conductor, Vehículo, Estado.
-   **Calendario:** Vista mensual/semanal de servicios planificados.
-   **Kanban:** Tablero visual por estados (Pendiente, En curso, Realizado, Incidencia).

### Filtros
-   **Búsqueda:** Cliente, Conductor, Vehículo.
-   **Estado:** Planificado, En curso, Finalizado.

## 2. Nueva Orden de Servicio

### Datos
-   **Cliente:** Vinculación a ficha de cliente.
-   **Fecha/Hora Inicio:** Planificada.
-   **Fecha/Hora Fin:** Estimada.
-   **Ruta/Direcciones:** Origen y Destino (integración con Google Maps futura).
-   **Mercancía:** Descripción de la carga, peso, volumen.

### Asignación de Recursos
-   **Vehículo:** Selección de flota disponible (verificar disponibilidad).
-   **Conductor:** Selección de empleado disponible (verificar disponibilidad).
-   **Gastos Previstos:** Peajes, dietas, combustible estimado.

## 3. Seguimiento

### Estados del Servicio
-   **Pendiente:** Creado pero no iniciado.
-   **En Curso:** Conductor ha iniciado la ruta.
-   **Incidencia:** Problema reportado (retraso, avería).
-   **Finalizado:** Servicio completado y listo para facturar.
-   **Facturado:** Ya procesado por administración.

### Documentación
-   **Albarán de Entrega:** Firmado digitalmente por el cliente (futuro).
-   **CMR:** Carta de porte (futuro).

## Verificación

### Pruebas Manuales
-   [ ] Crear orden de servicio -> Verificar en calendario.
-   [ ] Asignar vehículo ocupado -> Verificar advertencia.
-   [ ] Finalizar servicio -> Verificar disponibilidad para facturar.
-   [ ] Generar albarán PDF.
