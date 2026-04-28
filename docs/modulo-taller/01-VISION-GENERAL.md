# 01 — Visión General y Arquitectura del Módulo Taller

## 1.1 Objetivo

Crear un sistema de gestión de taller mecánico **de nivel profesional** integrado en el ERP FNAUTOS, al nivel de las soluciones líderes del sector (Norauto, Feu Vert, Tekmetric, Shopmonkey). El módulo debe cubrir el ciclo de vida completo de una reparación:

**Recepción del vehículo → Presupuesto → Aprobación → Asignación a mecánico → Reparación → Control de calidad → Facturación → Notificación al cliente → Entrega**

---

## 1.2 Alcance Funcional

### Funcionalidades Core

| Funcionalidad | Descripción |
|---------------|-------------|
| **Sistema de Doble Emisor Fiscal** | Dos NIF/NIE diferentes para facturación: uno para vehículos (existente) y otro para taller. Ambos configurables desde Configuración → Empresa |
| **Órdenes de Reparación (OR)** | Documento central que agrupa todo: vehículo, cliente, tareas, piezas, tiempos, estado |
| **Presupuesto Previo** | Documento legal obligatorio (RD 1457/1986) con validez 12 días hábiles |
| **Resguardo de Depósito** | Documento de custodia del vehículo, generado automáticamente al recibir el coche |
| **Panel del Mecánico** | Vista tipo Kanban optimizada para móvil/tablet con tareas asignadas, check de completado |
| **Facturación de Taller** | Factura específica de taller con desglose de mano de obra, piezas, IVA |
| **Notificaciones por Email** | Vehículo recibido, presupuesto listo, vehículo en reparación, coche listo para recoger |
| **Historial de Servicio** | Historial completo de reparaciones por vehículo y por cliente |
| **Registro de Pagos** | Método de pago (tarjeta, efectivo, transferencia), estado, devoluciones |

### Funcionalidades Premium (Diferenciadores)

| Funcionalidad | Descripción |
|---------------|-------------|
| **Inspección Digital del Vehículo (DVI)** | Checklist de recepción con fotos del estado del vehículo al entrar al taller |
| **Timeline en Tiempo Real** | El cliente podría ver el progreso de su reparación (futuro: portal cliente) |
| **Hoja de Trabajo Imprimible (PDF)** | El mecánico puede imprimir su hoja de trabajo o consultarla desde el móvil |
| **Detección de Averías Adicionales** | Smart workflow: si el mecánico detecta algo nuevo, notifica al gestor → nuevo presupuesto → aprobación cliente |
| **Control de Garantías** | Tracking automático de los 3 meses / 2.000 km de garantía legal por reparación |
| **Métricas y KPIs del Taller** | Tiempo medio de reparación, productividad por mecánico, facturación taller |

---

## 1.3 Sistema de Doble Emisor Fiscal

### Problema Actual
El ERP tiene un único emisor fiscal (tabla `empresas`) con un NIF para las facturas de vehículos. El cliente necesita un SEGUNDO emisor (otro autónomo) para las facturas del taller.

### Solución Propuesta

La tabla `empresas` actual se extiende para soportar un concepto de **"tipo de actividad"** o alternativamente, se crea un campo `emisor_taller` en la configuración:

```
┌─────────────────────────────────┐
│         CONFIGURACIÓN           │
├─────────────────────────────────┤
│                                 │
│  📋 Emisor Vehículos (actual)   │
│  ├── NIF: XXXXXXXXX            │
│  ├── Nombre: Jimmy A. Benitez  │
│  ├── Dirección: ...            │
│  └── Logo: ...                 │
│                                 │
│  🔧 Emisor Taller (nuevo)      │
│  ├── NIF: YYYYYYYYY            │
│  ├── Nombre: Otro Autónomo     │
│  ├── Dirección: ...            │
│  └── Logo: (puede ser el mismo)│
│                                 │
└─────────────────────────────────┘
```

### Implementación Técnica

Se añade un campo `tipo` a la tabla `empresas` con valores: `vehiculos` | `taller`, permitiendo:
- Que cada tipo tenga su propio NIF, razón social, dirección fiscal
- Que al crear una factura de taller, se use automáticamente el emisor tipo `taller`
- Que al crear una factura de vehículo, se use el emisor tipo `vehiculos` (comportamiento actual)
- Que ambos sean editables desde **Configuración → Empresa**

---

## 1.4 Arquitectura Técnica

### Stack Tecnológico (sin cambios respecto al ERP actual)

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16 + React + TailwindCSS + shadcn/ui |
| Backend | Next.js Server Actions + API Routes |
| Base de Datos | Supabase (PostgreSQL 17) con RLS |
| Email | Resend (ya integrado) |
| PDF | Generación server-side (sistema actual de facturas) |
| Autenticación | Supabase Auth (sistema actual) |

### Integración con el ERP Existente

El módulo de taller se integra como una **nueva sección paralela** en el dashboard, conviviendo con los módulos ya operativos:

```
src/app/(dashboard)/
├── dashboard/        ← Existente (se extiende con KPIs del taller)
├── ventas/           ← Existente
│   ├── facturas/
│   ├── contratos/
│   ├── clientes/
│   ├── pagos/
│   ├── informes/
│   └── configuracion/
│
├── taller/           ← NUEVO MÓDULO
│   ├── ordenes/          → Órdenes de reparación (CRUD + detalle)
│   ├── panel-mecanico/   → Vista Kanban para mecánicos
│   ├── presupuestos/     → Presupuestos previos
│   ├── facturas/         → Facturas del taller (misma tabla, filtrada por tipo)
│   ├── historial/        → Historial de servicio por vehículo
│   └── configuracion/    → Emisor taller, tarifas mano obra, servicios catálogo
│
├── flota/            ← Existente (ver nota sobre relación con taller)
├── gastos/           ← Existente
├── rrhh/             ← Existente
├── tesoreria/        ← Existente
├── operaciones/      ← Existente
├── informes/         ← Existente
├── asistente/        ← Existente
├── perfil/           ← Existente
└── configuracion/    ← Existente (se extiende con emisor del taller)
```

### Componentes Compartidos

Se reutilizan del ERP existente:
- **Clientes**: La misma tabla `clientes` (un cliente puede tener facturas de vehículos Y del taller)
- **Sistema de PDF**: Se extiende el generador actual con una plantilla específica para taller
- **Sistema de Email**: Se reutiliza Resend con nuevas plantillas (vehículo recibido, coche listo, etc.)
- **Sistema de Pagos**: Se reutiliza la tabla `pagos` vinculándola a facturas de taller
- **Sistema de Notificaciones**: Se extiende con nuevos tipos de notificación

### Relación con el Módulo de Flota

El ERP ya incluye un módulo `flota/` para gestión de vehículos en stock (venta). Los vehículos del taller son **diferentes**: son coches de clientes que traen a reparar, no vehículos en venta. Sin embargo, hay potencial de integración futura:

- Un vehículo vendido a través de `flota/` podría vincularse automáticamente a su historial de taller
- Las revisiones post-venta (garantía del concesionario) podrían gestionarse desde el taller

> ⚠️ **Para la Fase 1**: Los módulos son independientes. La integración flota↔taller se contempla como mejora futura.

---

## 1.6 Roles y Permisos del Módulo Taller

Ver detalle completo en [08-DECISIONES-ARQUITECTURA.md](./08-DECISIONES-ARQUITECTURA.md#da-03-roles-y-permisos-del-módulo-taller).

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **Admin** | Acceso total al ERP y al módulo taller | Todo |
| **Gestor Taller** | Gestiona órdenes, presupuestos, facturas, comunicación | Todo excepto configuración de empresa |
| **Mecánico** | Ejecuta tareas asignadas, reporta averías | Solo panel mecánico, sus tareas, fotos y notas |

---

## 1.7 Fases de Implementación

### Fase 1: Fundamentos (Semana 1-2)
- Migraciones: tablas `vehiculos`, `servicios_catalogo`, `piezas_catalogo`, `ordenes_reparacion` y dependientes
- `ALTER TABLE facturas` con campos adicionales para taller (DA-01)
- `ALTER TABLE perfiles` con `rol_taller` (DA-03)
- Sistema de doble emisor fiscal configurado
- CRUD de Órdenes de Reparación con buscador de matrícula (autocompletado desde `vehiculos`)
- Catálogo de servicios y tarifas
- Catálogo de piezas con control de stock
- **Tests E2E Fase 1 + verificación Chrome DevTools (responsive 375/768/1600px)**

### Fase 2: Flujo de Trabajo (Semana 2-3)
- Panel del Mecánico (Kanban con drag & drop entre columnas)
- Gestión de presupuestos previos + página pública de aceptación/rechazo
- Resguardo de depósito (PDF)
- Detección de averías adicionales con notificación al gestor
- **Editabilidad completa**: cambio de prioridad inline, reordenar con drag & drop, reasignar mecánicos
- **Tests E2E Fase 2 + verificación Chrome DevTools (Kanban en móvil, dropdowns)**

### Fase 3: Facturación y Documentación (Semana 3-4)
- Factura de taller (tipo=taller en tabla `facturas` existente)
- PDF con plantilla específica de taller (campos legales RD 1457/1986)
- Registro de pagos (reutiliza sistema existente)
- Edición inline de precios y cantidades con recálculo en tiempo real
- **Tests E2E Fase 3 + verificación Chrome DevTools (PDF generado, formularios)**

### Fase 4: Comunicación y Polish (Semana 4-5)
- 7 emails automáticos (5 base + recordatorio + presupuesto caducado)
- Historial de servicio por vehículo
- Dashboard/KPIs del taller (según DA-05)
- Optimización final: code splitting, virtualización, prefetch
- **Tests E2E completos (7 flujos) + Lighthouse audit ≥90**

---

## 1.8 Principios Técnicos Obligatorios

> Todo el código del módulo taller debe cumplir estos principios **sin excepción**.

### Optimización y Rendimiento

| Principio | Implementación |
|-----------|----------------|
| **Server Components por defecto** | Solo `'use client'` cuando sea estrictamente necesario |
| **Code splitting** | Cada ruta del taller es un chunk independiente |
| **Optimistic updates** | La UI se actualiza instantáneamente, sin esperar al servidor |
| **Debounce en búsquedas** | 300ms para matrícula, cliente, piezas |
| **Virtualización** | Listas de >50 items usan `react-virtual` |
| **Prefetch** | `<Link prefetch>` en rutas frecuentes del taller |
| **Skeleton loading** | Nunca pantalla en blanco. Siempre esqueletos animados |
| **Cache estratégico** | `revalidatePath` por ruta, nunca global |

### Código Limpio

| Principio | Implementación |
|-----------|----------------|
| **TypeScript strict** | Sin `any`, sin `@ts-ignore` |
| **ESLint clean** | Cero warnings, cero errores |
| **Queries específicas** | Siempre `SELECT campo1, campo2`, nunca `SELECT *` |
| **Componentes enfocados** | Máx. 200 líneas por componente. Si crece, extraer |
| **Naming consistente** | Español para datos de negocio, inglés para código técnico |
| **Sin hardcoding** | Constantes y tipos extraídos. Sin strings mágicos |

### Editabilidad (DA-06)

| Principio | Implementación |
|-----------|----------------|
| **Todo se puede editar** | Prioridad, estado, asignación, precios, cantidades — siempre editables |
| **Guardado automático** | Cambios inline con debounce 500ms. Sin botón "Guardar" para campos simples |
| **Drag & drop** | Para reordenar prioridades, tareas en Kanban, y piezas en orden |
| **Undo** | Toast con "Deshacer" durante 5 segundos para acciones reversibles |
| **Sin modales innecesarios** | Solo para acciones destructivas (cancelar, eliminar, anular) |

### Testing (Doc 09)

| Principio | Implementación |
|-----------|----------------|
| **Chrome DevTools obligatorio** | Verificar snapshot, screenshot, responsive y consola limpia en CADA pantalla |
| **E2E antes de merge** | Todos los flujos E2E deben pasar antes de dar por terminada una fase |
| **Lighthouse ≥90** | Auditoría de accessibility, best practices y SEO al finalizar cada fase |

Ver detalle completo en [09-PLAN-TESTING.md](./09-PLAN-TESTING.md).
