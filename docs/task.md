# Lista de Tareas Actualizada

- [x] Corregir error "Empresa no encontrada"
    - [x] Verificar políticas RLS
    - [x] Corregir permisos de `adminClient` (GRANTS añadidos)
    - [x] Reemplazar `adminClient` con `supabase` (autenticado) en las páginas
- [x] Corregir Error 500 en Creación de Clientes
    - [x] Implementar manejo robusto de errores de Zod en Server Actions
- [x] Solucionar Numeración de Facturas
    - [x] Crear función de base de datos `asignar_numero_factura`
    - [x] Crear trigger `trigger_asignar_numero_factura`
    - [x] Verificar incremento automático en `series_facturacion`
- [x] Mejora de Interfaz Premium (Premium UI)
    - [x] Crear variante de botón "Premium" con degradados y sombras
    - [x] Aplicar estilo premium a acciones principales
- [x] Corrección de Tipado TypeScript
    - [x] Consolidar interfaces de `Cliente`
    - [x] Corregir tipos en el generador de PDF
- [x] Verificación de KPIs en Dashboard
    - [x] Confirmar que las nuevas facturas impactan en las métricas
