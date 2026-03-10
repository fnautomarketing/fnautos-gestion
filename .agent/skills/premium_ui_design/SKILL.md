---
name: premium_ui_design
description: Skill para aplicar estándares de diseño UI premium, moderno y profesional.
---

# Premium UI Design Skill

Esta skill define los estándares obligatorios para cualquier implementación de interfaz de usuario en el proyecto STVLS-ERP. El objetivo es lograr una estética "Elite", profesional y altamente pulida.

## Reglas de Oro

1.  **Glassmorphism Obligatorio**:
    *   Usa siempre fondos translúcidos (`bg-white/70`, `dark:bg-slate-900/60`) con `backdrop-blur-xl` o superior para tarjetas y paneles flotantes.
    *   Bordes sutiles: `border-white/20` (light) y `border-white/10` (dark).

2.  **Interacciones y Feedback (Siempre)**:
    *   **Todo elemento interactivo debe tener estado Hover**: Botones, tarjetas, inputs.
    *   Usa `transition-all duration-300` por defecto.
    *   Escalas sutiles: `hover:scale-[1.02]` o `hover:-translate-y-1`.
    *   Sombras dinámicas: `hover:shadow-lg` o `hover:shadow-primary/20`.

3.  **Tipografía y Color**:
    *   Títulos importantes en **Serif** (si está configurada) o **Sans-Serif Bold/Black**.
    *   Acentos en **Dorado/Amarillo Premium** (`text-primary`, `bg-primary`) pero con gradientes sutiles si es posible.
    *   Modo Oscuro Profundo: Evita el negro puro (`#000`). Usa `slate-900` o `slate-950` enriquecido con azul/violeta muy sutil.

4.  **Documentación en Español**:
    *   Todo comentario de código (`//`, `/** */`) debe estar en **Español**.
    *   Nombres de variables en Inglés (estándar), pero explicación en Español.

## Checklist de Implementación UI

Antes de dar por terminada una tarea de UI, verifica:

- [ ] ¿Tiene el componente `backdrop-blur` si flota sobre contenido?
- [ ] ¿Tienen los botones y cards efectos `hover` visibles?
- [ ] ¿Hay micro-interacciones (iconos que se mueven, shines, etc.)?
- [ ] ¿Se usa `AnimatePresence` o transiciones CSS para elementos que aparecen/desaparecen?
- [ ] ¿Está el código comentado en Español explicando la lógica compleja?

## Snippets Comunes

### Card Premium
```tsx
<div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-primary/20">
  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
  {/* Content */}
</div>
```
