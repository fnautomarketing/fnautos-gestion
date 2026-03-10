# 🧪 Plan de Testing Integral - Fase 1: Testing Interno

> **Objetivo**: Realizar un testing completo de todas las páginas, funcionalidades, botones e interacciones del ERP, verificando la conexión con Supabase, lógica de negocio, frontend y backend.

---

## 📋 Instrucciones para la IA

```
Ejecuta un testing completo del ERP STVLS siguiendo este plan:

1. **PARA CADA PÁGINA** del sistema:
   - Navega a la página
   - Verifica que carga sin errores de TypeScript/compilación
   - Comprueba que los datos se cargan correctamente desde Supabase
   - Prueba CADA botón y funcionalidad interactiva
   - Registra cualquier error encontrado

2. **PARA CADA FORMULARIO**:
   - Prueba crear un registro con datos válidos
   - Prueba validaciones con datos inválidos
   - Verifica que los datos se guardan correctamente en Supabase
   - Comprueba que las relaciones (foreign keys) funcionan

3. **TESTING DE LÓGICA DE NEGOCIO**:
   - Verifica cálculos (totales, IVA, descuentos)
   - Comprueba estados y transiciones
   - Valida reglas de negocio (ej: no editar factura emitida)

4. **AL FINALIZAR**:
   - Genera un archivo improvements.md con:
     - Errores encontrados y su corrección
     - Mejoras aplicadas
     - Estado final de cada módulo
```

---

## 🗂️ Páginas y Funcionalidades a Testear

### 1. Dashboard (`/dashboard`)
- [ ] Carga inicial de estadísticas
- [ ] Widget de facturas recientes
- [ ] Widget de pagos pendientes
- [ ] Gráficos de ingresos
- [ ] Navegación a otras secciones

### 2. Facturas (`/ventas/facturas`)

#### Lista de Facturas
- [ ] Carga de tabla de facturas
- [ ] Filtros (estado, fecha, búsqueda)
- [ ] Paginación
- [ ] Ordenamiento
- [ ] Botón "Nueva Factura"

#### Crear Factura (`/ventas/facturas/nueva`)
- [ ] Selector de serie
- [ ] Selector de cliente
- [ ] Selector de plantilla PDF
- [ ] **Selector de divisa (EUR, USD, GBP)**
- [ ] **Campo tipo de cambio (cuando no es EUR)**
- [ ] Añadir líneas de factura
- [ ] Editar cantidades y precios
- [ ] Cálculo automático de subtotal
- [ ] Aplicar descuentos (% y €)
- [ ] Cálculo de IVA
- [ ] Cálculo de total
- [ ] Guardar como borrador
- [ ] Emitir factura

#### Editar Factura (`/ventas/facturas/[id]`)
- [ ] Carga de datos existentes
- [ ] Edición según estado (borrador vs emitida)
- [ ] Historial de cambios
- [ ] Generar PDF
- [ ] Descargar PDF
- [ ] Crear factura rectificativa
- [ ] Registrar pago

### 3. Clientes (`/ventas/clientes`)
- [ ] Lista de clientes
- [ ] Crear nuevo cliente
- [ ] Editar cliente existente
- [ ] Eliminar cliente
- [ ] Validación de CIF/NIF
- [ ] Datos de contacto
- [ ] Dirección de facturación

### 4. Pagos (`/pagos`)
- [ ] Lista de pagos
- [ ] Crear nuevo pago
- [ ] Vincular pago a factura
- [ ] Métodos de pago (transferencia, efectivo, etc.)
- [ ] Conciliación de pagos
- [ ] Estados de pago

### 5. Configuración

#### Empresa (`/configuracion/empresa`)
- [ ] Datos fiscales
- [ ] Subir logo
- [ ] Eliminar logo
- [ ] Configuración de IVA
- [ ] Datos bancarios

#### Series de Facturación (`/configuracion/series`)
- [ ] Lista de series
- [ ] Crear nueva serie
- [ ] Configurar numeración
- [ ] Serie por defecto

#### Plantillas PDF (`/configuracion/plantillas`)
- [ ] Lista de plantillas
- [ ] Crear/editar plantilla
- [ ] Personalizar colores
- [ ] Vista previa

#### Usuarios (`/configuracion/usuarios`)
- [ ] Lista de usuarios
- [ ] Invitar usuario
- [ ] Asignar roles
- [ ] Gestionar permisos

### 6. Informes (`/informes`)
- [ ] Informe de ventas
- [ ] Informe de clientes
- [ ] Exportar a Excel
- [ ] Filtros por fecha

---

## 🔍 Verificaciones de Supabase

### Tablas a Verificar
```sql
-- Verificar que existen y tienen datos correctos:
- empresas
- perfiles
- usuarios_empresas
- clientes
- facturas
- lineas_factura
- pagos
- series
- plantillas_pdf
- historial_cambios
```

### Políticas RLS
- [ ] Verificar que usuarios solo ven datos de su empresa
- [ ] Probar acceso con diferentes roles
- [ ] Verificar restricciones de escritura

### Índices de Rendimiento
- [ ] Verificar índices en facturas (empresa_id, fecha_emision, estado, cliente_id)
- [ ] Comprobar tiempos de carga

---

## 🧪 Casos de Prueba Específicos

### Caso 1: Flujo Completo de Factura
```
1. Crear cliente nuevo "Cliente Test S.L."
2. Crear factura para ese cliente
3. Añadir 3 líneas de productos
4. Aplicar descuento del 10%
5. Guardar como borrador
6. Editar y cambiar cantidad
7. Emitir factura
8. Registrar pago parcial
9. Registrar pago completo
10. Verificar estado "Pagada"
```

### Caso 2: Multi-Divisa
```
1. Crear factura en USD
2. Verificar campo tipo de cambio visible
3. Establecer tipo de cambio 1.08
4. Verificar que totales muestran símbolo $
5. Guardar y verificar en base de datos
```

### Caso 3: Multi-Empresa
```
1. Cambiar de empresa activa
2. Verificar que datos cambian
3. Crear factura en empresa B
4. Volver a empresa A
5. Verificar que factura NO aparece
```

### Caso 4: Validaciones
```
1. Intentar crear factura sin cliente → Error esperado
2. Intentar guardar línea con cantidad 0 → Error esperado
3. Intentar emitir sin líneas → Error esperado
4. Intentar editar factura emitida → Campos bloqueados
```

---

## 📊 Formato de Reporte de Errores

Para cada error encontrado, documentar:

```markdown
### ❌ Error: [Título descriptivo]
- **Página**: /ruta/de/la/pagina
- **Componente**: nombre-del-componente.tsx
- **Descripción**: Qué pasó
- **Error**: Mensaje de error exacto
- **Causa**: Por qué ocurrió
- **Solución**: Código/cambios aplicados
- **Estado**: ✅ Corregido / 🔄 Pendiente
```

---

## ✅ Checklist Final

Al terminar el testing, verificar:

- [ ] Todos los módulos probados
- [ ] TypeScript sin errores (`npx tsc --noEmit`)
- [ ] Linting pasado (`npm run lint`)
- [ ] Todas las correcciones aplicadas
- [ ] improvements.md generado con resumen

---

## 🚀 Comando para Ejecutar

Copia y pega esto para iniciar el testing:

```
Ejecuta el plan de testing de testing-plan-fase1.md:

1. Recorre CADA página listada en el plan
2. Prueba CADA funcionalidad y botón
3. Crea datos de prueba reales (facturas, clientes, pagos)
4. Verifica conexiones con Supabase
5. Corrige errores encontrados sobre la marcha
6. Al finalizar, genera improvements.md con:
   - Lista de errores encontrados
   - Correcciones aplicadas
   - Estado final de cada módulo
   - Recomendaciones para Fase 2 (testing con navegador)
```
