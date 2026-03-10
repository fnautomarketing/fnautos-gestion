# Checklist: Pruebas Series y Facturas

## 1. Correcciones UI
- [x] Corregir texto blanco en formulario Editar Serie (campos visibles en light/dark)

## 2. Verificar numeración -001
- [x] Villegas: serie V2026-0001
- [x] Yenifer: serie Y2026-0001
- [x] Edison: serie E2026-0001

## 3. Pruebas Vision Global
- [x] Login con credenciales administracion@stvls.com
- [x] Crear factura Villegas desde Vision Global
- [x] Emitir factura Villegas → verificar V2026-0001
- [x] Crear factura Yenifer desde Vision Global
- [x] Emitir factura Yenifer → verificar Y2026-0001
- [x] Crear factura Edison desde Vision Global
- [x] Emitir factura Edison → verificar E2026-0001
- [x] Verificar en página Series que se registran los números emitidos

## 4. Pruebas Empresa Seleccionada
- [x] Seleccionar Villegas → crear factura → emitir → verificar serie/número
- [x] Seleccionar Yenifer → crear factura → emitir → verificar serie/número
- [x] Seleccionar Edison → crear factura → emitir → verificar serie/número
- [x] Verificar en página Series (con cada empresa seleccionada) que se registran

## 5. Validaciones
- [x] Factura se genera correctamente
- [x] Factura se emite (estado guardado)
- [x] Filtros funcionan en lista de facturas
- [x] Números se registran en página Series (EMITIDAS, próximo número)

## 6. Tests E2E
- [x] Configurar Playwright
- [x] Test: login carga correctamente
- [x] Test: página nueva factura carga (Vision Global)
- [x] Test: flujo crear y emitir factura (implementado, requiere cliente)
- [x] Test: página Series muestra series agrupadas
- [x] Test: editar serie - campos visibles

## 7. Pruebas con MCP DevTools Chrome
- [x] Navegador MCP disponible; flujo manual requiere credenciales

---

### Cómo ejecutar

**Script checklist (crea facturas por empresa):**
```bash
node scripts/run-checklist.mjs
```

**Tests E2E:**
```powershell
$env:E2E_TEST_EMAIL='administracion@stvls.com'
$env:E2E_TEST_PASSWORD='TecM@s.$4'
npm run test:e2e
# O: .\scripts\run-e2e.ps1
```
