# TASK 01: Configuración & Branding

## Objetivo
Centralizar todos los colores, logos y textos estáticos de STVLS para que dependan de una configuración por cliente (ej: `fnautos.ts`).

## Checklist
- [x] Crear carpeta `/src/config/clients/` e `index.ts`
- [x] Crear config `fnautos.ts` y mover la marca STVLS a `stvls.ts`
- [x] Inyectar CSS variables dinámicamente o configurar Tailwind
- [x] Actualizar URLs de logos en login, navbar y reportes PDF
- [x] Limpiar textos "STV Logistics" del layout, metadata, login y correos
- [x] **QA Senior:** Revisar consistencia en colores, comprobando que ningún botón quede "hardcodeado" con clases `bg-blue-600` sin respetar la variable primaria del tema.
