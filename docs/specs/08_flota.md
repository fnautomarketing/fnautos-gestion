# Especificación de Gestión de Flota

## Resumen
Módulo dedicado a la administración de vehículos de empresa, registro de matrículas, mantenimientos, ITV y asignación a empleados/rutas.

## 1. Listado de Vehículos

### Vistas
-   **Tabla:** Matrícula, Modelo, Marca, Tipo (Turismo, Furgoneta, Camión), Estado (Activo, Taller, Baja), Asignado A.
-   **Tarjetas:** Foto del vehículo, matrícula, estado y odómetro.

### Filtros
-   **Búsqueda:** Matrícula, Modelo, Asignado A.
-   **Estado:** Activos, En Taller, Baja.
-   **Tipo:** Filtrar por categoría de vehículo.

## 2. Ficha de Vehículo

### Datos Generales
-   **Matrícula:** Identificador único.
-   **Marca** y **Modelo**.
-   **Número de Bastidor (VIN).**
-   **Fecha de Matriculación.**
-   **Kilometraje Actual:** Campo editable con histórico.
-   **Tipo de Combustible:** Diésel, Gasolina, Híbrido, Eléctrico.
-   **Etiqueta Medioambiental:** B, C, ECO, 0.

### Asignación
-   **Conductor Principal:** Empleado responsable.
-   **Departamento:** A qué área pertenece el coste.

### Documentación
-   Permiso de Circulación.
-   Ficha Técnica.
-   Seguro (Compañía, Póliza, Vencimiento).
-   Tarjeta de Transporte (si aplica).

## 3. Mantenimiento y Reparaciones

### Registro de Intervenciones
-   **Tipo:** Revisión Periódica, Avería, ITV, Cambio Neumáticos.
-   **Fecha:** Día de la intervención.
-   **Taller:** Proveedor del servicio.
-   **Coste:** Importe total (vinculable a Gastos).
-   **Kilometraje:** Lectura al momento de la intervención.
-   **Descripción:** Detalle de trabajos realizados.
-   **Próxima Revisión:** Fecha o kilómetros estimados.

### Alertas
-   **Vencimiento ITV:** Aviso 30 días antes.
-   **Vencimiento Seguro:** Aviso 30 días antes.
-   **Próxima Revisión:** Aviso por km o fecha.

## Verificación

### Pruebas Manuales
-   [ ] Crear vehículo -> Confirmar datos guardados.
-   [ ] Registrar mantenimiento -> Verificar actualización de historial.
-   [ ] Asignar conductor -> Reflejar en listado.
-   [ ] Verificar alerta de vencimiento de seguro (simular fecha próxima).
