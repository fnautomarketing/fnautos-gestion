# Task 06: Configuración de Empresa y Generación de PDF

## Objetivo
Validar las parametrizaciones del sistema y la exportación de documentos.

## Checklist

### 1. Configuración de Ventas (`/ventas/configuracion`)
- [ ] **Series**: Crear y editar series, marcar una como predeterminada.
- [ ] **Conceptos**: Añadir items recurrentes al catálogo.
- [ ] **Plantillas**: Seleccionar plantilla y ver la vista previa (si está implementada).

### 2. Generación de PDF
- [ ] Generar PDF desde el detalle de una factura.
- [ ] Verificar que el PDF incluye:
    - [ ] Logo de la empresa.
    - [ ] Datos fiscales correctos.
    - [ ] Símbolo de divisa correcto (€, $).
    - [ ] Desglose de IVA y base imponible.
    - [ ] Pie de página (banco, notas).

## Instrucciones para el Agente
1. Cambiar la serie predeterminada de la empresa.
2. Crear una factura y verificar que use la nueva serie.
3. Descargar el PDF de una factura en **USD** y verificar que los importes sean consistentes.
4. Reportar cualquier texto cortado o solapado en la generación del PDF.
