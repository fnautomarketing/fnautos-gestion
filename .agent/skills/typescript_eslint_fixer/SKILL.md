---
name: typescript_eslint_fixer
description: Skill especializada en corregir AUTOMÁTICAMENTE errores de TypeScript y ESLint en el proyecto fnautos-gestion. Se aplica en CADA modificación de código sin excepción.
---

# TypeScript & ESLint Auto-Fixer Skill

Esta skill define el protocolo **obligatorio y automático** para detectar y corregir todos los errores de TypeScript y ESLint en el proyecto **fnautos-gestion** (Next.js + Supabase).

> ⚠️ **REGLA DE ORO**: Nunca dejar un archivo en peor estado del que estaba. Cada edición debe terminar con **0 errores** de TypeScript y ESLint en los archivos modificados.

---

## 🔴 Protocolo de Corrección Obligatoria

### Paso 1: Detectar errores antes de editar
Antes de modificar cualquier archivo, verifica el estado actual:
```bash
npx eslint src/app/actions --ext .ts,.tsx
npx tsc --noEmit 2>&1 | head -50
```

### Paso 2: Tras cada edición, corregir feedback inmediato
Cuando el IDE reporta «lint errors may be related to your recent edits»:
- **Léelos todos** antes de responder al usuario.
- **Corrígelos en la misma respuesta**, no en la siguiente.
- No uses `eslint-disable` ni `@ts-ignore` como solución permanente.

### Paso 3: Verificación final
Tras terminar una tarea completa:
```bash
npx eslint src/ --ext .ts,.tsx
npx tsc --noEmit
```
Ambos deben retornar **exit code 0** antes de marcar la tarea como completada.

---

## 📋 Patrones de Corrección Específicos del Proyecto

### ❌ `@typescript-eslint/no-explicit-any` — Prohibido usar `any`

**Patrón 1: Supabase RPC sin método tipado**
```typescript
// ❌ MAL
const result = await (supabase as any).rpc('mi_funcion', params)

// ✅ BIEN
type RpcCall = (name: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>
const result = await (supabase as unknown as { rpc: RpcCall }).rpc('mi_funcion', params)
```

**Patrón 2: Tabla no incluida en tipos generados (ej: `clientes_empresas`)**
```typescript
// ❌ MAL
await (adminClient.from as any)('clientes_empresas').insert(data)

// ✅ BIEN
const flexClient = adminClient as unknown as import('@supabase/supabase-js').SupabaseClient
await flexClient.from('clientes_empresas').insert(data)
```

**Patrón 3: Insert/Update con campos extra no en el tipo**
```typescript
// ❌ MAL
await supabase.from('facturas').insert(data as any)

// ✅ BIEN — cast doble via unknown
await supabase.from('facturas').insert(
  data as unknown as Database['public']['Tables']['facturas']['Insert']
)
```

**Patrón 4: Acceso a propiedad desconocida en objeto**
```typescript
// ❌ MAL
if ((obj as any).propiedad) { ... }

// ✅ BIEN — narrowing con 'in'
if ('propiedad' in obj && obj.propiedad) { ... }
```

**Patrón 5: Errores de Zod sin `any`**
```typescript
// ❌ MAL
message = (error as any).errors?.[0]?.message || error.message

// ✅ BIEN — intersección tipada
const zodErr = error as Error & { issues?: { message: string }[] }
message = zodErr.issues?.[0]?.message ?? error.message
```

**Patrón 6: Callbacks de arrays con tipo implícito**
```typescript
// ❌ MAL
items.reduce((sum, item: any) => sum + item.valor, 0)

// ✅ BIEN
items.reduce((sum: number, item: { valor: number }) => sum + item.valor, 0)
```

**Patrón 7: Variables de estado con tipo amplio**
```typescript
// ❌ MAL
const actualizacion: Record<string, any> = {}

// ✅ BIEN
const actualizacion: Record<string, unknown> = {}
```

### ❌ `@typescript-eslint/no-unused-vars` — Variables no usadas

```typescript
// ❌ MAL — variables desestructuradas que no se usan
const { supabase, userId, rol, empresaId } = await getUserContext()

// ✅ BIEN — solo desestructura lo que uses
const { supabase, empresaId } = await getUserContext()

// ✅ BIEN — si debes ignorar una en desestructuración de array
const [_, segundo] = array  // prefijo _ para ignorados
```

### ❌ `SelectQueryError` — Columna no existe en los tipos de Supabase

Cuando Supabase genera un `SelectQueryError<"column 'X' does not exist on 'Y'">`:
```typescript
// ❌ MAL — columna que no está en el tipo generado
.select('id, razon_social, prefijo_serie')  // si prefijo_serie no existe en el tipo

// ✅ BIEN — quita la columna del select y accede via narrowing
.select('id, razon_social')
// luego: const prefijo = 'prefijo_serie' in empresa ? String(empresa.prefijo_serie) : fallback
```

---

## 🔵 Tipos de Supabase del Proyecto

Importar desde:
```typescript
import type { Database } from '@/types/supabase'
import type { Tables } from '@/types/supabase'

// Tipos de tabla
type FacturaInsert = Database['public']['Tables']['facturas']['Insert']
type FacturaUpdate = Database['public']['Tables']['facturas']['Update']
type FacturaRow    = Database['public']['Tables']['facturas']['Row']
```

Tablas **NO** incluidas en los tipos generados (usar `SupabaseClient` genérico):
- `clientes_empresas`
- `pagos_factura`
- `recordatorios`
- `pagos` (usar cast a `SupabaseClient` genérico)

---

## 🟡 Checklist de Salida — NO dar la tarea por terminada sin esto

- [ ] `npx eslint src/app/actions --ext .ts,.tsx` → **0 errores** relacionados con `any` o `unused-vars` en archivos editados
- [ ] `npx tsc --noEmit` → **0 errores** de TypeScript
- [ ] No se ha usado `eslint-disable` ni `@ts-ignore` sin justificación documentada
- [ ] Todos los `as any` nuevos han sido reemplazados por alternativas tipadas
- [ ] En archivos de test: usar `unknown` o tipos específicos en lugar de `any` donde sea posible

---

## ⚡ Comandos de Verificación Rápidos

```bash
# Ver solo errores de 'any' y unused-vars en actions
npx eslint src/app/actions --ext .ts,.tsx --rule '{"@typescript-eslint/no-explicit-any": "error"}' 2>&1

# Verificar TypeScript sin compilar
npx tsc --noEmit 2>&1 | grep -E "error TS"

# Ver resumen de errores por archivo
npx eslint src/ --ext .ts,.tsx -f json | node -e "
const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
d.filter(f=>f.errorCount>0).forEach(f=>console.log(f.filePath.split('/src/')[1]+': '+f.errorCount+' errores'))
"
```
