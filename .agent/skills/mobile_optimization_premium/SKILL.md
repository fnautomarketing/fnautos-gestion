---
name: mobile_optimization_premium
description: Skill para asegurar una experiencia móvil premium, fluida y nativa.
---

# Mobile Optimization Premium Skill

Esta skill garantiza que la aplicación no solo sea "responsive", sino que se sienta como una app nativa premium en dispositivos móviles.

## Reglas de Optimización Móvil

6.  **Optimización de Formularios (Input Mobility)**:
    - **Single Column Layout**: En pantallas pequeñas, los formularios DEBEN ser de una sola columna.
    - **Sticky Actions**: Botones "Guardar/Emitir" pegajosos en la parte inferior (`sticky bottom-0`) con fondo de cristal (`backdrop-blur`).
    - **Native Keyboards**: Usar `type="email"`, `type="tel"`, `type="number"` para activar el teclado adecuado.
    - **iOS Zoom Avoidance**: Asegurar `text-base` (16px) en inputs para evitar que iOS haga zoom automático al enfocar.

7.  **Listados Adaptativos (Card-based)**:
    - En móvil, transforma filas de tablas complejas en **Cards** apilables.
    - Agrupa acciones en un `DropdownMenu` con un objetivo táctil mínimo de 44px (`h-11 w-11`).

8.  **Filtros y Modales**:
    - Usa **Bottom Sheet** (side="bottom") para filtros en móvil.

9.  **Gráficos Responsivos**:
    - Ajusta el contenedor de gráficos a un `aspect` que evite la compresión vertical en pantallas < 640px.
    - Oculta leyendas complejas o simplifícalas para ahorro de espacio.

## Checklist de Verificación Premium (PWA-Ready)

- [ ] ¿Se puede crear una factura completa solo con el pulgar?
- [ ] ¿Los botones de acción principal están en la zona de fácil alcance?
- [ ] ¿Los gráficos son legibles en un iPhone SE?
- [ ] ¿Se evitan los tooltips que dependen de "hover" (usar clic para mostrar en móvil)?
- [ ] ¿La navegación entre pestañas es fluida y táctil?
