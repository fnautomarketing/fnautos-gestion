# 🔧 Módulo Taller FNAUTOS — Índice General

> **Versión**: 1.2  
> **Estado**: Especificación final — lista para desarrollo  
> **Fecha**: Abril 2026  
> **Última actualización**: 17/04/2026  
> **Decisiones arquitectónicas**: Todas aprobadas (DA-01 a DA-06)

---

## Prerrequisitos

Antes de iniciar el desarrollo del módulo taller, deben estar operativos y verificados los siguientes sistemas del ERP:

| Sistema | Estado requerido | Verificación |
|---------|------------------|--------------|
| **Supabase Auth** | Funcionando con roles de usuario | ✅ Existente |
| **Tabla `clientes`** | CRUD completo funcionando | ✅ Existente |
| **Sistema de PDF** | Generación server-side operativa | ✅ Existente |
| **Resend (Email)** | API configurada y enviando emails | ✅ Existente |
| **Sistema de Pagos** | Registro de pagos con FK a facturas | ✅ Existente |
| **Series de Facturación** | CRUD de series operativo | ✅ Existente |
| **RLS en Supabase** | Políticas por empresa activas | ✅ Existente |

---

## Documentos de Especificación

| # | Documento | Descripción |
|---|-----------|-------------|
| 01 | [Visión General y Arquitectura](./01-VISION-GENERAL.md) | Alcance del módulo, arquitectura técnica, integración con el ERP existente y sistema de doble emisor fiscal |
| 02 | [Base de Datos y Esquema](./02-BASE-DE-DATOS.md) | Diseño completo de tablas, relaciones, tipos y políticas RLS en Supabase |
| 03 | [Flujo de Trabajo y Ciclo de Vida](./03-FLUJO-DE-TRABAJO.md) | Workflows completos: recepción → diagnóstico → reparación → entrega, con diagramas de estado |
| 04 | [Cumplimiento Legal España](./04-CUMPLIMIENTO-LEGAL.md) | Real Decreto 1457/1986, VeriFactu, presupuesto previo, resguardo de depósito, garantías y derechos del consumidor |
| 05 | [Interfaz de Usuario y Páginas](./05-INTERFAZ-USUARIO.md) | Diseño de cada pantalla: panel mecánico, gestión de órdenes, facturación taller, notificaciones |
| 06 | [Factura de Taller — PDF](./06-FACTURA-TALLER-PDF.md) | Contenido legal obligatorio y recomendado del PDF de factura de taller, con ejemplo visual |
| 07 | [Notificaciones y Comunicación](./07-NOTIFICACIONES.md) | Emails automáticos, estados del vehículo, notificación "coche listo", integración con Resend |
| 08 | [Decisiones Arquitectónicas](./08-DECISIONES-ARQUITECTURA.md) | Decisiones técnicas clave: factura unificada vs separada, tabla de vehículos, roles y permisos |
| 09 | [Plan de Testing](./09-PLAN-TESTING.md) | Estrategia de testing E2E con Playwright, tests unitarios y plan de QA |

---

## Cómo usar esta documentación

1. **Lectura secuencial**: Los documentos están ordenados de lo general a lo específico
2. **Cada documento es autocontenido**: Puedes consultar cualquiera de forma independiente
3. **Los diagramas Mermaid** se renderizan en cualquier visor Markdown compatible (GitHub, VS Code, etc.)
4. **Documento 08 es OBLIGATORIO antes de desarrollar**: Contiene decisiones arquitectónicas que afectan a todo lo demás
5. **Aprobación**: Una vez revisados y aprobados, se procederá a la implementación fase por fase

---

## Changelog

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Abril 2026 | Especificación inicial completa (docs 01-07) |
| 1.1 | 17/04/2026 | Añadidos prerrequisitos, docs 08-09, changelog, mejoras en todos los documentos |
| 1.2 | 17/04/2026 | **Decisiones aprobadas**: DA-01 (facturas unificadas), DA-02 (tabla vehículos), DA-03 (roles), DA-04 (correlativos), DA-06 (editabilidad). Eliminada tabla `facturas_taller`. Integrada tabla `vehiculos`. Añadida editabilidad completa (drag & drop, inline edit, optimistic updates). Tests con Chrome DevTools obligatorios. Principios de optimización y código limpio. 7 emails. Página pública de aceptación de presupuesto |
