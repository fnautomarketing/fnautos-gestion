# Checklist: Nuevo cliente con repo separado (ej. FNAUTOS)

**¿Solo necesito este documento?** Sí. **Este checklist es suficiente.** Síguelo desde la carpeta del proyecto del cliente (ej. `C:\FNAUTOS-GESTION`). No hace falta otro archivo tipo "FNAUTOS-PRIMEROS-PASOS": todo está aquí (Fase 0 a 5). Si clonaste el repo en esa carpeta, este archivo ya está en `docs/` dentro del clone.

---

Objetivo: entregar al nuevo cliente un **proyecto independiente** partiendo de esta base (STVLS). El cliente tendrá **su propio repo Git**, **su propia cuenta/proyecto en Supabase**, **su propia cuenta en Resend** y **su propio hosting**, todo desvinculado del proyecto actual.

**Sobre "exportar e importar la base de datos":** no hace falta exportar datos del proyecto actual. Lo que se reutiliza es la **estructura** (tablas, columnas, RLS, triggers), definida en `supabase/migrations/`. En el **nuevo** proyecto Supabase del cliente solo hay que **aplicar esas migraciones** (`npx supabase db push` o ejecutar el SQL en orden). Así el nuevo proyecto tiene la misma BD "en blanco"; luego se añaden los datos del cliente (empresa, series, usuarios) con un seed.

---

## Cuentas y servicios por cliente (todo separado)

| Servicio | STVLS (actual) | Nuevo cliente (ej. FNAUTOS) |
|----------|----------------|-----------------------------|
| **Git** | Repo bajo **tu usuario** (ej. `stvls-erp-git`) | **Repo bajo el usuario/org de FNAUTOS** (ej. `erp-fnautos`); el código se copia ahí desde esta base. |
| **Supabase** | Proyecto actual | **Proyecto nuevo** (cuenta del cliente o tu org) |
| **Resend** | Cuenta/dominio actual para envío de emails | **Cuenta/dominio del cliente** (o nuevo dominio verificado) |
| **Hosting** | Vercel/host actual | **Proyecto de hosting nuevo** (Vercel u otro) |

Cada cliente tiene su propia URL de Supabase, sus propias API keys, su propio dominio de envío de emails y su propio dominio de la app. No se comparte ninguna cuenta entre clientes. **El repositorio del cliente pertenece al usuario u organización Git de ese cliente** (ej. la cuenta de GitHub/GitLab de FNAUTOS), no a la cuenta donde está el repo de STVLS; la copia o clon de la base se hace para que el código quede en el repo del cliente.

---

## ¿Desde dónde sigo el checklist?

| Fase | Dónde trabajas |
|------|----------------|
| **Fase 0** | El repo nuevo está en la **cuenta Git de FNAUTOS** (usuario/org distinto al de STVLS). Tú o FNAUTOS copiáis el código de esta base a ese repo. Una vez el código está en el repo de FNAUTOS, **trabajas desde esa carpeta** (clonada con el usuario de FNAUTOS o con acceso a su repo). |
| **Fase 1 en adelante** | **Desde el repo del cliente** (repo de FNAUTOS, bajo su usuario Git). Ahí haces `supabase link` / `db push`, Resend, branding y deploy. Quien tenga el repo clonado —tú con acceso o el equipo de FNAUTOS— sigue el checklist desde esa carpeta. |

**Resumen:** El repo del cliente pertenece al **usuario u organización Git de FNAUTOS** (no a la cuenta de STVLS). Fase 0 = que el código base llegue a ese repo (creado por FNAUTOS o por ti con acceso a su cuenta). Del resto del checklist se sigue **desde la carpeta del repo de FNAUTOS**, trabajando con su usuario Git, Supabase, Resend y hosting.

---

## Fase 0: Repositorio del nuevo cliente (bajo el usuario/org de FNAUTOS)

El repo del cliente debe estar en la **cuenta Git de FNAUTOS** (usuario u organización), no en la de STVLS. La copia o clon de esta base sirve para que el código llegue a ese repo.

- [ ] **Crear el repo en la cuenta de FNAUTOS**: en GitHub/GitLab, con el **usuario u organización de FNAUTOS**, crear un repositorio nuevo (ej. `erp-fnautos`). Si tú no tienes acceso a su cuenta, que FNAUTOS cree el repo y te añada como colaborador.
- [ ] **Llevar el código base a ese repo:**
  - **Opción A (tú subes el código):** clonar este repo, cambiar `remote` al repo de FNAUTOS y hacer push (necesitas permisos de escritura en el repo de FNAUTOS).
  - **Opción B (FNAUTOS clona y sube):** FNAUTOS clona este repo (acceso o repo público), crea un repo en su cuenta, añade ese repo como `origin` y hace push. El código queda en su usuario Git.
- [ ] A partir de aquí, **todo el trabajo se hace en el repo de FNAUTOS** (en la carpeta de ese repo). Las fases siguientes se siguen desde ahí.
- [ ] Opcional: copiar este checklist al repo del cliente. En el README, documentar que la base es el proyecto STVLS y cómo traer actualizaciones (merge desde `upstream`).

---

## Fase 1: Supabase del nuevo cliente (cuenta/proyecto propio)

### 1.1 Crear proyecto en Supabase (cuenta/proyecto del cliente)

- [ ] Usar la **cuenta Supabase del cliente** (o una org tuya dedicada a ese cliente). No reutilizar el proyecto de STVLS.
- [ ] En [Supabase Dashboard](https://supabase.com/dashboard): **New project**.
- [ ] Nombre: `fnautos` (o el nombre del cliente).
- [ ] Contraseña de base de datos: guardarla en sitio seguro (gestor de contraseñas).
- [ ] Región: la que convenga al cliente.
- [ ] Crear proyecto y esperar a que esté listo.

### 1.2 Obtener credenciales del nuevo proyecto

- [ ] En el proyecto nuevo: **Settings → API**.
- [ ] Anotar:
  - **Project URL** → será `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role** → será `SUPABASE_SERVICE_ROLE_KEY` (no exponer en front)

### 1.3 Aplicar las migraciones (misma estructura de tablas)

El proyecto ya tiene las migraciones en `supabase/migrations/`. Al aplicarlas en el **nuevo** proyecto Supabase obtienes la **misma estructura de tablas y columnas** (sin datos de STVLS). Los datos (empresas, clientes, facturas) los añades después con el seed del nuevo cliente.

Tienes dos opciones:

#### Opción A: Supabase CLI (recomendada)

- [ ] Instalar [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) si no la tienes.
- [ ] En la raíz del repo: `npx supabase link --project-ref <REF_DEL_NUEVO_PROYECTO>`  
  (el ref está en **Settings → General** del proyecto nuevo).
- [ ] Ejecutar: `npx supabase db push`.  
  La CLI aplica los archivos de `supabase/migrations/` en **orden alfabético**. Si aparece error con `fix_usuarios_empresas_rls.sql` (por orden), ver nota abajo.
- [ ] Comprobar en **Table Editor** que existen: `empresas`, `clientes`, `facturas`, `series_facturacion`, `usuarios_empresas`, `perfiles`, `plantillas_factura`, etc.

**Orden recomendado de migraciones** (por si aplicas a mano o hay conflictos):

1. `20260208_rfc025_multi_company.sql`
2. `20260208_rfc028_shared_clients.sql`
3. `20260209_restore_get_kpis_ventas.sql`
4. `20260211_fix_empresa_rls.sql`
5. `20260211_global_admin_access.sql`
6. `20260212_add_facturas_empresa_fk.sql`
7. `20260212_fix_global_kpis.sql`
8. `20260213_create_notificaciones.sql`
9. `20260214_trigger_evento_factura_estado.sql`
10. `20260215_cleanup_facturas_empresas.sql`
11. `20260215_fix_series_rls_multi_empresa.sql`
12. `20260215_plantillas_yenifer_edison.sql`
13. `20260216_fix_facturas_rls_vision_global.sql`
14. `20260216_fix_lineas_factura_rls_vision_global.sql`
15. `20260216_seed_series_empresas.sql`
16. `20260216_series_v2026_y2026_e2026.sql`
17. `20260221_fix_villegas_series_f2026.sql`
18. `20260221_liberar_numero_serie_externa.sql`
19. `20260224_clientes_empresas_grants.sql`
20. `20260224_clientes_empresas_m2m.sql`
21. `20260224_clientes_insert_fix.sql`
22. `20260224_clientes_rls_clientes_empresas.sql`
23. `fix_usuarios_empresas_rls.sql` (políticas RLS para `usuarios_empresas`; si ya existen políticas equivalentes en las de 20260208, puede dar conflicto — en ese caso omitir o adaptar).

#### Opción B: SQL a mano (si no usas CLI)

- [ ] En el nuevo proyecto: **SQL Editor**.
- [ ] Abrir cada archivo de `supabase/migrations/` en el **orden de la lista anterior**.
- [ ] Ejecutar el contenido de cada uno en ese orden.
- [ ] Revisar que no haya errores y que las tablas existan.

### 1.4 Auth y Storage en el nuevo proyecto

- [ ] **Authentication**: el nuevo proyecto ya tiene Auth; los usuarios se crean al registrarse o con scripts.
- [ ] **Storage**: en **Storage** del dashboard del nuevo proyecto, crear estos buckets (la app los usa por nombre):
  - **`company-logos`**: logos de empresas (subida desde Configuración → Empresas). Políticas: lectura pública para ver logos, escritura solo `authenticated` (o `service_role` en server actions).
  - **`facturas-externas`**: PDFs de facturas externas (subida al editar factura externa). Políticas: lectura y escritura para `authenticated`.
- [ ] Crear las políticas RLS de Storage igual que en el proyecto STVLS (desde el dashboard o desde SQL si las tienes exportadas).

### 1.5 Datos iniciales del nuevo cliente (seed)

- [ ] Crear **1 empresa** (FNAUTOS) en la tabla `empresas` con sus datos (nombre, CIF, dirección, logo_url si aplica, etc.).
- [ ] Crear **1 serie de facturación** para esa empresa en `series_facturacion` (ej. F2026 o el código que quieras).
- [ ] Crear usuario administrador en **Authentication** y vincularlo a la empresa en `perfiles` y `usuarios_empresas` (igual que en STVLS).
- [ ] Opcional: script de seed (por ejemplo `scripts/seed-fnautos.mjs`) que inserte empresa, serie y usuario inicial, para poder repetirlo o documentarlo.

---

## Fase 2: Resend del nuevo cliente (cuenta/dominio propio)

El envío de facturas por email usa Resend. El nuevo cliente debe tener **su propia cuenta Resend** (o un dominio verificado en tu cuenta) para no mezclar envíos con STVLS.

- [ ] Crear **cuenta en [Resend](https://resend.com)** para el cliente (o añadir su dominio en tu cuenta si gestionas varios clientes).
- [ ] **Verificar el dominio** desde el que se enviarán los emails (ej. `facturacion@fnautos.com` o `noreply@fnautos.com`) en el dashboard de Resend.
- [ ] Obtener la **API Key** de Resend para ese proyecto/dominio.
- [ ] Anotar el **email remitente** que usarás (ej. `facturacion@fnautos.com`) → será `RESEND_FROM` en las variables de entorno del deploy.
- [ ] En el código del repo del cliente, las variables de email serán las de **su** Resend (no las de STVLS).

---

## Fase 3: Preparar el código en el repo del cliente (branding y personalizaciones)

Objetivo: en el **repo del nuevo cliente** (creado en Fase 0), adaptar logo, colores y textos para que no queden fijos a STVLS (por env o por config). Las personalizaciones específicas del cliente también se hacen en este repo.

### 3.1 Variables de entorno para branding

- [ ] Definir en el código (y en `.env.example`) algo como:
  - `NEXT_PUBLIC_APP_NAME` (ej. "FNAUTOS Facturación").
  - `NEXT_PUBLIC_LOGO_URL` o `NEXT_PUBLIC_LOGO_PATH`: ruta o URL del logo (ej. `/logos/fnautos.png` o URL de Storage).
  - Opcional: `NEXT_PUBLIC_PRIMARY_COLOR`, `NEXT_PUBLIC_ACCENT_COLOR` para PDF y/o UI.

### 3.2 Logo

- [ ] **Login**: en `src/app/(auth)/login/page.tsx` se usa `/logo-stv.svg` y textos "STV Global", "STV Logistics". Sustituir por `process.env.NEXT_PUBLIC_LOGO_URL || '/logo-stv.svg'` y `process.env.NEXT_PUBLIC_APP_NAME || 'STV Logistics'` (o un config compartido).
- [ ] **PDF**: el logo del PDF viene de la **empresa** (`empresa.logo_url`) o de la plantilla; no está hardcodeado. Solo asegurar que la empresa del nuevo cliente tenga su `logo_url` en Configuración o en el seed.
- [ ] Para FNAUTOS: poner su logo en `public/logos/fnautos.svg` (o `.png`) y en el deploy definir `NEXT_PUBLIC_LOGO_URL=/logos/fnautos.svg`; o subir el logo desde la app (Configuración → Empresas) al bucket `company-logos` del nuevo Supabase.

### 3.3 Colores del PDF (y opcionalmente de la UI)

- [ ] En **`src/components/ventas/pdf/pdf-document.tsx`** los colores están como constantes (`BRAND_GOLD = '#E0A904'`, `BRAND_DARK = '#1F2937'`, etc.). Hacer que el color principal venga de `options.colorAcento` o de `process.env.NEXT_PUBLIC_PRIMARY_COLOR` (leyendo env en el componente o donde se construye `options`).
- [ ] En **`src/app/globals.css`** el tema usa `--primary: 45 96% 45%` (dorado). Para otro cliente puedes usar variables CSS que se sobrescriban por env (más avanzado) o dejar que el PDF use `NEXT_PUBLIC_PRIMARY_COLOR` y la web siga con el tema por defecto hasta que implementes tema por cliente.
- [ ] Documentar en el README o aquí: "Branding: NEXT_PUBLIC_APP_NAME, NEXT_PUBLIC_LOGO_URL, NEXT_PUBLIC_PRIMARY_COLOR".

### 3.4 Eliminar o parametrizar datos fijos de STVLS

- [ ] Buscar en el código referencias a "STVLS", "Villegas", "administracion@stvls.com" en textos por defecto y sustituir por variables o por config (nombre de app, email de soporte, etc.).
- [ ] Los IDs de empresas (Villegas, Yenifer, Edison) no hace falta hardcodear: en el nuevo Supabase solo existirá la empresa de FNAUTOS y la app los leerá de la BD.

---

## Fase 4: Hosting del nuevo cliente (proyecto propio)

El cliente tiene **su propio proyecto de hosting** (Vercel, Netlify u otro). No se usa el mismo proyecto que STVLS. Se conecta al **repo del cliente** (Fase 0) y a las **cuentas propias** de Supabase y Resend del cliente.

### 4.1 Crear proyecto de hosting

- [ ] En **Vercel** (o el host que uses): crear un **nuevo proyecto** (ej. `erp-fnautos`).
- [ ] Conectar el **repositorio del cliente** (el creado en Fase 0), no el repo de STVLS.
- [ ] Rama a desplegar: normalmente `main` (o la que uses en el repo del cliente).

### 4.2 Variables de entorno (Supabase + Resend + branding)

Configurar en el proyecto de hosting **todas** las variables; todas apuntan a **cuentas/servicios del cliente**:

**Supabase (proyecto del cliente, Fase 1):**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = URL del proyecto Supabase del cliente.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key del proyecto del cliente.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = service_role del proyecto del cliente.

**Resend (cuenta/dominio del cliente, Fase 2):**
- [ ] `RESEND_API_KEY` = API key de Resend del cliente (o del dominio verificado para ese cliente).
- [ ] `RESEND_FROM` = email remitente verificado (ej. `facturacion@fnautos.com`).

**Branding (Fase 3):**
- [ ] `NEXT_PUBLIC_APP_NAME` = "FNAUTOS Facturación" (o el nombre acordado).
- [ ] `NEXT_PUBLIC_LOGO_URL` o `NEXT_PUBLIC_LOGO_PATH` = logo del cliente.
- [ ] Opcional: `NEXT_PUBLIC_PRIMARY_COLOR`, `NEXT_PUBLIC_ACCENT_COLOR`.

### 4.3 Dominio y primer acceso

- [ ] Asignar el **dominio del cliente** al proyecto de hosting (ej. `facturacion.fnautos.com`).
- [ ] Hacer el primer login con el usuario administrador creado en la Fase 1.5 y comprobar que se ven la empresa y la serie.

---

## Fase 5: Comprobaciones en el nuevo cliente

- [ ] Login correcto.
- [ ] Se ve el logo y el nombre de la app del nuevo cliente.
- [ ] Crear una factura de prueba y comprobar que usa la serie y la empresa correctas.
- [ ] Generar PDF: logo y colores del nuevo cliente.
- [ ] Envío de email de factura (si aplica): remitente y branding coherentes.
- [ ] Si hay más de una empresa en el futuro, probar selector de empresa y series.

---

## Resumen rápido (repo separado por cliente)

| Qué | Dónde |
|-----|--------|
| **Repo Git** | Repo nuevo (copia de la base); todo el código del cliente vive ahí. |
| **Supabase** | Proyecto/cuenta propio del cliente; misma estructura con `supabase db push` (o SQL a mano). |
| **Resend** | Cuenta/dominio propio del cliente para envío de emails. |
| **Hosting** | Proyecto de hosting propio (Vercel u otro), conectado al repo del cliente. |
| **Branding** | Logo, nombre de app y colores en el repo del cliente (env o config). |
| **Datos (empresas, series, usuarios)** | Seed en el Supabase del cliente (1 empresa, 1 serie, 1 admin, etc.). |

Cada cliente tiene **repo + Supabase + Resend + hosting** independientes. No se comparte ninguna cuenta entre clientes.

---

## Orden sugerido de trabajo

1. **Fase 0**: Crear repo nuevo (copia de la base) y trabajar ahí.
2. **Fase 1**: Crear proyecto Supabase del cliente y aplicar migraciones + buckets + seed.
3. **Fase 2**: Configurar Resend del cliente (cuenta/dominio y API key).
4. **Fase 3**: En el repo del cliente, adaptar branding y personalizaciones.
5. **Fase 4**: Crear proyecto de hosting y configurar env (Supabase + Resend + branding).
6. **Fase 5**: Comprobaciones (login, factura, PDF, email).

Puedes ir marcando las casillas según avances. Si más adelante quieres **traer mejoras o correcciones desde el repo base (STVLS)** al repo del cliente: añade el repo original como `git remote add upstream <url-repo-stvls>` y haz `git fetch upstream` + `git merge upstream/main` (o la rama que uses); resuelve conflictos si hay personalizaciones en los mismos archivos).

---

## Dónde estoy: resumen por fases

| Fase | Qué hacer | Estado |
|------|-----------|--------|
| **0. Repo Git** | Crear repo nuevo (copia de la base) y usarlo como código del cliente | ☐ |
| **1. Supabase** | Cuenta/proyecto propio → aplicar migraciones → buckets → seed (empresa, serie, usuario) | ☐ |
| **2. Resend** | Cuenta/dominio propio del cliente → verificar dominio → API key y email remitente | ☐ |
| **3. Código (repo cliente)** | Branding: env (logo, nombre app, colores) y personalizaciones en el repo del cliente | ☐ |
| **4. Hosting** | Proyecto de hosting nuevo (Vercel, etc.) → conectar repo cliente → env (Supabase + Resend + branding) → dominio | ☐ |
| **5. Pruebas** | Login, factura, PDF con logo/colores del cliente, envío de email | ☐ |
