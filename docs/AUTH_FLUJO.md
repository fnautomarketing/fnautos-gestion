# Flujo de Autenticación y Autorización – STVLS ERP

## 1. Capas de Protección

1. **Middleware** (`middleware.ts`): Verifica sesión Supabase antes de cada request. Si no hay usuario → redirige a `/login`. Si hay usuario en `/login` → redirige a `/dashboard`.
2. **Server Components:** Cada página llama a `getUser()` o `getUserContext()` y redirige si no hay usuario.
3. **Server Actions:** Todas las acciones sensibles llaman a `getUserContext()` o `getEmpresaId()` o `getUser()` antes de operar.
4. **API Routes:** Verifican auth explícitamente con `getUserContext()` o `getUser()` antes de devolver datos.
5. **Supabase RLS:** Las tablas tienen políticas RLS; el cliente anon solo accede a datos permitidos. El admin client (service_role) bypassa RLS y solo se usa en server tras verificar auth.

## 2. Helpers

- `getUserContext()`: Devuelve usuario, empresas, empresaId, rol, isAdmin. Lanza si no autenticado.
- `getEmpresaId()`: Devuelve supabase, empresaId (y opcionalmente userId). Lanza si no autenticado o sin empresa.
- `createAdminClient()`: Solo en server. Bypasea RLS. Usar solo tras verificar auth.

## 3. Rutas Especiales

- `/api/dev/*`: Deshabilitadas en producción (403).
- `/api/qa`: Deshabilitada en producción (403).
- `/login`, `/registro`: Excluidas del redirect de auth (middleware).
