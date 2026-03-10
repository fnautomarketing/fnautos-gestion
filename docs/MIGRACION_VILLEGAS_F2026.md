# Migración serie Villegas F2026

Corrige el formato de facturas de Villegas de `F2026-F2026000001` a `F2026-0001`.

## Qué hace

1. Elimina todas las facturas de Villegas y datos relacionados (eventos, pagos, emails, líneas)
2. Ajusta la serie F2026 con `digitos=4` y `numero_actual=1`
3. Marca F2026 como predeterminada para Villegas

## Cómo aplicarla

Si `supabase db push` falla por historial de migraciones, ejecuta el SQL manualmente:

1. Entra en **Supabase Dashboard** → tu proyecto → **SQL Editor**
2. Copia el contenido de `supabase/migrations/20260221_fix_villegas_series_f2026.sql`
3. Pégalo y ejecuta

## Después de aplicar

- Crea una nueva factura para Villegas desde la app
- El número será `F2026-0001`
- Para enviar correos de prueba: `POST /api/dev/seed-facturas-y-enviar` con `{ "to": "tu@email.com" }`
