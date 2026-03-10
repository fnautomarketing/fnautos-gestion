# Guía: Cómo Desplegar el ERP para un Nuevo Cliente

## Resumen del proceso (30 minutos)

```
Nuevo cliente → Supabase nuevo → Configurar código → Deploy Hostinger
```

---

## Paso 1 — Crear el proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) e iniciar sesión.
2. Crear un **nuevo proyecto** (no reutilizar el de STVLS):
   - Nombre: `NOMBRE-CLIENTE-gestion`
   - Región: `EU West 2 (London)` o la más cercana al cliente
   - Contraseña: guardarla en un gestor de contraseñas
3. Esperar que el proyecto se active (~2 min).

---

## Paso 2 — Aplicar las migraciones

En el panel de Supabase → **SQL Editor**, ejecutar los archivos de `supabase/migrations/` en **orden cronológico** (por fecha en el nombre del archivo):

```bash
# Opción A: Con la CLI de Supabase (recomendado)
supabase link --project-ref TU_PROJECT_REF
supabase db push

# Opción B: Manual
# Abrir cada .sql en supabase/migrations/ y ejecutarlo en SQL Editor, en orden de fecha
```

---

## Paso 3 — Ejecutar el seed del cliente

1. Editar `supabase/seed_fnautos.sql` (o crear uno nuevo para el cliente):
   - Cambiar `v_email_admin` al email real del administrador.
   - Cambiar `v_razon_social`, `v_nif`, `v_nombre_com`.
2. En Supabase → Authentication → Users: **crear el usuario admin** con ese email.
3. En SQL Editor: ejecutar el seed completo.
4. Verificar con las queries de **QA Senior** al final del seed.

---

## Paso 4 — Configurar el cliente en el código

### 4.1 Crear el archivo de configuración del cliente

```bash
cp src/config/clients/fnautos.ts src/config/clients/NUEVO.ts
```

Editar `NUEVO.ts`:
```typescript
export const nuevoConfig: ClientConfig = {
  id: 'nuevo',
  nombre: 'NOMBRE COMPLETO S.L.',
  nombreCorto: 'NUEVO',
  tagline: 'Tagline del cliente',
  copyright: '© 2026 NUEVO S.L.',
  logoPath: '/logo-nuevo.svg',
  logoPngPath: '/logo-nuevo.png',
  heroImagePath: '/hero-nuevo.png',
  faviconPath: '/favicon-nuevo.ico',
  colors: {
    primary: '220 70% 50%',       // HSL — color primario de branding
    secondary: '215 28% 17%',
    brandGold: '#2563eb',
    brandGoldLight: '#60a5fa',
    brandDark: '#1e3a5f',
  },
  email: {
    admin: 'admin@nuevo.com',
    from: 'Facturación NUEVO <facturacion@nuevo.com>',
  },
  multiEmpresa: false,    // false si solo tiene 1 empresa
}
```

### 4.2 Registrar el nuevo cliente en el índice

Editar `src/config/clients/index.ts`:

```typescript
import { nuevoConfig } from './nuevo'

const configs: Record<string, ClientConfig> = {
  stvls: stvlsConfig,
  fnautos: fnautosConfig,
  nuevo: nuevoConfig,   // ← añadir aquí
}
```

### 4.3 Subir el logo y assets

Copiar al directorio `public/`:
- `logo-nuevo.svg` — logo vectorial (fondo transparente)
- `logo-nuevo.png` — logo PNG para PDFs
- `hero-nuevo.png` — imagen de fondo login
- `favicon-nuevo.ico` — favicon

---

## Paso 5 — Configurar las variables de entorno

```bash
cp .env.example .env.local
```

Editar `.env.local` con los valores reales del nuevo proyecto de Supabase:

| Variable | Dónde obtenerla |
|---|---|
| `NEXT_PUBLIC_CLIENT_ID` | Poner `nuevo` (el id del cliente) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Settings > API > anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API > service_role |
| `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens |
| `RESEND_API_KEY` | https://resend.com/api-keys |
| `RESEND_FROM` | `Facturación Empresa <correo@dominio.com>` |

---

## Paso 6 — Verificar en local

```bash
npm run dev
# Abrir http://localhost:3000
# Iniciar sesión con el email del admin creado en el paso 3
```

**Checklist QA Senior de aceptación:**
- [ ] Login sin error "Empresa no encontrada"
- [ ] Dashboard muestra KPIs (aunque sean 0)
- [ ] Logo y nombre del cliente aparecen correctamente
- [ ] Color primario del cliente aplicado (botones, sidebar activo)
- [ ] Crear una factura de prueba sin error
- [ ] Descargar PDF de esa factura

---

## Paso 7 — Desplegar en Hostinger

1. En Hostinger: Settings > Environment Variables → añadir las mismas variables del `.env.local` (sin `NODE_ENV=development`).
2. Cambiar `NODE_ENV=production` y `NEXT_PUBLIC_SITE_URL=https://dominio-cliente.com`.
3. Hacer push a la rama principal (el deploy es automático si está configurado el webhook).

```bash
git add -A
git commit -m "feat: nuevo cliente NOMBRE configurado"
git push origin main
```

---

## Estructura de archivos por cliente

```
src/config/clients/
  index.ts          ← registro de todos los clientes
  types.ts          ← interface ClientConfig (no tocar)
  stvls.ts          ← config cliente STVLS (plantilla original)
  fnautos.ts        ← config cliente FNAUTOS
  nuevo.ts          ← tu nuevo cliente aquí

public/
  logo-nuevo.svg
  logo-nuevo.png
  hero-nuevo.png
  favicon-nuevo.ico

supabase/
  seed_fnautos.sql  ← seed FNAUTOS (copiar y adaptar para nuevo)
```
