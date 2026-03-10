# Task 07: Facturas Externas y Gestión Documental

## Objetivo
Permitir el registro de facturas generadas fuera del sistema (Excel, Word, otros programas) para mantener una contabilidad unificada, subiendo el PDF original y respetando su numeración original STVLS.

## Requisitos Funcionales
1. **Modo "Factura Externa"**:
   - En el formulario de "Nueva Factura", añadir un switch o pestaña para "Factura Externa".
   - Al activar:
     - Mostrar un campo **"Número de Factura Manual"** (y ocultar campo "Serie").
     - **Validación**: Asegurar que no existe ya una factura con ese número para la misma empresa (opcional para evitar duplicados).
     - **Cálculo**: Se debe permitir introducir las líneas y totales manualmente para que sumen a la facturación global de los informes.

2. **Subida de PDF**:
   - Campo de subida de archivo (Drag & Drop) en el formulario de "Nueva Factura" y "Editar Factura".
   - Guardar archivo en Supabase Storage (bucket `comprobantes` o nuevo `facturas_externas`).
   - Vincular la URL del archivo al registro de la factura (columna `archivo_url` o similar).
   - **Visualización**: En el detalle de la factura, mostrar el PDF subido en lugar del generado por el sistema.

3. **Consecutivos**:
   - Verificar que al insertar una factura con `numero` manual, el trigger `asignar_numero_factura` **NO incremente** ninguna serie interna. (Validado: el trigger actual respeta números no nulos).

## Checklist de Implementación
- [ ] Crear Bucket `facturas-externas` en Supabase Storage con políticas RLS (Lectura/Escritura solo usuario autenticado).
- [ ] Modificar tabla `facturas`: añadir columna `archivo_url` (texto) y `es_externa` (boolean).
- [ ] Frontend: Componente `FileUpload` en `nueva-factura-form`.
- [ ] Logic Backend: Procesar el número manual en `crearFacturaAction`.
- [ ] Verificación: Crear factura externa "F-999" y confirmar que la serie "General" no salta de número.

## Plan de Pruebas (Chrome DevTools Expert)
- [ ] **Network**: Verificar la subida del archivo (Multipart request) y la velocidad de respuesta.
- [ ] **Console**: Comprobar que no hay errores de CORS al visualizar el PDF.
- [ ] **Lighthouse**: Verificar accesibilidad en el formulario de subida (etiquetas correctas para input file).
- [ ] **Mobile**: Probar la subida de archivos desde un dispositivo móvil simulado.
