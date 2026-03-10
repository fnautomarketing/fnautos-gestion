# Checklist: Pagos y Descarga PDF

## 1. Registrar Pago (Pago Total por Transferencia)

### Vision Global
- [x] Villegas V2026-0001: registrar pago total por Transferencia
- [x] Yenifer Y2026-0001: registrar pago total por Transferencia
- [x] Edison E2026-0001: registrar pago total por Transferencia

### Empresa Seleccionada
- [x] Con Villegas seleccionada: registrar pago en facturas Villegas
- [x] Con Yenifer seleccionada: registrar pago en facturas Yenifer
- [x] Con Edison seleccionada: registrar pago en facturas Edison

## 2. Descarga PDF

### Vision Global
- [x] Descargar PDF V2026-0001
- [x] Descargar PDF Y2026-0001
- [x] Descargar PDF E2026-0001

### Empresa Seleccionada
- [x] Con Villegas: descargar PDF facturas Villegas
- [x] Con Yenifer: descargar PDF facturas Yenifer
- [x] Con Edison: descargar PDF facturas Edison

## 3. Cambios realizados

- [x] **pagos.ts**: Soporte Vision Global en `registrarPagoAction` (usa empresa de la factura)
- [x] **pago/page.tsx**: Carga factura sin filtrar por empresa cuando admin en Vision Global
- [x] **Script**: `scripts/run-checklist-pagos.mjs` registra pago total por Transferencia en facturas V2026, Y2026, E2026

---

### Cómo ejecutar

```bash
# Registrar pagos en facturas emitidas (V2026, Y2026, E2026)
node scripts/run-checklist-pagos.mjs
```

### Flujo manual

1. **Vision Global**: Login como admin → Facturas → abrir cada factura → Registrar Pago → Importe total, Transferencia → Guardar
2. **Empresa seleccionada**: Cambiar empresa en header → Facturas → abrir factura → Registrar Pago
3. **Descargar PDF**: En detalle factura → botón "Descargar PDF" → /ventas/facturas/[id]/pdf → "Descargar PDF"
