# 🧪 Plan de Testing Integral - Fase 2: Testing Visual y Funcional con Navegador

> **Objetivo**: Realizar un testing visual exhaustivo de toda la aplicación, verificando scroll, superposición de elementos, creando/editando/eliminando datos reales, y documentando todas las mejoras necesarias.

---

## 📋 Instrucciones para la IA

```
Ejecuta un testing VISUAL EXHAUSTIVO del ERP STVLS siguiendo este plan:

1. **PARA CADA PÁGINA**:
   - Navega a la página y espera carga completa
   - Captura screenshot inicial (viewport visible)
   - Haz SCROLL completo (de arriba a abajo)
   - Verifica que NINGÚN elemento se superpone con otro
   - Verifica que no hay componentes cortados o invisibles
   - Comprueba que header/sidebar no tapan contenido
   - Verifica responsive en diferentes tamaños

2. **PARA CADA FORMULARIO**:
   - Rellena con datos de prueba REALES
   - Guarda y verifica mensaje de éxito
   - Vuelve a la lista y confirma que aparece el registro
   - Edita el registro creado
   - Intenta eliminar y verifica confirmación

3. **PARA CADA INTERACCIÓN**:
   - Click en cada botón y verifica respuesta
   - Hover en elementos interactivos
   - Verifica modales de confirmación
   - Comprueba toasts de feedback

4. **TESTING DE PDFs**:
   - Genera PDF de factura
   - Verifica que todos los elementos están bien posicionados
   - Comprueba que no hay texto cortado
   - Verifica totales, cliente, líneas

5. **AL FINALIZAR**:
   - Genera improvements-fase2.md con:
     - Errores visuales encontrados
     - Problemas de UX
     - Mejoras recomendadas (modales, confirmaciones, etc.)
     - Screenshots de problemas y soluciones
```

---

## 🗂️ Checklist Visual por Página

### 1. Login (`/login`)
- [ ] Hero image carga correctamente
- [ ] Animaciones funcionan
- [ ] Formulario centrado verticalmente
- [ ] Responsive en móvil (hero oculto)
- [ ] Validación de campos funciona
- [ ] Error message visible si falla login
- [ ] Redirección correcta al dashboard

### 2. Dashboard (`/dashboard`)
- [ ] 4 KPI cards visibles sin superposición
- [ ] Scroll suave
- [ ] Botón "Nueva Factura" accesible
- [ ] Cards con hover effects funcionando
- [ ] No hay overlapping en responsive
- [ ] Header no tapa contenido al scroll

### 3. Facturas Lista (`/ventas/facturas`)
- [ ] Stats cards visibles
- [ ] Tabla carga sin errores
- [ ] Scroll horizontal si es necesario
- [ ] Filtros funcionan (estado, fecha, búsqueda)
- [ ] Paginación funciona
- [ ] Filas clickeables para ver detalle
- [ ] Botón "Nueva Factura" siempre visible

### 4. Nueva Factura (`/ventas/facturas/nueva`)

#### Scroll Test
- [ ] Scroll hasta abajo sin problemas
- [ ] Resumen económico siempre visible o accesible
- [ ] Botones de acción no tapados
- [ ] Footer no superpone contenido

#### Funcionalidad Completa
- [ ] Selector de cliente funciona
- [ ] Selector de serie disponible
- [ ] Selector de plantilla PDF
- [ ] **Selector de divisa** (EUR predeterminado)
- [ ] **Campo tipo de cambio aparece si no es EUR**
- [ ] Añadir línea funciona
- [ ] Eliminar línea funciona
- [ ] Cálculo de subtotal en tiempo real
- [ ] Aplicar descuento %
- [ ] Aplicar descuento €
- [ ] Cálculo IVA correcto
- [ ] Total actualiza dinámicamente
- [ ] Modal de confirmación antes de emitir
- [ ] Toast de éxito al guardar
- [ ] Redirección a lista

#### Datos de Prueba a Crear
```
Factura 1:
- Cliente: [Primer cliente de la lista]
- Divisa: EUR
- Líneas:
  - Servicio de transporte | 2 | 150€ | IVA 21%
  - Embalaje especial | 1 | 45€ | IVA 21%
- Descuento: 5%

Factura 2:
- Cliente: [Segundo cliente]
- Divisa: USD
- Tipo cambio: 1.08
- Líneas:
  - International shipping | 1 | 500$ | IVA 0%
```

### 5. Detalle Factura (`/ventas/facturas/[id]`)
- [ ] Datos de cabecera correctos
- [ ] Líneas mostradas correctamente
- [ ] Totales visibles
- [ ] Botón "Generar PDF" funciona
- [ ] Botón "Descargar PDF" funciona
- [ ] Historial de cambios visible
- [ ] Registrar pago funciona
- [ ] Crear rectificativa (si aplica)

### 6. PDF de Factura
- [ ] Logo de empresa correcto
- [ ] Datos fiscales empresa
- [ ] Datos cliente completos
- [ ] Número y serie de factura
- [ ] Fecha emisión/vencimiento
- [ ] Tabla de líneas bien formateada
- [ ] Columnas alineadas
- [ ] Subtotales correctos
- [ ] Descuento si aplica
- [ ] Base imponible
- [ ] Desglose IVA
- [ ] **Total en divisa correcta (€, $, £)**
- [ ] Notas/observaciones
- [ ] Pie de página con datos bancarios

### 7. Clientes Lista (`/ventas/clientes`)
- [ ] Grid/tabla de clientes
- [ ] Stats visibles
- [ ] Búsqueda funciona
- [ ] Filtro activos/inactivos
- [ ] Click en cliente abre detalle

### 8. Nuevo Cliente (`/ventas/clientes/nuevo`)
- [ ] Todos los campos visibles
- [ ] Validación CIF/NIF
- [ ] Scroll sin problemas
- [ ] Botón guardar accesible
- [ ] Mensaje éxito/error visible

### 9. Pagos (`/ventas/pagos`)
- [ ] Tabs funcionan (Todos, Pendientes, Cobrados, Vencidos)
- [ ] Stats correctas
- [ ] Tabla de pagos
- [ ] Filtros funcionan
- [ ] Registrar pago abre formulario

### 10. Configuración - Series (`/ventas/configuracion/series`)
- [ ] Grid de series
- [ ] Crear nueva serie
- [ ] Editar serie existente
- [ ] Marcar serie por defecto

### 11. Configuración - Plantillas (`/ventas/configuracion/plantillas`)
- [ ] Lista de plantillas
- [ ] Vista previa funciona
- [ ] Selector de colores
- [ ] Cambiar plantilla activa

### 12. Configuración - Conceptos (`/ventas/configuracion/conceptos`)
- [ ] Catálogo visible
- [ ] Crear nuevo concepto
- [ ] Editar concepto
- [ ] Eliminar concepto

---

## 🔍 Tests de UX Específicos

### Modales de Confirmación (verificar existencia)
- [ ] Confirmar antes de emitir factura
- [ ] Confirmar antes de eliminar línea
- [ ] Confirmar antes de eliminar cliente
- [ ] Confirmar antes de eliminar serie
- [ ] Confirmar cambio de empresa

### Feedback Visual
- [ ] Loading spinners en botones mientras procesan
- [ ] Toast de éxito (verde)
- [ ] Toast de error (rojo)
- [ ] Estados deshabilitados claros
- [ ] Hover states en botones

### Scroll y Layout
- [ ] Sidebar no tapa contenido
- [ ] Header fijo no superpone
- [ ] Content area tiene padding suficiente
- [ ] No hay scroll horizontal innecesario
- [ ] Footer no corta contenido

---

## 📊 Formato de Reporte

Para cada problema encontrado:

```markdown
### 🐛 Problema: [Título]
- **Página**: /ruta
- **Tipo**: Visual / UX / Funcional
- **Descripción**: Qué pasa
- **Screenshot**: [Si aplica, incluir ruta]
- **Severidad**: Alta / Media / Baja
- **Solución Propuesta**: Qué hacer
- **Estado**: 🔄 Pendiente / ✅ Corregido
```

---

## ✅ Entregables

Al finalizar Fase 2, generar:

1. **improvements-fase2.md** con:
   - Lista de todos los problemas visuales
   - Problemas de UX
   - Mejoras implementadas
   - Mejoras propuestas pendientes
   - Screenshots de antes/después

2. **Recomendaciones para Fase 3**:
   - Tests automatizados E2E con Playwright
   - Tests de carga
   - Tests multi-dispositivo

---

## 🚀 Comando para Ejecutar

```
Ejecuta el plan de testing Fase 2 (testing-plan-fase2.md):

1. Abre el navegador en localhost:3000
2. Haz login con credenciales válidas
3. Ve página por página siguiendo el checklist
4. En cada página:
   - Captura screenshot
   - Haz scroll completo
   - Verifica que no hay elementos superpuestos
   - Prueba cada botón e interacción
5. Crea facturas de prueba con datos reales
6. Genera y revisa PDFs
7. Prueba edición y eliminación
8. Documenta TODOS los problemas encontrados
9. Corrige los que puedas sobre la marcha
10. Al final genera improvements-fase2.md
```
