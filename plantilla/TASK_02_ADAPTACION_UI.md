# TASK 02: Adaptación UI Single-Empresa

## Objetivo
Asegurar que clientes limitados a operaciones de 1 empresa (como FNAUTOS) tengan una UI limpia sin selectores o menús confusos de gestión multi-empresa.

## Checklist
- [x] Definir campo de configuración `multiEmpresa: false` dentro del config del cliente en `/config/clients/`.
- [x] Modificar componente `EmpresaSelector` (Navbar/Header) para ocultarse si es false.
- [x] Modificar componente `Sidebar` para mostrar logotipo/nombre fijo sin dropdown si es single-empresa.
- [x] Redireccionar tráfico de la ruta `/configuracion/empresas` (listado) a `/ventas/configuracion/empresa` (detalle) para single-empresa.
- [ ] **QA Senior:** Pruebas de regresión manual. Validar que las APIs dependan correctamente del ID de la empresa en sesión y que los enlaces de redirección funcionen sin bucles.
