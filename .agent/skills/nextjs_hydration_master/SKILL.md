---
name: nextjs_hydration_master
description: Skill especializado en detectar y solucionar errores de hidratación en Next.js.
---

# Next.js Hydration Master Skill

Este skill proporciona pautas y estrategias para eliminar los errores "Hydration failed because the initial UI does not match what was rendered on the server".

## 1. Causas Comunes e Identificación

- **Timestamps/Fechas**: Renderizar `new Date().toLocaleString()` directamente produce resultados diferentes en servidor (render time) y cliente (hydrate time).
- **Aleatoreidad**: `Math.random()`.
- **Detección de Navegador**: Acceso a `window`, `localStorage`, `navigator` en el cuerpo del componente.
- **HTML Inválido**: `<div>` dentro de `<p>`, `<table>` mal estructurada.
- **Extensiones de Navegador**: Modifican el DOM antes de la hidratación (Dark Reader, Grammarly).

## 2. Estrategias de Solución

### A. Solución para Fechas/Aleatorios (Two-Pass Rendering)
Renderizar un placeholder o null en el primer render, y el valor real en `useEffect`.

```tsx
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);

if (!isMounted) return null; // O un Skeleton
return <div>{contenidoDinamico}</div>
```

### B. Atributo `suppressHydrationWarning`
Útil para timestamps simples donde la diferencia es aceptable (segundos).

```tsx
<time dateTime={date.toISOString()} suppressHydrationWarning>
  {date.toLocaleDateString()}
</time>
```

### C. Librerías de UI
Asegurarse de que componentes como Modales o Tooltips usen `Portal` o se rendericen solo en cliente.

## 3. Rutina de Debugging

1.  **Identificar el Componente**: Leer el error en consola para localizar el componente culpable.
2.  **Aislar**: Desactivar partes del renderizado para encontrar la línea exacta.
3.  **Verificar HTML**: Buscar anidación inválida (p > div).
4.  **Aplicar Fix**: Usar estrategia A (useEffect) para diferencias inevitables, o corregir HTML para estructurales.

## 4. Prevención

- Usar componentes `ClientOnly` para envolver lógica dependiente del navegador.
- Estandarizar formateo de fechas en el servidor o pasarlas como strings formateados desde Server Components.
