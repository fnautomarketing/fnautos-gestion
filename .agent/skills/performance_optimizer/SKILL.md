---
name: performance_optimizer
description: Técnicas para asegurar la máxima velocidad y eficiencia del ERP.
---

# Performance Optimizer

## 1. Server Components vs Client Components
- **Default**: Server Component.
- **Client**: Solo cuando sea estrictamente necesario (`useState`, `useEffect`, eventos interactivos).
- **Hoisting**: Mueve la lógica de cliente a las hojas del árbol de componentes.

## 2. Optimización de Recursos
- **Imágenes**: Usa `next/image` con `sizes` adecuados y formatos modernos (WebP/AVIF).
- **Fuentes**: `next/font` con subconjuntos (`subsets: ['latin']`).
- **Scripts**: Carga scripts de terceros con `Strategy="lazyOnload"` o `worker`.

## 3. Base de Datos
- **Índices**: Asegura índices en `foreign_keys` (`empresa_id`, `cliente_id`, `factura_id`) y columnas de búsqueda frecuente.
- **Selects Específicos**: Nunca hagas `select('*')` en producción si solo necesitas 3 campos.

## 4. Caching & Revalidación
- Usa `revalidatePath` con precisión quirúrgica tras mutaciones.
- Implementa `unstable_cache` para datos computacionalmente costosos o de lectura frecuente global.
