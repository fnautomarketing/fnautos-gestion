# Plan de Seguridad y Auditoría – STVLS ERP

**Versión:** 1.0  
**Fecha:** Marzo 2026  
**Objetivo:** Proteger la aplicación frente a virus, hackers y vulnerabilidades; cerrar puertas abiertas; aplicar mejores prácticas y verificación tipo senior.

---

## Resumen Ejecutivo

Este documento recoge el resultado de una investigación profunda sobre:
- OWASP Top 10 y ataques web comunes
- Mejores prácticas Next.js, Supabase y React
- Análisis del proyecto actual
- Plan de acción con checklist para implementar y verificar

---

## 1. Vulnerabilidades y Ataques Comunes (Investigación)

### 1.1 OWASP Top 10 (2024–2025)

| # | Vulnerabilidad | Descripción | Mitigación |
|---|----------------|-------------|------------|
| A01 | Broken Access Control | Acceso no autorizado a recursos | RBAC, verificación en cada capa, RLS |
| A02 | Cryptographic Failures | Criptografía débil o expuesta | TLS, AES-256, no exponer claves |
| A03 | Injection | XSS, SQLi, inyección en intérpretes | Validación, sanitización, CSP |
| A04 | Insecure Design | Diseño inseguro | Defense in depth, DAL |
| A05 | Security Misconfiguration | Configuración incorrecta | Headers, CSP, HSTS |
| A06 | Vulnerable Components | Dependencias vulnerables | npm audit, Snyk |
| A07 | Auth Failures | Fallos de autenticación | MFA, rate limiting, sesiones |
| A08 | Data Integrity | Integridad de datos | Firmas, validación |
| A09 | Logging Failures | Falta de auditoría | Logs de seguridad |
| A10 | SSRF | Server-Side Request Forgery | Validar URLs, whitelist |

### 1.2 Ataques Específicos

- **XSS (Cross-Site Scripting):** `innerHTML`, `eval`, datos no sanitizados → CSP, sanitización.
- **CSRF (Cross-Site Request Forgery):** Peticiones desde sitios maliciosos → SameSite cookies, tokens.
- **SQL Injection:** Consultas con input de usuario → Consultas parametrizadas (Supabase/PostgREST).
- **Clickjacking:** Iframes maliciosos → `X-Frame-Options: DENY`.
- **Man-in-the-Middle:** Tráfico sin cifrar → HTTPS, HSTS.
- **Brute Force:** Ataques de fuerza bruta en login → Rate limiting.
- **IDOR:** Acceso a recursos de otros usuarios → Verificación de pertenencia por empresa/usuario.

---

## 2. Estado Actual del Proyecto (Auditoría)

### 2.1 Autenticación y Autorización

| Aspecto | Estado | Notas |
|---------|--------|-------|
| Middleware auth | ✅ | Redirige a /login si no hay sesión |
| Rutas protegidas | ✅ | Matcher incluye /api/* |
| Server Components | ✅ | Usan `getUser()` / `getUserContext()` |
| API Routes | ⚠️ | Algunas verifican auth explícita, otras confían en middleware |
| DAL (Data Access Layer) | ⚠️ | No hay capa centralizada; cada acción verifica por su cuenta |
| RLS en Supabase | ✅ | Tablas con RLS; admin bypass solo en server |

**Riesgo:** CVE-2025-29927 indica que middleware solo no es suficiente. Se recomienda verificación en cada operación sensible.

### 2.2 Rutas API – Verificación de Auth

| Ruta | Auth explícita | Protegida por middleware |
|------|----------------|---------------------------|
| `/api/facturas/[id]/pdf` | ✅ `getUser()` + `getUserContext()` | ✅ |
| `/api/empresas/datos-fiscales/pdf` | ✅ `getUser()` + `getUserContext()` | ✅ |
| `/api/ventas/clientes/export` | ✅ `getUserContext()` | ✅ |
| `/api/ventas/facturas/export` | ✅ `getUserContext()` | ✅ |
| `/api/clientes/search` | ✅ `getUserContext()` | ✅ |
| `/api/qa` | ❌ | ✅ (middleware) |
| `/api/dev/save-pdf-factura` | ❌ | ✅ | **CRÍTICO: sin guard en producción** |
| `/api/dev/send-3-facturas-email` | ❌ | ✅ | **CRÍTICO: sin guard en producción** |
| `/api/dev/seed-facturas-y-enviar` | ❌ | ✅ | **CRÍTICO: sin guard en producción** |
| `/api/dev/seed-factura-externa` | ✅ | ✅ | ✅ Tiene `NODE_ENV === 'production'` |

### 2.3 Headers de Seguridad

| Header | Estado | Valor actual |
|--------|--------|--------------|
| X-Frame-Options | ✅ | DENY |
| X-Content-Type-Options | ✅ | nosniff |
| Referrer-Policy | ✅ | strict-origin-when-cross-origin |
| Content-Security-Policy | ⚠️ | `unsafe-eval` y `unsafe-inline` (débil) |
| Strict-Transport-Security (HSTS) | ❌ | No configurado |
| Permissions-Policy | ❌ | No configurado |

### 2.4 Inyección y Validación

| Aspecto | Estado | Notas |
|---------|--------|-------|
| `dangerouslySetInnerHTML` | ✅ | Solo en HydrationFix con contenido estático |
| Filtros `.or()` con input usuario | ⚠️ | `search`, `q` interpolados en `.or()`; PostgREST parametriza, pero conviene sanitizar |
| Validación con Zod | ✅ | En acciones críticas (clientes, facturas, etc.) |
| Server Actions bodySizeLimit | ✅ | 4MB |

### 2.5 Secretos y Variables de Entorno

| Variable | Expuesta en cliente | Riesgo |
|----------|--------------------|--------|
| NEXT_PUBLIC_SUPABASE_URL | ✅ | Aceptable (pública) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ | Aceptable (pública, RLS protege) |
| SUPABASE_SERVICE_ROLE_KEY | ❌ | Correcto (solo server) |
| RESEND_API_KEY | ❌ | Correcto |
| GITHUB_TOKEN | ❌ | Correcto |

### 2.6 Service Role (Admin Client)

- Uso de `createAdminClient()` en server (acciones, API, páginas).
- Siempre tras verificación de usuario (`getUserContext`, `getUser()`).
- **Riesgo:** Si alguna ruta usa admin sin verificar auth, se bypassa RLS.

### 2.7 Subida de Archivos (Avatar)

- Tipos permitidos: JPEG, PNG, WebP.
- Límite: 2 MB.
- Bucket `avatars` con RLS por `user_id`.
- Validación en cliente y server.

---

## 3. Checklist de Implementación

### 3.1 Crítico (hacer antes de producción)

- [x] **SEC-001** Deshabilitar rutas `/api/dev/*` en producción (save-pdf, send-3-facturas, seed-facturas-y-enviar) ✅
- [x] **SEC-002** Añadir HSTS en middleware ✅
- [x] **SEC-003** Revisar y endurecer CSP (base-uri, object-src, form-action, upgrade-insecure-requests en prod) ✅
- [x] **SEC-004** Ejecutar `npm audit` y corregir vulnerabilidades críticas/altas ✅
- [x] **SEC-005** Añadir verificación explícita de auth en `/api/qa` (o deshabilitar en producción) ✅

### 3.2 Alto

- [x] **SEC-006** Sanitizar inputs en filtros `.or()` / `.ilike()` (escapar `%`, `_`, comillas) ✅
- [x] **SEC-007** Añadir Permissions-Policy ✅
- [x] **SEC-008** Rate limiting en login (5 intentos/15min por email) ✅
- [x] **SEC-009** Revisar que todas las Server Actions verifiquen auth antes de operar ✅
- [x] **SEC-010** Logs de auditoría para operaciones sensibles (login, logout, export, avatar) ✅

### 3.3 Medio

- [x] **SEC-011** Endurecer CSP con nonces para scripts inline → N/A: Next.js requiere `unsafe-inline` para hydration; HydrationFix usa contenido estático
- [x] **SEC-012** Validar `empresa_id` en todas las consultas multi-empresa ✅ (API clientes/search, empresas/datos-fiscales/pdf)
- [x] **SEC-013** Revisar políticas RLS en Supabase ✅ (facturas, lineas_factura, empresas, usuarios_empresas, clientes_empresas, notificaciones con RLS)
- [x] **SEC-014** Documentar flujo de auth y DAL para el equipo ✅ (ver docs/AUTH_FLUJO.md)
- [x] **SEC-015** Configurar CORS explícitamente → N/A: no hay APIs públicas; todas requieren auth y son same-origin

### 3.4 Bajo / Mejora continua

- [x] **SEC-016** Scripts `security:audit` y `security:check`; Snyk opcional (ver docs/SECURIDAD_MEJORAS_CONTINUAS.md)
- [x] **SEC-017** Script `security:outdated` para revisar dependencias
- [x] **SEC-018** Documentado en docs/SECURIDAD_MEJORAS_CONTINUAS.md (Supabase MFA)
- [x] **SEC-019** Documentado (configuración en Supabase Dashboard)
- [x] **SEC-020** Documentado (Supabase backups, Vercel rollback)

---

## 4. Plan de Verificación (Testing tipo Senior)

### 4.1 Tests Automatizados

- [x] **VER-001** Tests E2E de auth: acceso sin login → redirección a /login ✅ (e2e/seguridad-auth.spec.ts)
- [x] **VER-002** Tests E2E: usuario A no accede a datos de empresa B ✅ (API clientes/search; requiere E2E_NON_ADMIN_EMAIL/PASSWORD en .env.e2e)
- [x] **VER-003** Tests de API: peticiones sin cookie de sesión → 401/403 ✅
- [x] **VER-004** Tests de inyección: inputs con `'`, `%`, `\` en búsquedas ✅ (e2e/seguridad-inyeccion.spec.ts)
- [x] **VER-005** `npm run build` sin errores ✅
- [x] **VER-006** `npm audit` sin vulnerabilidades críticas ✅

### 4.2 Verificación Manual

- [ ] **VER-007** Probar acceso directo a `/api/dev/*` en producción → debe devolver 403
- [ ] **VER-008** Probar `/api/ventas/clientes/export` sin sesión → 401 o redirección
- [ ] **VER-009** Probar IDOR: cambiar `id` en URL de factura por otra empresa
- [ ] **VER-010** Revisar headers en DevTools (Network) en producción
- [ ] **VER-011** Probar subida de archivo no permitido (ej. .exe) → rechazado

### 4.3 Herramientas Recomendadas

| Herramienta | Uso |
|-------------|-----|
| `npm audit` | Vulnerabilidades en dependencias |
| Snyk CLI | Análisis más amplio de dependencias |
| OWASP ZAP | Escaneo de vulnerabilidades web |
| Lighthouse (Chrome) | Mejores prácticas y seguridad |
| Playwright E2E | Tests de flujos críticos |

---

## 5. Mejores Prácticas por Stack

### 5.1 Next.js (App Router)

- Verificar auth en Server Components y Server Actions, no solo en middleware.
- Usar `cookies()` y `headers()` de forma segura.
- No exponer `SUPABASE_SERVICE_ROLE_KEY` ni en `NEXT_PUBLIC_` ni en cliente.
- CSP con nonces para scripts inline cuando sea necesario.

### 5.2 Supabase

- RLS en todas las tablas del esquema público.
- Anon key en cliente; service role solo en server.
- Políticas por `auth.uid()` y por `empresa_id` cuando aplique.
- Buckets de Storage con RLS por carpeta de usuario.

### 5.3 React / Frontend

- Evitar `dangerouslySetInnerHTML` con contenido de usuario.
- Validar y sanitizar inputs antes de enviar al server.
- No almacenar tokens sensibles en `localStorage` (Supabase usa cookies).

---

## 6. Orden de Ejecución Sugerido

1. **Fase 1 (inmediata):** SEC-001, SEC-002, SEC-004, SEC-005
2. **Fase 2 (pre-producción):** SEC-003, SEC-006, SEC-007, SEC-008
3. **Fase 3 (post-lanzamiento):** SEC-009 a SEC-015
4. **Fase 4 (continuo):** SEC-016 a SEC-020, verificaciones periódicas

---

## 7. Referencias

- [OWASP Top 10](https://owasp.org/Top10/)
- [Next.js Security](https://nextjs.org/blog/security-nextjs-server-components-actions)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Content Security Policy (Next.js)](https://nextjs.org/docs/app/guides/content-security-policy)
