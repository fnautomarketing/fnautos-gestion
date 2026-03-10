# QA DevTools - gestion.stvls.com
**Fecha:** 10 marzo 2026  
**Entorno:** Producción (Hostinger)

## Resumen ejecutivo

| Página | Consola | Red | Estado |
|--------|---------|-----|--------|
| Login | ✅ Sin errores | ✅ OK | OK |
| Dashboard | ⚠️ 1 issue + 5 Recharts | ✅ OK | Corregido en código |
| Facturas | ⚠️ 4 labels + 2 id/name | ✅ OK | Pendiente |
| Clientes | ✅ Sin errores | ✅ OK | OK |
| Pagos | ⚠️ 3 id/name | ✅ OK | Pendiente |
| Informes | ✅ Resumen OK | ✅ OK | OK |
| Informes > Ventas | ⚠️ 2 Recharts | ✅ OK | Pendiente |
| Config Empresa | ⚠️ 5 issues (labels, autocomplete, id) | ✅ OK | Pendiente |
| Config Series | ✅ Sin errores | ✅ OK | OK |
| Nueva Factura | ⚠️ 7 labels + 7 id/name + 2 label for | ✅ OK | Pendiente |
| Perfil | ✅ Sin errores | ✅ OK | OK |

---

## Correcciones ya aplicadas (en código local)

1. **robots.txt** – `disallow: '/'` (sitio privado, no indexar)
2. **Login** – Botón mostrar/ocultar contraseña: `aria-label`
3. **Login** – Orden headings h4→h3
4. **Login** – noise.svg auto-hospedado (sin dependencia Vercel)
5. **Sidebar** – Contraste "Principal"/"Herramientas": `text-slate-400`
6. **Navbar** – Input búsqueda: `id`, `name`, `aria-label`
7. **Dashboard** – Recharts: `minWidth`/`minHeight` en ResponsiveContainer
8. **Dashboard KPI** – Sparklines: dimensiones mínimas

---

## Issues pendientes (para futuras iteraciones)

### Facturas
- 4 campos sin label asociado
- 2 campos sin id/name (comboboxes Serie, Orden, Por página)

### Pagos
- 3 campos sin id/name (búsqueda, combobox método)

### Configuración Empresa
- 1 campo sin label
- 2 campos sin autocomplete
- 4 campos sin id/name
- 4–6 usos incorrectos de `<label for>`

### Nueva Factura
- 7 campos sin label
- 7 campos sin id/name
- 2 usos incorrectos de `<label for>`

### Informes > Ventas
- 2 ResponsiveContainer Recharts sin minWidth/minHeight

---

## Red

- Todas las peticiones 200 (excepto posibles timeouts en navegación)
- Tras deploy: noise.svg local (sin grainy-gradients.vercel.app)
