---
name: responsive-plan-executor
description: Ejecuta el plan de mejoras responsive del proyecto STVLS ERP siguiendo docs/RESPONSIVE_MEJORAS_PLAN.md. Usar cuando el usuario dé su aprobación para implementar el plan responsive (mejoras móvil/tablet/desktop, márgenes, tablas, botones, gráficos, login a configuración).
---

# Ejecutor del plan responsive – STVLS ERP

Cuando el usuario **apruebe** ejecutar el plan de mejoras responsive, sigue este skill.

## Referencia

- **Plan completo:** `docs/RESPONSIVE_MEJORAS_PLAN.md` (en la raíz del repo).  
  Contiene: inventario de páginas/componentes, tareas por sección, patrones, herramientas de testing y orden de implementación.

## Flujo de ejecución

1. **Leer el plan**  
   Abre `docs/RESPONSIVE_MEJORAS_PLAN.md` y usa las secciones 3 (inventario y tareas) y 6 (orden sugerido) como guía.

2. **Implementar en este orden** (según sección 6 del plan):
   - Global: `globals.css`, layout raíz (márgenes, overflow).
   - Layout dashboard: Navbar, Sheet menú móvil, `main` (padding, pb).
   - Login: auth layout, login page, login form.
   - Dashboard: cabecera, KPI cards, gráficos, cards estados/alertas/facturas recientes.
   - Facturas: filtros, tabla, nueva/editar, detalle, PDF, email.
   - Clientes, Pagos, Facturas vencidas: tablas y formularios con el mismo patrón.
   - Informes: grid y gráficos.
   - Configuración: empresas, series, conceptos, plantillas, usuarios.
   - UI base: Table, Card, Sheet, Dialog, botones en barras.
   - Playwright: proyectos por viewport y tests responsive.

3. **Por cada bloque:**
   - Resolver las tareas con checkbox `[ ]` de la sección correspondiente del plan.
   - Aplicar los **patrones** de la sección 4 (contenedores, cabeceras, tablas, formularios, cards, modales, botones, tipografía).
   - Stack: Next.js 16, Tailwind 4 (mobile-first, breakpoints sm/md/lg/xl), Radix UI, Recharts con ResponsiveContainer.

4. **No saltar pasos**  
   Si el usuario pide “solo login” o “solo tablas”, limita los cambios a esa parte pero usando los mismos patrones del plan.

5. **Testing**  
   Tras cambios relevantes, sugerir ejecutar la app y comprobar en viewports móvil/tablet/desktop (Chrome DevTools o Responsively App). Si se implementa la sección Playwright del plan, ejecutar `npm run test:e2e` con los nuevos proyectos.

## Patrones clave (resumen)

- Contenedores: `w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Cabeceras: `flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`; botones `w-full sm:w-auto` en móvil
- Tablas: contenedor `overflow-x-auto`; columnas secundarias `hidden md:table-cell` en móvil
- Formularios: `w-full max-w-* mx-auto px-4`; campos en columna
- Cards/grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`; cards con `min-w-0` donde haya texto largo
- Modales/Sheet: móvil `w-[95vw]` o similar; desktop `sm:max-w-md` / `max-w-lg`
- Touch: botones principales mínimo 44px de altura en móvil

## Confirmación

Solo ejecutar cuando el usuario indique explícitamente que aprueba o quiere que se implemente el plan responsive (por ejemplo: “adelante”, “ejecuta el plan”, “implementa las mejoras responsive”, “ya tienes mi aprobación”).
