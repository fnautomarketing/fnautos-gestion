# Cómo configurar variables de entorno en Vercel

No se pueden añadir automáticamente; debes hacerlo manualmente en el panel de Vercel.

## Paso 1: Ir a la configuración

1. Abre **https://vercel.com/stvls-gestions-projects/stvls-erp**
2. Haz clic en **Settings** (arriba)
3. En el menú lateral, haz clic en **Environment Variables**

## Paso 2: Añadir cada variable

Para cada variable de la tabla, haz clic en **Add New** y rellena:

| Nombre (Key) | Valor | Entorno |
|--------------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Copia el valor de `NEXT_PUBLIC_SUPABASE_URL` de tu `.env.local` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Copia el valor de `NEXT_PUBLIC_SUPABASE_ANON_KEY` de tu `.env.local` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Copia el valor de `SUPABASE_SERVICE_ROLE_KEY` de tu `.env.local` | Production, Preview, Development |

**Cómo copiar:** Abre tu archivo `.env.local` en el proyecto y copia cada valor tal cual (sin comillas).

## Paso 3: Redeploy

1. Ve a la pestaña **Deployments**
2. En el último deployment, haz clic en los **tres puntos (⋯)**
3. Selecciona **Redeploy**
4. Marca **Use existing Build Cache** si quieres (opcional) y confirma

---

**Nota:** `SUPABASE_ACCESS_TOKEN` y `RESEND_API_KEY` no son necesarios para que la app funcione. Añádelas solo si usas esas funciones.
