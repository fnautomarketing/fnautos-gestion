# Estrategia Multi-Cliente: Plantilla de Facturación

**Objetivo:** Usar este proyecto (STVLS ERP) como plantilla base para adaptarlo a otros clientes (ej. FNAUTOS) con:
- Base de datos separada por cliente
- Logo y branding distintos
- Número de empresas variable (STVLS: 3, FNAUTOS: 1)
- Series de facturación propias
- Plantillas PDF con su branding

---

## Opciones de Arquitectura

### Opción A: Repo por cliente (Template + Fork/Copia)

```
┌─────────────────────────┐     ┌─────────────────────────┐
│  Repo: stvls-erp        │     │  Repo: fn-autos-erp     │
│  (o erp-facturacion)    │     │  (fork/copia del base)  │
├─────────────────────────┤     ├─────────────────────────┤
│  Supabase: proyecto A   │     │  Supabase: proyecto B   │
│  Vercel: stvls.vercel   │     │  Vercel: fnautos.vercel │
│  .env: STVLS URLs       │     │  .env: FNAUTOS URLs     │
└─────────────────────────┘     └─────────────────────────┘
```

**Cómo hacerlo:**
1. Crear repo `erp-facturacion-base` (o usar `stvls-erp` como base) con código limpio.
2. Para FNAUTOS: "Use this template" en GitHub → nuevo repo `fn-autos-erp`.
3. Cada repo tiene su `.env.local` con su Supabase URL/Key.
4. Branding: logo en `public/logo.png`, colores en `tailwind.config` o variables CSS.

**Pros:**
- Aislamiento total entre clientes
- Personalización por cliente sin afectar otros
- Cada cliente puede evolucionar independiente (si lo necesitan)

**Contras:**
- Bug fixes y features hay que propagarlos manualmente
- Mantener N repos puede ser costoso

---

### Opción B: Un repo + config por cliente (Recomendada)

```
┌──────────────────────────────────────────────────────────┐
│  Repo único: stvls-erp-git (o erp-facturacion)            │
│  Código compartido + /config/clients/{client}.ts          │
├──────────────────────────────────────────────────────────┤
│  Deploy STVLS:          │  Deploy FNAUTOS:                │
│  Vercel project A       │  Vercel project B              │
│  CLIENT_ID=stvls        │  CLIENT_ID=fnautos              │
│  Supabase proyecto A    │  Supabase proyecto B            │
└──────────────────────────────────────────────────────────┘
```

**Configuración por cliente:**

```
/config/
  clients/
    stvls.ts      → { nombre, logo, colores, empresasDefault: 3 }
    fnautos.ts    → { nombre, logo, colores, empresasDefault: 1 }
```

**Variables de entorno por cliente:**

| Variable | STVLS | FNAUTOS |
|----------|-------|----------|
| NEXT_PUBLIC_SUPABASE_URL | proyecto-stvls | proyecto-fnautos |
| SUPABASE_SERVICE_ROLE_KEY | key-stvls | key-fnautos |
| NEXT_PUBLIC_CLIENT_ID | stvls | fnautos |
| RESEND_FROM | administracion@stvls.com | facturacion@fnautos.com |

**Pros:**
- Un solo código a mantener
- Bugs/features se arreglan una vez
- Config centralizada en `/config/clients/`

**Contras:**
- Hay que asegurar que el código no tenga hardcodeos de STVLS
- Cada deploy = Vercel project + Supabase project (config manual)

---

### Opción C: Multi-tenant (una base de datos)

Todos los clientes en la misma DB con `tenant_id` en cada tabla. **No recomendado** para tu caso porque:
- Quieres DB separada por cliente (más aislamiento)
- Diferentes Supabase = más control y seguridad por cliente

---

## Recomendación: Opción B (Un repo + config)

Para tu caso (2–3 clientes, mismo producto, adaptaciones menores):

1. **Un solo repo** con código base.
2. **Config por cliente** en `/config/clients/`.
3. **Un deploy por cliente** (Vercel + Supabase).
4. **Código parametrizado** por `NEXT_PUBLIC_CLIENT_ID`.

---

## Plan de Implementación

### Fase 1: Preparar el código base (antes de FNAUTOS)

1. **Crear estructura de config:**

```
/config/
  clients/
    index.ts
    stvls.ts
    fnautos.ts   (placeholder)
```

2. **Extraer valores hardcodeados:**

| Actual | Mover a config |
|--------|----------------|
| `administracion@stvls.com` | config.emailAdmin |
| Logo `public/logo-stv.png` | config.logoPath |
| Colores BRAND_DARK, BRAND_GOLD | config.colors |
| IDs empresas Villegas/Yenifer/Edison | En BD (ya vienen de Supabase) |

3. **Añadir variable de entorno:**

```env
NEXT_PUBLIC_CLIENT_ID=stvls
```

4. **Código que cargue config:**

```ts
// config/clients/index.ts
const clients = { stvls: stvlsConfig, fnautos: fnautosConfig }
export const clientConfig = clients[process.env.NEXT_PUBLIC_CLIENT_ID || 'stvls']
```

### Fase 2: Nuevo cliente

1. **Supabase:** Crear proyecto nuevo para FNAUTOS.
2. **Migraciones:** Ejecutar las mismas migraciones SQL de `supabase/migrations/`.
3. **Seed:** Crear 1 empresa (FNAUTOS), 1 serie, clientes.
4. **Vercel:** Nuevo proyecto, conectar repo, env vars de FNAUTOS.
5. **Config:** Añadir `config/clients/fnautos.ts`.

### Fase 3: Branding por cliente

- Logo: `public/logos/{client}.png` o `public/logo.png` (override por deploy).
- Colores: en `config/clients/{client}.ts` → `primaryColor`, `accentColor`.
- PDF: plantillas usan `config.colors` y `config.logo`.

---

## Qué ya está bien en tu código

- **Empresas:** La app ya soporta 1 o N empresas (vía `usuarios_empresas`).
- **Series:** Cada empresa tiene sus series en BD.
- **Plantillas PDF:** Hay `plantillas_pdf` por empresa.
- **Clientes:** Tabla `clientes` + `clientes_empresas` (N:M).

Lo que falta es **parametrizar** branding y valores por defecto.

---

## Resumen por opción

| Criterio | Opción A (Repo por cliente) | Opción B (Un repo + config) |
|----------|-----------------------------|-----------------------------|
| Mantenimiento | Más trabajo (N repos) | Más simple (1 repo) |
| Aislamiento | Total | Por deploy (DB separada) |
| Propagación de fixes | Manual | Automática |
| Escalabilidad | Buena | Buena |
| Complejidad inicial | Baja | Media |

**Recomendación:** Opción B para 2–5 clientes. Si superas ~10 clientes y necesitas más control por cliente, revisar Opción A.

---

## Próximos pasos

1. Crear `/config/clients/` con `stvls` y `fnautos` (placeholder).
2. Sustituir hardcodeos por `clientConfig`.
3. Documentar el proceso de "añadir nuevo cliente" en un README.
4. Para FNAUTOS: nuevo Supabase + Vercel + env vars.

Si quieres, puedo ayudarte a implementar la Fase 1 (estructura de config y primeros cambios).
