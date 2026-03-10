# Plan de Implementación: Requisitos Fase 3 (WhatsApp)

## Objetivo
Implementar y probar visualmente las nuevas funcionalidades solicitadas: facturación externa con numeración manual, mejoras de UI, configuración de datos de empresa y revisión de pagos.

## Estructura de Tareas
Cada tarea incluye ahora un plan de pruebas específico utilizando "Chrome DevTools Expert".

### [TASK_07] Facturas Externas
- **Objetivo**: Permitir registrar facturas de otros sistemas con numeración manual y PDF adjunto.
- **Cambios**: Formulario con switch "Externa", campo de número manual, subida de archivo.
- **Testing**: Verificar subida de archivo (Network), validación de número y visualización del PDF.

### [TASK_08] Envío de Emails (Pendiente API Key)
- **Objetivo**: Preparar la funcionalidad de envío.
- **Cambios**: Modal de envío, integración con Resend (mock hasta tener key).
- **Testing**: Verificar apertura del modal y validación de campos.

### [TASK_09] UI y Filtros
- **Objetivo**: Optimizar la gestión diaria.
- **Cambios**: Ocultar vencimiento, añadir filtros de Mes/Año/Empresa, crear serie "FAC".
- **Testing**: Análisis de rendimiento de filtros y verificación de layout.

### [TASK_10] Configuración y Datos
- **Objetivo**: Reflejar la realidad fiscal de las empresas.
- **Cambios**: Datos reales, IRPF -1% (Edison), usuario `administracion`.
- **Testing**: Validar cálculos con IRPF negativo y permisos de usuario admin global.

### [TASK_11] Revisión de Pagos
- **Objetivo**: Asegurar la integridad financiera.
- **Cambios**: Auditoría y tests de flujo.
- **Testing**: Análisis del flujo de caja y estados.

## Estrategia de Testing (Chrome DevTools Expert)
Para cada tarea visual o funcional, se utilizarán las herramientas de desarrollo de Chrome para asegurar:
1.  **Network**: Tiempos de carga y payloads correctos.
2.  **Console**: Ausencia de errores y warnings.
3.  **Elements**: Correcta estructura DOM y accesibilidad básica.
4.  **Performance**: Fluidez en las interacciones.
