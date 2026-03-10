---
name: testing_strategy_master
description: Estándares de testing para asegurar la fiabilidad y estabilidad del ERP.
---

# Testing Strategy Master

## 1. Filosofía de Testing
- **Objetivo**: "Confianza en el despliegue". Cada test debe aportar valor y seguridad.
- **Jerarquía**:
    1. **Unitarios**: Lógica de negocio pura (utils, helpers).
    2. **Integración**: Componentes complejos (Formularios, Tablas con filtros).
    3. **E2E**: Flujos críticos de usuario (Login, Crear Factura).

## 2. Tecnologías
- **Runner**: Vitest (rápido, compatible con Vite/Next).
- **Component Workbench**: Testing Library (`@testing-library/react`).
- **E2E**: Playwright.

## 3. Reglas de Oro
1. **Mockear Side-Effects**: Nunca realizar llamadas reales a Supabase o APIs externas en tests unitarios/integración.
2. **Selectores Resilientes**: Usa `getByRole`, `getByLabelText` o `test-id` como último recurso. Evita selectores CSS frágiles.
3. **Happy Path & Edge Cases**: Testea el éxito, pero también el error y los estados de carga.
4. **Coverage**: Aspira a >80% en utilidades de negocio críticas.

## 4. Implementación
- Archivos de test junto al código: `componente.test.tsx` o `util.test.ts`.
- Setup global para mocks de Next.js y Supabase.
