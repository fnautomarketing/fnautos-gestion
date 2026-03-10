# Especificación de Recursos Humanos (RRHH)

## Resumen
Módulo dedicado a la gestión centralizada de empleados, control horario, y documentación laboral.

## 1. Listado de Empleados

### Vistas
-   **Tabla:** Nombre, Cargo, Departamento, Estado (Activo/Baja), Contacto.
-   **Tarjetas:** Foto de perfil, nombre y cargo.

### Filtros
-   **Búsqueda:** Nombre, DNI/NIE.
-   **Departamento:** Operaciones, Ventas, Admin, etc.
-   **Estado:** Mostrar solo activos por defecto.

## 2. Ficha del Empleado

### Datos Personales
-   Nombre completo, DNI/NIE, Fecha Nacimiento.
-   Dirección postal.
-   Datos bancarios (IBAN para nóminas).
-   Contacto de emergencia.

### Datos Laborales
-   Cargo/Puesto.
-   Departamento.
-   Fecha de Alta.
-   Tipo de Contrato.
-   Salario Bruto Anual (visible solo para roles autorizados).
-   Coste Seguridad Social (visible solo para roles autorizados).

### Gestión Documental
-   Repositorio de contratos, nóminas, bajas médicas.
-   Subida de archivos PDF/Imagen.

## 3. Control Horario (Futuro / Básico)

### Registro de Jornada
-   Botón de "Fichar Entrada" y "Fichar Salida".
-   Registro de horas extras.
-   Calendario de vacaciones y ausencias.

## Verificación

### Pruebas Manuales
-   [ ] Crear nuevo empleado -> Verificar ficha creada correctamente.
-   [ ] Subir documento a perfil de empleado.
-   [ ] Fichar entrada/salida (si implementado) -> Verificar registro de tiempo.
-   [ ] Filtrar empleados por departamento.
