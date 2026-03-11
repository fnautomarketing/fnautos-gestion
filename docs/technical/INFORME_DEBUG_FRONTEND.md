
# 🐞 Informe de Debugging: Selector de Empresa Vacío

## 1. El Problema
El usuario reporta que el selector de "Empresa Emisora" en el formulario de Nueva Factura aparece vacío o no muestra ninguna opción, impidiendo la creación de facturas vinculadas a una empresa.

## 2. Diagnóstico Técnico

### A. Verificación de Datos (Backend)
Se ha ejecutado un script de diagnóstico interno (`scripts/verify-invoice-creation.js`) que confirma:
1.  El usuario tiene un perfil asociado a una `empresa_id`.
2.  La empresa existe y tiene clientes asociados.
3.  El registro de vinculación en la tabla `usuarios_empresas` **EXISTE** (confirmado al intentar insertarlo de nuevo y recibir un error de clave duplicada).

### B. Análisis del Fallo en Frontend
El componente `EmpresaSelector` utiliza la Server Action `listarEmpresasUsuarioAction`. Esta acción intenta leer la tabla `usuarios_empresas` usando el contexto del usuario autenticado (cookies).

*   **Comportamiento observado:** La query devuelve un array vacío `[]` al frontend, a pesar de que el registro existe en la base de datos.
*   **Causa Raíz:** **Bloqueo por RLS (Row Level Security)**.
    *   Las tablas `usuarios_empresas` y/o `empresas` tienen políticas de seguridad que impiden que el usuario *lea* sus propios registros de vinculación.
    *   Al no poder leer el registro `usuarios_empresas`, el sistema hace un fallback al perfil antiguo, pero la función `getUserContext` devuelve `empresas: []` en ese caso de fallback, provocando que el selector se renderice vacío.

## 3. Plan de Corrección (SQL)

Para solucionar esto, es necesario aplicar las siguientes políticas de seguridad en la base de datos Supabase:

```sql
-- 1. Permitir al usuario ver sus propias vinculaciones en 'usuarios_empresas'
create policy "Usuarios pueden ver sus propias vinculaciones"
on usuarios_empresas for select
using ( auth.uid() = user_id );

-- 2. Permitir al usuario ver la información de las empresas a las que pertenece
create policy "Usuarios pueden ver empresas a las que pertenecen"
on empresas for select
using (
  id in (
    select empresa_id from usuarios_empresas
    where user_id = auth.uid()
  )
);
```

## 4. Mejoras Propuestas para el Código (Refactorización)

El archivo `src/app/actions/usuarios-empresas.ts` tiene un manejo de fallback incompleto que oculta este error. Debería mejorarse para que, si falla la lectura de `usuarios_empresas` pero existe `perfil.empresa_id`, construya un objeto de empresa temporal para que el usuario no quede bloqueado.

**Cambio sugerido en `getUserContext`:**

```typescript
// Si usuarios_empresas falla pero hay perfil
if (!userEmpresas || userEmpresas.length === 0) {
    // ... obtener perfil ...
    
    // Si hay empresa en perfil, intentar cargar sus datos aunque no esté en usuarios_empresas
    const { data: empresaDatos } = await supabase.from('empresas').select('*').eq('id', perfil.empresa_id).single()
    
    return {
        // ...
        // EN LUGAR DE "empresas: []", devolver:
        empresas: [{
            id: perfil.empresa_id,
            rol: perfil.rol,
            empresa_activa: true,
            empresa: empresaDatos // Datos mínimos para el selector
        }]
    }
}
```

## 5. Próximos Pasos
1.  Ejecutar las sentencias SQL de RLS en el panel de Supabase SQL Editor.
2.  Verificar nuevamente el frontend.
