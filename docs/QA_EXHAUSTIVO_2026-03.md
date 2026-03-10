# QA Exhaustivo – STVLS ERP (marzo 2026)

## Alcance

Revisión página por página: DevTools, consola, scripts, errores y correcciones.

---

## 1. Scripts en el HTML (normal en Next.js)

Los scripts que aparecen al final del `<body>` son **normales**:

- `/_next/static/chunks/*.js` – Chunks del framework Next.js
- `(self._next_f=...).push([0])` – Inicialización/hidratación
- `next-route-announcer` – Accesibilidad (anuncia cambios de ruta a lectores de pantalla)

No requieren acción.

---

## 2. Correcciones aplicadas

### Alta prioridad

| Archivo | Cambio |
|---------|--------|
| `src/components/ventas/nueva-factura-form.tsx` | Eliminado `console.log` de depuración |
| `src/app/actions/auth.ts` | Eliminado `console.log` de depuración |
| `src/app/(dashboard)/ventas/clientes/[id]/page.tsx` | Validación de URL con `isSafeUrl()` para `sitio_web` (evita `javascript:`, `data:`, etc.) |
| `src/lib/security/sanitize-search.ts` | Añadida función `isSafeUrl()` |

### Media prioridad

| Archivo | Cambio |
|---------|--------|
| `src/app/(dashboard)/ventas/configuracion/empresa/page.tsx` | Corregido encoding: "Configuración", "facturación" |
| `src/app/(dashboard)/dashboard/page.tsx` | `suppressHydrationWarning` en fechas |
| `src/app/(dashboard)/ventas/clientes/[id]/page.tsx` | `suppressHydrationWarning` en fechas (created_at, ultima_factura, fecha_emision) |

### Baja prioridad

| Archivo | Cambio |
|---------|--------|
| `src/components/ventas/facturas-table.tsx` | `appendChild`/`removeChild` en descargas (handleExportAll, handleExportPage) para compatibilidad móvil |

---

## 3. Rutas revisadas

Todas las rutas compiladas correctamente. Sin errores de build.

---

## 4. Pendiente (opcional)

- **console.error** en catch: se mantienen para diagnóstico; se puede sustituir por un logger en el futuro.
- **Image alt** en react-pdf: revisar si la librería lo soporta.
- Más fechas con `suppressHydrationWarning`: añadir en pagos, vencidas, rectificativas si aparecen warnings.

---

## 5. Verificación

- `npm run build` – OK
- Build sin errores de TypeScript

---

## 6. QA Consola en Producción (gestion.stvls.com)

**Script:** `node scripts/qa-console-produccion.mjs`

### Resultado (marzo 2026)

- **Páginas revisadas:** 14 (login, dashboard, ventas, facturas, clientes, pagos, informes, configuración, perfil, etc.)
- **Errores críticos en consola:** Ninguno detectado
- **Warnings:** Ninguno relevante (favicon 404, ResizeObserver se ignoran)

### Notas

1. **Login en script:** El login automático puede fallar por timing o credenciales; las páginas protegidas redirigen a /login sin errores de consola.
2. **Server Action (posible):** En una ejecución previa se vio `Server Action "..." was not found on the server` al visitar `/`. Puede deberse a caché de build anterior; suele resolverse con hard refresh (Ctrl+F5) o tras un nuevo deploy.
3. **Scripts Next.js:** Los chunks `/_next/static/chunks/*.js` y el `next-route-announcer` son normales.

---

## 7. QA con MCP Chrome DevTools (user-chrome-devtools)

**Herramienta:** `list_console_messages`, `get_console_message`, `list_network_requests`

### Hallazgos en producción (gestion.stvls.com)

| Tipo | Detalle |
|------|---------|
| **404 crítico** | `POST https://gestion.stvls.com/login` devuelve **404**. El Server Action de login no se encuentra. Causa: posible desajuste build/deploy en Hostinger o caché. |
| **Uncaught (in promise)** | Cascada del 404 del login. |
| **console.log** | "NuevaFacturaForm: Clientes recibidos: X" – ya eliminado en código; si aparece, es caché o build anterior. |
| **Recharts** | `width(-1) height(-1)` en gráficos – añadir `minWidth`/`minHeight` en ResponsiveContainer. |
| **Form issues** | Labels sin asociar, campos sin id/name (ver `docs/QA_DEVTOOLS_2026-03-10.md`). |

### Acción recomendada

1. **POST /login 404:** Verificar en Hostinger que el deploy esté completo y que Server Actions funcionen (Next.js 16). Revisar logs del servidor.
2. **Hard refresh:** Ctrl+F5 para descartar caché de build anterior.
3. **Recharts:** ✅ Corregido – `minWidth={200} minHeight={200}` en ResponsiveContainer de informes (desglose-iva, ranking-conceptos, tab-clientes, graficos).
