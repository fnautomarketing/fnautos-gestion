---
name: mobile_optimization_premium
description: Skill para asegurar una experiencia móvil premium, fluida y nativa.
---

# Mobile Optimization Premium Skill

Esta skill garantiza que la aplicación no solo sea "responsive", sino que se sienta como una app nativa premium en dispositivos móviles.

## Reglas de Optimización Móvil

1.  **Touch Targets (Objetivos Táctiles)**:
    *   Todo elemento interactivo (botones, iconos) debe tener un área de clic mínima de **44x44px**.
    *   Usa `p-3` o `h-10 w-10` como mínimo para botones de iconos.

2.  **Navegación Móvil**:
    *   **NO** uses la Sidebar de escritorio en móvil.
    *   Usa el componente `Sheet` (Drawer lateral) de shadcn/ui para menús.
    *   El botón de menú (Hamburger) debe estar siempre accesible en el Navbar (`sticky top-0`).

3.  **Inputs y Formularios**:
    *   Tamaño de fuente mínimo de **16px** en inputs para evitar que iOS haga zoom automático.
    *   Teclados correctos: Usa `type="email"`, `type="tel"`, `inputMode="numeric"` según corresponda.

4.  **Layout y Espaciado**:
    *   Evita el scroll horizontal no intencionado. `w-full` y `overflow-x-hidden` en el contenedor principal.
    *   Padding lateral seguro: `px-4` o `px-6` en contenedores principales.
    *   Cards en móvil: Stack vertical (`flex-col`), ocupando el ancho completo.

5.  **Gestos y Animaciones**:
    *   Las transiciones de apertura de menús deben ser suaves (`duration-300 ease-out`).
    *   Feedback visual inmediato al tocar (`active:scale-95`).

## Checklist de Verificación Móvil

- [ ] ¿Es fácil tocar los botones con el dedo gordo sin tocar otros por error?
- [ ] ¿El menú se abre suavemente con un Sheet?
- [ ] ¿Los inputs tienen tamaño de texto 16px+?
- [ ] ¿Se ve bien en una pantalla de 375px de ancho (iPhone SE/Mini)?
