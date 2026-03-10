# Guía de Pruebas: Restricción de Empresa y Plantillas PDF

Esta guía detalla cómo probar la última implementación realizada, que incluye la restricción de selección de empresa según el usuario y la asignación automática de plantillas PDF (Premium vs Estándar).

## 1. Resumen de la Implementación
- **Restricción de Empresa:** Si no eres "Visión Global" (Admin), el selector de empresa en "Nueva Factura" aparece bloqueado con tu empresa actual.
- **Plantilla Automática:**
  - **Villegas Logistics** → Selecciona automáticamente **"Plantilla Corporativa"** (Diseño Premium).
  - **Otras Empresas** → Selecciona automáticamente **"Plantilla Estándar"**.
- **Generación de PDF:** El sistema ahora detecta si la factura usa la "Plantilla Corporativa" y genera el PDF con el diseño Premium (logo, colores, etc.).

---

## 2. Pasos para Probar

### Prueba A: Restricción de Empresa y Plantilla por Defecto
1. Navega a **Ventas** > **Facturas**.
2. Haz clic en **Nueva Factura**.
3. **Verifica el Selector de Empresa:**
   - Debería mostrar tu empresa actual (ej. "Villegas Logistics").
   - Intenta cambiarla. **Debería estar deshabilitado** (grisáceo/bloqueado), a menos que tengas permisos de Admin Global.
4. **Verifica la Plantilla seleccionada:**
   - Mira el campo "Plantilla PDF".
   - Debería haberse seleccionado automáticamente **"Plantilla Corporativa"** (si eres Villegas Logistics).

### Prueba B: Generación de Factura y PDF Premium
1. Continúa en el formulario de "Nueva Factura".
2. Selecciona un cliente (ej. "Cliente Exitoso SL").
3. Añade una línea de concepto (ej. "Consultoría", Precio: 100).
4. Haz clic en **Emitir Factura** (o Guardar Borrador).
5. Una vez creada, entrarás en la vista de detalle de la factura.
6. Haz clic en el botón **Descargar PDF**.
7. **Verifica el PDF descargado:**
   - **Diseño:** Debe tener un encabezado más moderno, colores corporativos (posiblemente tonos dorados/oscuros si es la Premium definida en código) y el logo si está configurado.
   - **Nota:** Si usas la plantilla "Estándar", el diseño sería más simple y en blanco y negro/azul básico.

### Prueba C: (Opcional) Cambio Manual de Plantilla
1. Crea otra factura nueva.
2. Aunque se seleccione "Plantilla Corporativa" por defecto, cambia manualmente el selector a "Plantilla Básica" (o Estándar).
3. Emite la factura y descarga el PDF.
4. **Verifica:** El PDF debería tener el diseño estándar (más simple), confirmando que el sistema respeta tu elección.

---

## 3. Notas Adicionales
- Si ves que solo aparece un cliente en la lista, es porque la base de datos solo tiene ese cliente asociado a tu empresa actual.
