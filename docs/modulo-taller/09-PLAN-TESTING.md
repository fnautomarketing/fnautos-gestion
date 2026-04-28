# 09 — Plan de Testing y QA

> Los tests son **primordiales**. Nada se da por terminado sin que los tests pasen al 100%.  
> Se usan **tres niveles de testing** + verificación visual con **Chrome DevTools**.

---

## 9.1 Estrategia General

| Nivel | Herramienta | Propósito |
|-------|-------------|-----------|
| **Tests E2E** | Playwright | Flujos completos de usuario reales |
| **Tests Visuales / Navegación** | Chrome DevTools MCP | Verificar que la UI se ve correcta: nada se solapa, nada queda oculto, dropdowns visibles, responsive correcto |
| **Tests de Integración** | Vitest + Supabase | Server Actions, funciones SQL, lógica de negocio |
| **Tests Unitarios** | Vitest | Validaciones, cálculos, transiciones de estado |

---

## 9.2 Tests Visuales con Chrome DevTools (OBLIGATORIO)

Después de cada feature implementada, se ejecuta una **verificación visual** usando las herramientas de Chrome DevTools MCP para confirmar que:

### Checklist visual por pantalla

| Verificación | Detalle |
|--------------|---------|
| **Nada se solapa** | Tomar snapshot de cada pantalla y verificar que todos los elementos son accesibles |
| **Dropdowns completos** | Abrir cada dropdown/select y verificar que las opciones no quedan cortadas ni ocultas detrás de otros elementos |
| **Modales visibles** | Abrir cada modal y verificar que se centra bien, no se sale de pantalla, y el overlay es correcto |
| **Scroll funcional** | En listas largas, verificar que el scroll funciona y no oculta elementos |
| **Botones clickeables** | Verificar que todos los botones tienen el `uid` correcto y responden al click |
| **Formularios completos** | Rellenar cada formulario con datos reales y verificar que se envía correctamente |
| **Responsive** | Verificar en viewport desktop (1600px), tablet (768px) y móvil (375px) |
| **Dark mode** | Si aplica, verificar que los colores son correctos en ambos modos |

### Proceso de verificación

```
Para CADA pantalla nueva del taller:

1. Navegar a la ruta con navigate_page
2. Tomar snapshot con take_snapshot → verificar que TODOS los elementos están presentes
3. Tomar screenshot → verificar visualmente que nada se solapa
4. Probar resize_page a 375px (móvil) → tomar screenshot → verificar responsive  
5. Probar resize_page a 768px (tablet) → tomar screenshot → verificar responsive
6. Abrir CADA dropdown → take_snapshot → verificar que las opciones son visibles
7. Click en CADA botón de acción → verificar que la acción se ejecuta
8. Rellenar formularios con fill_form → verificar envío correcto
9. Verificar list_console_messages → CERO errores en consola
10. Verificar list_network_requests → todas las peticiones devuelven 200/201
```

### Pantallas a verificar

| Pantalla | Ruta | Verificaciones especiales |
|----------|------|---------------------------|
| Lista de órdenes | `/taller/ordenes` | Filtros funcionan, badges de estado correctos, paginación |
| Nueva orden | `/taller/ordenes/nueva` | Buscador de cliente, formulario completo, fotos |
| Detalle de orden | `/taller/ordenes/[id]` | Tabs funcionan, tareas editables, drag & drop |
| Panel mecánico | `/taller/panel-mecanico` | Kanban responsive, drag entre columnas, checkboxes |
| Factura taller | `/taller/facturas/[id]` | PDF se genera, datos del emisor correcto |
| Configuración | `/taller/configuracion` | Doble emisor visible, catálogos funcionan |
| Presupuesto público | `/presupuesto/[token]` | Página pública, botones aceptar/rechazar, firma |

---

## 9.3 Tests E2E con Playwright

### Flujo 1: Ciclo completo de reparación

```typescript
test('ciclo completo: recepción → entrega', async ({ page }) => {
  // 1. Crear cliente (o seleccionar existente)
  // 2. Crear vehículo nuevo
  // 3. Crear orden de reparación
  // 4. Verificar número correlativo generado
  // 5. Añadir 3 tareas desde catálogo
  // 6. Añadir 2 piezas desde catálogo
  // 7. Generar presupuesto
  // 8. Enviar presupuesto (verificar email en log)
  // 9. Simular aceptación del presupuesto
  // 10. Asignar mecánico a cada tarea
  // 11. Marcar tareas como completadas una a una
  // 12. Pasar a revisión de calidad
  // 13. Aprobar QA
  // 14. Generar factura → verificar NIF del taller
  // 15. Registrar pago total
  // 16. Notificar coche listo
  // 17. Entregar vehículo
  // 18. Verificar garantía activada
  // 19. Verificar historial del vehículo tiene 1 entrada
});
```

### Flujo 2: Editabilidad total

```typescript
test('editabilidad: cambiar prioridad, reordenar, reasignar', async ({ page }) => {
  // 1. Crear 3 órdenes con prioridad: urgente, urgente, normal
  // 2. Verificar orden de aparición (urgentes primero)
  // 3. Cambiar la primera urgente a normal → verificar que baja
  // 4. Cambiar la normal a urgente → verificar que sube
  // 5. Con 2 urgentes: reordenar drag & drop → verificar nuevo orden
  // 6. Reasignar mecánico de una tarea → verificar cambio
  // 7. Editar precio de una tarea inline → verificar recálculo total
  // 8. Desmarcar tarea completada → verificar que vuelve a pendiente
  // 9. Editar cantidad de una pieza → verificar recálculo
  // 10. Cambiar estado de orden hacia atrás (QA → En Reparación)
});
```

### Flujo 3: Presupuesto rechazado

```typescript
test('presupuesto rechazado → vehículo devuelto', async ({ page }) => {
  // 1. Crear orden con presupuesto
  // 2. Enviar presupuesto
  // 3. Rechazar desde página pública
  // 4. Verificar estado = rechazado
  // 5. Verificar que NO se puede iniciar reparación
  // 6. Verificar que el vehículo puede devolverse
});
```

### Flujo 4: Avería adicional

```typescript
test('avería adicional detectada durante reparación', async ({ page }) => {
  // 1. Crear orden con presupuesto aceptado, en reparación
  // 2. Mecánico reporta avería adicional con descripción
  // 3. Verificar notificación al gestor
  // 4. Gestor crea nueva tarea + pieza
  // 5. Enviar actualización al cliente
  // 6. Cliente acepta → tarea aparece en panel mecánico
  // 7. Cliente rechaza → documentar y continuar solo con lo aprobado
});
```

### Flujo 5: Doble emisor fiscal

```typescript
test('doble emisor: NIF correcto en cada tipo de factura', async ({ page }) => {
  // 1. Configurar emisor vehículos NIF A
  // 2. Configurar emisor taller NIF B  
  // 3. Crear factura de vehículo → verificar NIF A en PDF
  // 4. Crear factura de taller → verificar NIF B en PDF
  // 5. Verificar informes separados por emisor
});
```

### Flujo 6: Panel del mecánico

```typescript
test('panel mecánico: solo ve sus tareas, no puede facturar', async ({ page }) => {
  // 1. Login como mecánico
  // 2. Verificar sidebar limitado (solo panel mecánico)
  // 3. Verificar Kanban muestra solo sus tareas
  // 4. Marcar tareas como completadas
  // 5. Intentar acceder a /taller/facturas → redirigido
  // 6. Intentar acceder a /taller/configuracion → redirigido
  // 7. Reportar avería → verificar que se registra
  // 8. Verificar drag & drop entre columnas Kanban
});
```

### Flujo 7: Cancelación de orden

```typescript
test('cancelación con facturación parcial', async ({ page }) => {
  // 1. Crear orden, aceptar presupuesto, asignar mecánico
  // 2. Completar 2 de 5 tareas
  // 3. Cancelar orden
  // 4. Verificar motivo de cancelación requerido
  // 5. Verificar factura parcial generada (solo 2 tareas + piezas usadas)
  // 6. Verificar estado = cancelado
  // 7. Verificar que no se puede reabrir
});
```

---

## 9.4 Tests de Integración

| Test | Qué verifica |
|------|-------------|
| `generar_numero_orden()` | Correlativos sin duplicados, incluso con concurrencia |
| `calcular_totales_orden()` | Mano de obra + piezas + IVA = total correcto con decimales |
| `activar_garantia()` | Fecha fin = entrega + 3 meses, km límite = km entrega + 2000 |
| `caducidad_presupuesto()` | Caduca tras 12 días hábiles (excluye fines de semana) |
| `RLS taller` | Mecánico NO ve órdenes donde no tiene tareas |
| `RLS empresa` | Usuario de empresa A NO ve datos de empresa B |
| `stock_piezas()` | Al usar piezas, stock se reduce. Alerta cuando < mínimo |
| `reordenar_prioridad()` | El campo `orden_prioridad` se persiste correctamente tras drag & drop |
| `cambiar_estado()` | Solo transiciones válidas permitidas. Transiciones inválidas rechazan con error |
| `doble_emisor()` | Factura tipo `vehiculo` usa emisor A, factura tipo `taller` usa emisor B |
| `reasignar_mecanico()` | Se actualiza la tarea, se crea evento en timeline, se notifica |

---

## 9.5 Tests Unitarios

| Módulo | Tests |
|--------|-------|
| **Schemas de validación** | Orden válida/inválida, presupuesto válido/inválido, tarea válida/inválida |
| **Cálculos económicos** | Total mano de obra, total piezas, base imponible, IVA, total con descuentos |
| **Transiciones de estado** | Verificar todas las transiciones válidas e inválidas del diagrama |
| **Garantía** | Fecha fin correcta (3 meses), km límite correcto (+2000) |
| **Número correlativo** | Formato correcto, incremento, reset por año |
| **Días hábiles** | Cálculo de 12 días hábiles excluyendo festivos |

---

## 9.6 Archivos de Test

```
tests/
├── e2e/
│   └── taller/
│       ├── ciclo-completo.spec.ts
│       ├── editabilidad.spec.ts
│       ├── presupuesto-rechazado.spec.ts
│       ├── averia-adicional.spec.ts
│       ├── doble-emisor.spec.ts
│       ├── panel-mecanico.spec.ts
│       └── cancelacion-orden.spec.ts
├── integration/
│   └── taller/
│       ├── numeros-correlativos.test.ts
│       ├── calculos-importes.test.ts
│       ├── garantias.test.ts
│       ├── caducidad-presupuesto.test.ts
│       ├── rls-taller.test.ts
│       ├── doble-emisor.test.ts
│       └── reordenar-prioridad.test.ts
└── unit/
    └── taller/
        ├── orden-schema.test.ts
        ├── presupuesto-schema.test.ts
        ├── calculos.test.ts
        ├── transiciones-estado.test.ts
        └── dias-habiles.test.ts
```

---

## 9.7 Criterios de Aceptación por Fase

### Fase 1: Fundamentos
- [ ] CRUD de órdenes funciona sin errores
- [ ] Tabla `vehiculos` funciona: crear, buscar, autocompletar por matrícula
- [ ] Doble emisor fiscal configurado y genera facturas con NIF correcto
- [ ] Catálogos de servicios y piezas permiten CRUD completo
- [ ] RLS impide acceso cruzado entre empresas
- [ ] **Chrome DevTools**: snapshot y screenshot de CADA pantalla verificados
- [ ] **Chrome DevTools**: CERO errores en consola en todas las pantallas
- [ ] **Chrome DevTools**: responsive verificado en 375px, 768px y 1600px

### Fase 2: Flujo de Trabajo
- [ ] Panel del mecánico muestra solo sus tareas (Kanban)
- [ ] Drag & drop funcional entre columnas y para reordenar
- [ ] Cambio de prioridad inline funcional
- [ ] Tareas se marcan/desmarcan con feedback visual
- [ ] Presupuesto se genera, envía, acepta/rechaza desde página pública
- [ ] Avería adicional genera notificación y nuevo sub-presupuesto
- [ ] **Chrome DevTools**: Kanban probado en móvil (375px) con tap en tarjetas
- [ ] **Chrome DevTools**: todos los dropdowns se abren completos

### Fase 3: Facturación
- [ ] Factura de taller se genera desde orden con datos del emisor correcto
- [ ] PDF contiene TODOS los campos legales (doc 06)
- [ ] Pago total y parcial funcional
- [ ] Serie FT con correlativos
- [ ] Edición inline de precios/cantidades recalcula en tiempo real
- [ ] **Chrome DevTools**: PDF descargable y previsualizable

### Fase 4: Comunicación y Polish
- [ ] 7 emails se envían correctamente (5 originales + recordatorio + caducado)
- [ ] Página pública de aceptación/rechazo funcional con firma digital
- [ ] Historial de servicio por vehículo completo
- [ ] KPIs del taller visibles y correctos
- [ ] Cancelación de orden con facturación parcial funcional
- [ ] **Tests E2E**: TODOS los 7 flujos pasan ✅
- [ ] **Chrome DevTools**: navegación completa sin errores de consola
- [ ] **Chrome DevTools**: rendimiento verificado (lighthouse audit)
- [ ] **Optimización**: code splitting, server components, virtual lists implementados

---

## 9.8 Principios de Calidad Obligatorios

| Principio | Regla |
|-----------|-------|
| **Cero errores en consola** | `list_console_messages` no debe devolver NINGÚN error ni warning |
| **Cero peticiones fallidas** | `list_network_requests` — todas 2xx |
| **Responsive perfecto** | Probado en 3 viewports: 375px, 768px, 1600px |
| **Accesibilidad** | Área táctil mínima 48px, fuentes ≥16px en móvil |
| **Performance** | Lighthouse audit ≥90 en accessibility, best practices, SEO |
| **Código limpio** | ESLint + TypeScript strict, sin `any`, sin warnings |
| **Optimistic updates** | La UI responde al instante, sin esperar al servidor |
| **Skeleton loading** | Nunca pantalla en blanco durante carga |
