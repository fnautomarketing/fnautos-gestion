---
name: clean_code_guardian
description: Skill especializada en corregir errores de código basura, datos hardcodeados y asegurar código limpio y funcional.
---

# Clean Code Guardian Skill

Esta skill aplica estándares rigurosos de limpieza y mantenibilidad para asegurar que el proyecto `fnautos-gestion` esté libre de "ruido" técnico.

## 🧹 Eliminación de Código Basura (Dead Code)

1.  **Imports no usados**: Eliminar CUALQUIER import que no se use en el archivo.
2.  **Variables muertas**: Eliminar variables locales o globales que se declaren pero nunca se lean.
3.  **Funciones obsoletas**: Si una función no tiene referencias en todo el proyecto, debe ser eliminada.
4.  **Consoles & Debuggers**: Limpiar `console.log` residuales de debugging, excepto los de error crítico en producción.
5.  **Comentarios comentados**: No dejar bloques de código comentados. Si el código no se usa, se borra. El historial está en Git.

## 🧱 Desacoplamiento de Datos (Hardcoding)

1.  **Magic Numbers & Strings**: No uses valores literales en la lógica (ej: `if (status === 3)`). Usa constantes o enums (ej: `if (status === STATUS_PAGADA)`).
2.  **URLs y Endpoints**: Todas las URLs de APIs o servicios externos deben venir de `process.env` o de un archivo centralizado de configuración (ej: `src/config/api.ts`).
3.  **Configuraciones de Usuario**: Cualquier texto que sea configurable (nombres de empresa, límites, etc.) debe estar en el sistema de base de datos o en configuración, nunca directamente en el código.
4.  **Colores y Estilos**: Evitar valores hex/rgb directos en componentes. Usar las variables de CSS/Tailwind del sistema (`text-primary`, `bg-slate-900`, etc.).

## 🏗️ Estándares Clean Code

1.  **Principio DRY**: Si ves lógica repetida 3 veces, extráela a un hook o utilidad.
2.  **Responsabilidad Única**: Un componente o función debe hacer UNA sola cosa. Si es demasiado grande (>200 líneas), considera dividirlo.
3.  **Nombramiento Semántico**: Variables y funciones deben describir CLARAMENTE su intención en español (o inglés técnico si es estándar).

## ✅ Protocolo de Ejecución

- [ ] Correr `npm run build` para asegurar que el proyecto compila tras la limpieza.
- [ ] Verificar que no existan advertencias de "unused variables" en el linter.
- [ ] Validar que los datos configurables se lean de las fuentes correctas.
