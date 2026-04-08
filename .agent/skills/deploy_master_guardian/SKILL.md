# Protocolo de Despliegue FnAutos

Esta skill garantiza que todo cambio en la rama de desarrollo (ej. `desarrollov1`) sea validado antes de pasar a producción (`master` en Hostinger).

## Flux de Trabajo-Deploy
En CADA mención de "desplegar", "subir a producción" o "pasar a master", el asistente DEBE:

1.  **Validación de Calidad (Informativa)**:
    *   Ejecutar `npx eslint src --ext .ts,.tsx` para revisar calidad de código.
    *   Ejecutar `npx tsc --noEmit` para revisar tipos.
    *   *Nota: No detener el despliegue por errores heredados (ej. `any`) salvo que rompan el build, pero sí informar al usuario.*
2.  **Ejecutar Build**: Ejecutar `npm run build` para asegurar que la compilación de Next.js es correcta.
3.  **Commit y Push Desarrollo**: Guardar todos los cambios locales en la rama actual y subirlos a `origin`.
4.  **Merge a Master**:
    *   Moverse a la rama `master`.
    *   Fusionar (`merge`) la rama de desarrollo.
    *   Subir (`push`) `master` a remoto para que Hostinger detecte el cambio.
5.  **Limpieza**: Volver a la rama de desarrollo original.

## Comandos Recomendados
Utiliza el workflow `/deploy` para ejecutar estos pasos de forma automática.
