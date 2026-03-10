# TASK 03: Supabase & Semillas

## Objetivo
Definir el script estándar que un nuevo cliente necesita ejecutar en una instancia de Supabase fresca para empezar a facturar de inmediato con nuestro Template.

## Checklist
- [x] Revisión del historial en `supabase/migrations/` para comprobar compatibilidad nula.
- [x] Crear un seed maestro `/supabase/seed_fnautos.sql`:
  - Insert en tabla `empresas` (Razón social FNAUTOS, NIF genérico).
  - Insert en tabla `series_facturacion` (FNA2026).
  - Configuración base requerida (impuestos, preferencias PDF).
- [ ] **QA Senior:** Simulación local. Asegurar de que con las migraciones y este seed, el inicio de sesión es exitoso para el primer usuario sin dar error por "Empresa no encontrada" ni restricciones de Rol (RLS).
