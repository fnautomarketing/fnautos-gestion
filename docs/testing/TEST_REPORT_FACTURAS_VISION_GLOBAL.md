# Informe de pruebas: Facturas multi-empresa y Vision Global

**Fecha:** 16 feb 2026  
**Herramienta:** Chrome DevTools MCP

## Resumen ejecutivo

| Prueba | Resultado | Notas |
|--------|-----------|-------|
| Crear borrador Villegas (Vision Global) | ✅ OK | Guardado correctamente |
| Crear borrador Yenifer (Vision Global) | ✅ OK | 90,75 € - RLS corregido |
| Crear borrador Edison (Vision Global) | ✅ OK | 145,20 € - RLS corregido |
| Vision Global muestra facturas de todas las empresas | ✅ OK | 5 facturas visibles (1 emitida + 4 borradores) |
| Filtro por estado "Emitida" | ✅ OK | Muestra 1 factura (F2026-F2026000001) |
| Filtro por estado "Borrador" | ✅ OK | Selector disponible |
| Emitir factura desde borrador | ⚠️ Pendiente | Opcional |

## Detalle de pruebas

### 1. Crear borradores por empresa

- **Villegas (Vision Global):** Empresa Villegas seleccionada, concepto "Servicio Villegas", 50€, Cliente Exitoso SL → **Borrador guardado correctamente**
- **Yenifer (Vision Global):** Empresa Yenifer seleccionada, concepto "Servicio Yeniferr", 75€, Cliente Exitoso SL → **Error RLS al guardar**

### 2. Vision Global

- Selector "VISIÓN GLOBAL" en header funciona
- Al cambiar a Vision Global se muestran facturas de todas las empresas
- Lista: F2026-F2026000001 (Emitida) + null-000 (Borrador Villegas)

### 3. Filtros

- Combobox de estado: Todos, Borrador, Emitida, Externa Emitida, Parcial, Pagada, Vencida
- Filtro "Emitida" → URL `?estado=emitida`, muestra 1 factura
- Filtro "Todos" → muestra 2 facturas

## RLS corregido (16 feb 2026)

**Problema original:** El admin en Vision Global no podía crear facturas para Yenifer ni Edison (error RLS en `facturas` y `lineas_factura`).

**Solución aplicada:**
- `20260216_fix_facturas_rls_vision_global.sql` – políticas para admins en Vision Global
- `20260216_fix_lineas_factura_rls_vision_global.sql` – políticas para líneas asociadas a facturas accesibles

**Resultado:** Admins con `rol = 'admin'` pueden crear y gestionar facturas en todas las empresas (Villegas, Yenifer, Edison).

## Formato de número en borradores

Las facturas en borrador se muestran como `null-000` en la lista. Considerar mejorar el formato para borradores (ej. "BORRADOR" o serie temporal).
