# Plan: Plantilla ERP Facturación para Múltiples Clientes

**Objetivo:** Adaptar el proyecto STVLS ERP como plantilla reutilizable para clientes que quieran el mismo programa de facturación con:

---

## Índice

1. [Estrategia: Repo por Cliente](#1-estrategia-recomendada-repo-por-cliente-template--fork)
2. [Cambios Single-Empresa](#2-cambios-para-modo-single-empresa-1-empresa)
3. [Branding](#3-branding-archivos-y-ubicaciones)
4. [Supabase](#4-supabase-tablas-y-migraciones-para-1-empresa)
5. [Mejores Prácticas](#5-mejores-prácticas-investigación)
6. [Plan de Implementación](#6-plan-de-implementación-por-fases)
7. [Checklist Final](#7-checklist-final)

- **Branding personalizado** (logo, colores, nombre)
- **Una sola empresa** (sin selector de empresas en el header)
- **Datos independientes** por cliente (Supabase separado)
- **Repo en GitHub** del cliente (bajo su usuario)

---

## 1. Estrategia Recomendada: Repo por Cliente (Template + Fork)

### Por qué esta opción

| Criterio | Repo por cliente | Un repo + config |
|----------|------------------|------------------|
| **Tu caso** | Subir a repo del cliente | No aplica |
| **Aislamiento** | Total (código + DB) | Parcial |
| **Personalización** | Sin límites por cliente | Limitada a config |
| **Mantenimiento** | Propagación manual de fixes | Automática |
| **Control del cliente** | Propietario de su repo | No |

**Recomendación:** Usar **repo por cliente** porque:
1. Quieres subir a un repo nuevo en el usuario del cliente.
2. Cada cliente tendrá su propio Supabase (datos aislados).
3. Permite personalizaciones profundas sin afectar a otros.
4. El cliente puede evolucionar su versión independientemente.

### Flujo de trabajo

```
┌─────────────────────────────────────────────────────────────────┐
│  Repo base: stvls-erp-git (o erp-facturacion-plantilla)          │
│  Rama: main (STVLS actual) | plantilla (versión base limpia)     │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Cliente A     │    │ Cliente B     │    │ Cliente C     │
│ (usuario A)   │    │ (usuario B)   │    │ (usuario C)   │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ Fork/Template │    │ Fork/Template │    │ Fork/Template │
│ Supabase A    │    │ Supabase B    │    │ Supabase C    │
│ Branding A    │    │ Branding B    │    │ Branding C    │
└───────────────┘    └───────────────┘    └───────────────┘
```

### Pasos para nuevo cliente

1. **Crear rama `plantilla`** en el repo base con todos los cambios de este plan.
2. **GitHub:** "Use this template" → nuevo repo en cuenta del cliente.
3. **Supabase:** Crear proyecto nuevo, ejecutar migraciones.
4. **Seed:** 1 empresa, 1 serie, usuarios.
5. **Branding:** Editar `/config/clients/{cliente}.ts` y assets.
6. **Vercel:** Conectar repo, variables de entorno del cliente.

---

## 2. Cambios para Modo Single-Empresa (1 empresa)

### 2.1 Ocultar selector de empresas en el header

**Archivo:** `src/components/dashboard/navbar.tsx`

- **Actual:** Siempre muestra `<EmpresaSelector variant="header" />`.
- **Cambio:** Mostrar solo si `empresas.length > 1` O si existe variable `NEXT_PUBLIC_MULTI_EMPRESA=true`.
- **Alternativa:** Crear componente `EmpresaSelectorOrBadge` que con 1 empresa muestre solo el nombre/logo (sin dropdown).

```tsx
// Condición: solo mostrar selector si hay más de 1 empresa
{empresasCount > 1 && <EmpresaSelector variant="header" />}
// O con 1 empresa: mostrar badge fijo con nombre de la empresa
```

### 2.2 Ocultar "Administrar Empresas" en EmpresaSelector

**Archivo:** `src/components/empresa-selector.tsx` (líneas 273-284)

- Ocultar el `DropdownMenuItem` que enlaza a `/configuracion/empresas` cuando `empresas.length === 1` o cuando `NEXT_PUBLIC_MULTI_EMPRESA !== 'true'`.

### 2.3 Página de gestión de empresas (`/configuracion/empresas`)

**Archivo:** `src/app/(dashboard)/configuracion/empresas/page.tsx`

- **Opción A:** Redirigir a `/ventas/configuracion/empresa` cuando solo hay 1 empresa.
- **Opción B:** Ocultar el enlace en el sidebar/navbar y no exponer la ruta (mantener para admins si en el futuro hay multi-empresa).
- **Recomendación:** Redirigir con `redirect('/ventas/configuracion/empresa')` si `NEXT_PUBLIC_MULTI_EMPRESA !== 'true'`.

### 2.4 Sidebar: enlace a Configuración

**Archivo:** `src/components/dashboard/sidebar.tsx`

- El menú "Configuración" ya apunta a `/ventas/configuracion/empresa` (datos de la empresa) y `/ventas/configuracion/series`.
- No hay enlace directo a "Gestión de Empresas" en el sidebar; solo en el dropdown del EmpresaSelector.
- **Acción:** Ninguna si se oculta el EmpresaSelector en modo single-empresa.

### 2.5 Simplificar contexto de usuario

**Archivos:** `src/app/actions/usuarios-empresas.ts`, `src/lib/helpers/empresa-context.ts`

- El código ya soporta 1 empresa: `usuarios_empresas` puede tener 1 fila.
- No hace falta cambiar la lógica; solo asegurar que el seed cree 1 empresa y 1 fila en `usuarios_empresas` por usuario.
- **Opcional:** Si `empresas.length === 1`, evitar llamadas innecesarias y devolver directamente esa empresa.

### 2.6 Componentes que reciben `empresaId` o lista de empresas

| Componente / Página | Uso | Cambio en single-empresa |
|---------------------|-----|---------------------------|
| `nueva-factura-form.tsx` | Recibe `empresaId`, `empresas`, `empresasConfigs` | Pasar siempre la única empresa; ocultar selector si existe |
| `plantilla-selector.tsx` | Filtra por `empresaId` | Sin cambio (1 empresa) |
| `informes/page.tsx` | `listarEmpresasUsuarioAction()` | Sin cambio (devolverá 1 empresa) |
| APIs (`clientes/search`, `facturas/export`, etc.) | Filtran por `empresa_id` | Sin cambio |

### 2.7 Resumen de archivos a tocar (single-empresa)

| Archivo | Cambio |
|---------|--------|
| `src/components/dashboard/navbar.tsx` | Condicionar `EmpresaSelector` a multi-empresa |
| `src/components/empresa-selector.tsx` | Ocultar "Administrar Empresas" en single-empresa |
| `src/app/(dashboard)/configuracion/empresas/page.tsx` | Redirigir si single-empresa |
| `middleware.ts` | (opcional) Redirigir `/configuracion/empresas` si single-empresa |

**Variable de entorno propuesta:** `NEXT_PUBLIC_MULTI_EMPRESA=true|false` (default: `false` para plantilla).

---

## 3. Branding: Archivos y Ubicaciones

### 3.1 Estructura de configuración centralizada

Crear `/config/clients/` con:

```
config/
  clients/
    index.ts
    stvls.ts
    fnautos.ts   (ejemplo para nuevo cliente)
```

**Ejemplo `config/clients/stvls.ts`:**

```ts
export const stvlsConfig = {
  id: 'stvls',
  nombre: 'STV Global',
  nombreCorto: 'STV Logistics',
  tagline: 'El Futuro de la Logística Inteligente',
  copyright: '© 2026 STV Logistics Group',
  logoPath: '/logo-stv.svg',
  logoPngPath: '/logo-stv.png',
  heroImagePath: '/hero-login.png',
  colors: {
    primary: '45 96% 45%',      // HSL sin hsl()
    secondary: '215 28% 17%',
    brandGold: '#E0A904',
    brandGoldLight: '#F5D547',
    brandDark: '#1F2937',
  },
  email: {
    admin: 'administracion@stvls.com',
    from: 'Facturación <administracion@stvls.com>',
  },
  multiEmpresa: true,
}
```

**Ejemplo `config/clients/fnautos.ts`:**

```ts
export const fnautosConfig = {
  id: 'fnautos',
  nombre: 'FNAUTOS',
  nombreCorto: 'FNAUTOS',
  tagline: 'Tu partner en automoción',
  copyright: '© 2026 FNAUTOS',
  logoPath: '/logo-fnautos.svg',
  logoPngPath: '/logo-fnautos.png',
  heroImagePath: '/hero-login.png',
  colors: {
    primary: '220 70% 50%',     // Azul ejemplo
    secondary: '215 28% 17%',
    brandGold: '#2563eb',
    brandGoldLight: '#60a5fa',
    brandDark: '#1e3a5f',
  },
  email: {
    admin: 'administracion@fnautos.com',
    from: 'Facturación <administracion@fnautos.com>',
  },
  multiEmpresa: false,
}
```

**`config/clients/index.ts`:**

```ts
import { stvlsConfig } from './stvls'
import { fnautosConfig } from './fnautos'

const clients: Record<string, typeof stvlsConfig> = {
  stvls: stvlsConfig,
  fnautos: fnautosConfig,
}

const clientId = process.env.NEXT_PUBLIC_CLIENT_ID || 'stvls'
export const clientConfig = clients[clientId] || stvlsConfig
```

### 3.2 Archivos con branding hardcodeado (lista completa)

| Archivo | Qué cambiar |
|---------|-------------|
| `src/app/globals.css` | `--primary`, `--secondary` → inyectar desde config o CSS variables por cliente |
| `src/app/(auth)/login/page.tsx` | Logo, "STV Global", "STV Logistics", tagline, copyright |
| `src/components/dashboard/sidebar.tsx` | Logo, "STV Global", "Enterprise", email por defecto |
| `src/components/dashboard/navbar.tsx` | Placeholder búsqueda "STV Global Enterprise" |
| `src/app/layout.tsx` | `metadata.title`, `metadata.description` |
| `src/components/ventas/pdf/pdf-document.tsx` | `BRAND_GOLD`, `BRAND_GOLD_LIGHT`, `BRAND_DARK` |
| `src/app/actions/email.tsx` | `logo-stv.png`, `RESEND_FROM`, fallback "STV Logistics" |
| `src/app/api/facturas/[id]/pdf/route.tsx` | `logo-stv.png` |
| `src/app/(dashboard)/ventas/facturas/[id]/pdf/page.tsx` | `logo-stv.png` |
| `src/components/ventas/pdf/pdf-layout-preview.tsx` | `logo-stv.png` |
| `src/components/ventas/email/email-send-form.tsx` | `empresaNombre` default "STV Logistics" |
| `src/app/(dashboard)/ventas/facturas/[id]/email/page.tsx` | Plantillas de mensaje "STV Logistics" |
| `src/app/api/dev/send-3-facturas-email/route.ts` | Logo, from, mensaje |
| `src/app/api/dev/seed-facturas-y-enviar/route.ts` | Idem |
| `src/app/api/dev/save-pdf-factura/route.ts` | Logo path |

### 3.3 Cómo aplicar colores dinámicamente

**Opción A – Build-time (recomendada):** Las variables CSS se generan en build. Crear un script o componente que inyecte en `globals.css` o en un `<style>` del layout:

```tsx
// En layout o en un provider
<style dangerouslySetInnerHTML={{
  __html: `
    :root {
      --primary: ${clientConfig.colors.primary};
      --secondary: ${clientConfig.colors.secondary};
    }
  `
}} />
```

**Opción B – Archivo CSS por cliente:** `globals-stvls.css`, `globals-fnautos.css` e importar según `NEXT_PUBLIC_CLIENT_ID`.

### 3.4 Assets (logos, hero)

- **STVLS:** `public/logo-stv.svg`, `public/logo-stv.png`, `public/hero-login.png`
- **Nuevo cliente:** Añadir `public/logo-{cliente}.svg`, `public/logo-{cliente}.png` y opcionalmente `hero-login.png` propio.
- El path viene de `clientConfig.logoPath` y `clientConfig.logoPngPath`.

---

## 4. Supabase: Tablas y Migraciones para 1 Empresa

### 4.1 Las tablas actuales ya soportan 1 empresa

No hace falta cambiar el esquema. Las tablas con `empresa_id` o relaciones N:M funcionan igual con 1 empresa:

| Tabla | Uso con 1 empresa |
|-------|--------------------|
| `empresas` | 1 fila |
| `usuarios_empresas` | 1 fila por usuario (user_id, empresa_id, empresa_activa=true) |
| `clientes_empresas` | 1 fila por cliente (cliente_id, empresa_id) |
| `facturas` | `empresa_id` = ID de la única empresa |
| `series_facturacion` | 1 o más series para esa empresa |
| `plantillas_pdf` | 1 o más plantillas para esa empresa |
| `conceptos_catalogo` | Por empresa |
| `recordatorios`, `notificaciones` | Por empresa |

### 4.2 Migraciones a ejecutar

Usar las mismas migraciones del proyecto en el orden actual:

1. `20260208_rfc025_multi_company.sql` – usuarios_empresas
2. `20260208_rfc028_shared_clients.sql` – clientes compartidos
3. `20260211_fix_empresa_rls.sql`
4. `20260211_global_admin_access.sql`
5. `20260212_*`
6. `20260213_*`
7. `20260214_*`
8. `20260215_*`
9. `20260216_*`
10. `20260221_*`
11. `20260224_*` (clientes_empresas, etc.)
12. Resto de migraciones hasta la última

### 4.3 Seed para nuevo cliente (1 empresa)

Crear `supabase/seed-cliente-nuevo.sql` o script equivalente:

```sql
-- 1. Crear empresa
INSERT INTO empresas (id, razon_social, nombre_comercial, cif, tipo_empresa, direccion, ciudad, codigo_postal, provincia, pais, email, iva_predeterminado, retencion_predeterminada, regimen_iva, aplica_recargo_equivalencia, formato_numero_factura, idioma_predeterminado, zona_horaria, activo)
VALUES (
  gen_random_uuid(),
  'Razón Social del Cliente',
  'Nombre Comercial',
  'B12345678',
  'autonomo',
  'Calle Ejemplo 1',
  'Madrid',
  '28001',
  'Madrid',
  'España',
  'contacto@cliente.com',
  21, 0, 'general', false,
  '{serie}{numero}', 'es', 'Europe/Madrid', true
) RETURNING id;

-- 2. Crear serie de facturación (usar el id de la empresa del paso 1)
-- 3. Crear usuario en auth.users (vía Supabase Auth o Dashboard)
-- 4. Crear perfil en perfiles
-- 5. Insertar en usuarios_empresas (user_id, empresa_id, rol='administrador', empresa_activa=true)
-- 6. Crear plantilla PDF por defecto en plantillas_pdf
```

### 4.4 RLS y políticas

Las políticas actuales ya filtran por `empresa_id`. Con 1 empresa, cada usuario tendrá 1 fila en `usuarios_empresas` y las políticas seguirán funcionando.

No es necesario crear tablas adicionales para "single-tenant". El modelo multi-empresa con 1 empresa es suficiente.

---

## 5. Mejores Prácticas (Investigación)

### 5.1 White-label / multi-tenant

- **Config centralizada:** Un único punto de verdad para branding (ej. `/config/clients/`).
- **Variables de entorno:** `NEXT_PUBLIC_CLIENT_ID` para elegir config en build.
- **Bounded flexibility:** Limitar personalización a logo, colores, textos; evitar lógica distinta por cliente.
- **Data isolation:** 1 Supabase por cliente (tu caso) = máximo aislamiento.

### 5.2 Repo por cliente (template)

- **GitHub "Use this template":** Crear repo desde plantilla sin historial.
- **Rama `plantilla`:** Mantener una rama limpia sin datos ni IDs de STVLS.
- **Documentación:** README con pasos para nuevo cliente (Supabase, Vercel, branding).
- **Propagación de fixes:** Documentar proceso de merge/ cherry-pick desde repo base a repos de clientes.

### 5.3 Evitar hardcodeos

- Nada de "STV", "Villegas", "administracion@stvls.com" en el código.
- Todo en config o variables de entorno.
- IDs de empresas/plantillas: no hardcodear; usar datos de BD.

---

## 6. Plan de Implementación por Fases

### Fase 1: Rama plantilla y config (1–2 días)

1. Crear rama `plantilla` desde `main`.
2. Crear `/config/clients/` con `stvls.ts` y `fnautos.ts` (placeholder).
3. Añadir `NEXT_PUBLIC_CLIENT_ID` y `NEXT_PUBLIC_MULTI_EMPRESA` a `.env.example`.
4. Sustituir hardcodeos de branding por `clientConfig` en los archivos de la sección 3.2.
5. Parametrizar colores en `globals.css` (o inyección dinámica).

### Fase 2: Modo single-empresa (0.5–1 día)

1. Condicionar `EmpresaSelector` en navbar a `multiEmpresa`.
2. Ocultar "Administrar Empresas" en single-empresa.
3. Redirigir `/configuracion/empresas` cuando `multiEmpresa === false`.
4. Probar con `NEXT_PUBLIC_CLIENT_ID=fnautos` y `NEXT_PUBLIC_MULTI_EMPRESA=false`.

### Fase 3: Supabase y seed (0.5 día)

1. Documentar orden de migraciones.
2. Crear script/archivo de seed para 1 empresa.
3. Probar en un proyecto Supabase nuevo.

### Fase 4: Documentación y template (0.5 día)

1. README en la raíz o en `docs/` con:
   - Cómo crear repo para nuevo cliente.
   - Variables de entorno necesarias.
   - Pasos de Supabase (migraciones + seed).
   - Cómo personalizar branding.
2. Configurar el repo como template en GitHub (Settings → Template repository).

### Fase 5: Primer cliente real

1. "Use this template" → repo en cuenta del cliente.
2. Supabase nuevo, migraciones, seed.
3. Config `fnautos.ts` (o el id del cliente) con logo y colores.
4. Vercel conectado al repo del cliente.
5. Pruebas de login, facturas, PDF, emails.

---

## 7. Checklist Final

### Branding

- [ ] Logo en login
- [ ] Logo en sidebar
- [ ] Logo en PDFs
- [ ] Logo en emails
- [ ] Colores (primary, secondary) en toda la app
- [ ] Metadata (title, description)
- [ ] Textos: nombre app, tagline, copyright
- [ ] Placeholder de búsqueda en navbar
- [ ] Colores BRAND_* en pdf-document.tsx

### Single-empresa

- [ ] Ocultar EmpresaSelector en header (o mostrar badge fijo)
- [ ] Ocultar "Administrar Empresas"
- [ ] Redirigir /configuracion/empresas
- [ ] Probar flujo completo con 1 empresa

### Supabase

- [ ] Migraciones ejecutadas
- [ ] Seed con 1 empresa
- [ ] 1 serie de facturación
- [ ] Usuario admin vinculado
- [ ] Plantilla PDF por defecto

### Repo y deploy

- [ ] Rama plantilla creada
- [ ] Repo configurado como template en GitHub
- [ ] README con instrucciones
- [ ] .env.example actualizado

---

## 8. Resumen Ejecutivo

| Qué | Cómo |
|-----|------|
| **Estrategia** | Repo por cliente (template en GitHub) |
| **Rama base** | `plantilla` con código parametrizado |
| **Branding** | `/config/clients/{id}.ts` + assets en `public/` |
| **Single-empresa** | `NEXT_PUBLIC_MULTI_EMPRESA=false` + condicionales en UI |
| **Supabase** | Mismas tablas; seed con 1 empresa |
| **Nuevo cliente** | Template → repo → Supabase → config → deploy |

Este plan permite reutilizar el ERP como plantilla para futuros clientes con branding y single-empresa, manteniendo el repo de STVLS como base y generando repos independientes para cada cliente.
