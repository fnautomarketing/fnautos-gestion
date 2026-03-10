---
name: code_quality_guardian
description: Skill para asegurar la calidad del código, cero errores y estabilidad. Se aplica en CADA modificación de código.
---

# Code Quality Guardian Skill

Esta skill define el protocolo estricto de QA (Quality Assurance) que debe ejecutarse **antes de considerar cualquier modificación de código como finalizada**, sin excepción.

## 🔴 REGLA OBLIGATORIA: Corrección Activa de TypeScript y Lint

> **Cada vez que escribas o modifiques código, debes corregir los errores de TypeScript y ESLint que aparezcan como feedback de la herramienta.**

### Proceso obligatorio en cada edición:

1. **Al recibir feedback de lint/TypeScript del editor**:
   - Lee los errores listados como "lint errors may be related to your recent edits".
   - Corrige **todos** los errores que hayan sido causados o agravados por tu edición.
   - Si el error ya existía ANTES de tu edición y no lo causaste tú, puedes dejarlo con una nota en comentario `// TODO: fix type`.

2. **Tipos explícitos**:
   - Evita `any` implícito. Si TypeScript se queja de `Parameter 'x' implicitly has an 'any' type`, añade el tipo explícito.
   - Para parámetros de eventos: `(e: React.ChangeEvent<HTMLInputElement>)`.
   - Para parámetros de funciones de array: `(item: TipoEspecifico)`.

3. **Módulos no encontrados**:
   - Si ves `Cannot find module 'X'` y es un módulo que necesitas, verifica si está instalado con `ls node_modules/X`.
   - Si no está, ejecuta `npm install X`.
   - Si es un error falso del editor (el módulo SÍ existe), ignóralo y añade `// @ts-expect-error` solo si bloquea la compilación real.

4. **Tras completar una tarea completa**:
   - Ejecuta `npx tsc --noEmit` para verificar errores reales de compilación.
   - Ejecuta `npm run lint` para verificar linting.
   - Corrige todos los errores encontrados antes de marcar la tarea como `[x]`.

## Protocolo de Calidad

1.  **Linting Obligatorio (`npm run lint`)**:
    - **NUNCA** marques una tarea como completada si hay errores de linting.
    - Ejecuta `npm run lint` después de cambios significativos.
    - Corrige los errores manualmente. **NO** uses `eslint-disable` a menos que sea la última opción y esté justificado documentalmente.

2.  **TypeScript Check (`npx tsc --noEmit`)**:
    - El código debe compilar sin errores de tipos.
    - Evita el uso de `any` explícito. Define interfaces o tipos adecuados.
    - Prioriza tipos de Supabase generados (`Database['public']['Tables']['x']['Row']`).

3.  **Verificación Funcional (E2E Manual)**:
    - Usa el `browser_subagent` para verificar flujos críticos (Login, Navegación de Dashboard).
    - Si creas una nueva página, visítala.
    - Si modificas un formulario, envíalo.

4.  **Corrección de Errores ("Fixed")**:
    - Si un usuario reporta un error o el sistema falla, crea una **Hipótesis de Causa Raíz** antes de editar.
    - Verifica la solución con un script de reproducción o visita manual.

## Checklist de Salida (Definition of Done)

- [ ] `npm run lint` devuelve exit code 0.
- [ ] `npx tsc --noEmit` devuelve exit code 0.
- [ ] La aplicación corre localmente sin errores de runtime en consola.
- [ ] Se ha verificado visualmente el cambio en el navegador.
- [ ] Todos los `any` implícitos de nuestra edición han sido tipados.
