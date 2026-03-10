# Guía de Pruebas Manuales - Paso 3: Gestión de Clientes

En este paso verificaremos el ciclo de vida de un cliente: creación, búsqueda, edición y validación.

## Pasos de la Prueba

### 1. Verificación de Listado Vacío/Existente
1. Navega a **Ventas > Clientes**.
2. **Verificación**: 
   - Deberías ver una tabla con los clientes existentes o un mensaje indicando que no hay datos.
   - Las tarjetas de estadísticas superiores deben reflejar el número total de clientes.

### 2. Creación de Nuevo Cliente (Éxito)
1. Haz clic en **"+ Nuevo Cliente"**.
2. Rellena los campos obligatorios:
   - **Nombre Fiscal**: `STV Test Client S.L.`
   - **CIF**: Usa uno válido (ej: `B12345678` - el sistema tiene validador de CIF).
   - **Email**: `test@cliente.com`
   - **Teléfono**: `912345678`
   - **Dirección**: `Calle Falsa 123`
   - **Código Postal**: `28001`
   - **Ciudad**: `Madrid`
3. Haz clic en **"Guardar Cliente"**.
4. **Verificación**: 
   - Deberías ver un toast de éxito.
   - Deberías ser redirigido al listado general.
   - Tu nuevo cliente debería aparecer en la tabla (puedes usar el buscador para encontrarlo).

### 3. Prueba de Validación (Fallo)
1. Intenta crear otro cliente pero deja el **CIF** vacío o con un formato incorrecto (ej: `ABC`).
2. Haz clic en **"Guardar Cliente"**.
3. **Verificación**: 
   - El sistema NO debe enviar el formulario.
   - Deberías ver un mensaje de error bajo el campo indicando "CIF/NIF no válido".

### 4. Edición de Datos
1. En la tabla de clientes, busca tu cliente de prueba y haz clic en el botón de **"Editar"** (icono de lápiz).
2. Cambia el teléfono o añade una nota interna.
3. Haz clic en **"Actualizar Cliente"**.
4. **Verificación**: Los cambios deben guardarse correctamente y reflejarse en la tabla.

### 5. Filtrado y Búsqueda
1. En el listado de clientes, usa la barra de búsqueda para buscar por nombre o CIF.
2. **Verificación**: La tabla debe filtrarse en tiempo real o al presionar Enter.

---
**Siguiente paso sugerido**: Una vez dominada la gestión de clientes, el Paso 4 será la **Creación de Facturas**, vinculando los clientes ya creados.
