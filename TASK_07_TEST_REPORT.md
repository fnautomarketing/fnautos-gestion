# Informe de Pruebas - TASK 07 Facturas Externas

**Fecha:** 14 feb 2026  
**MCP:** user-chrome-devtools  
**Credenciales:** administracion@stvls.com / TecM@s.$4

---

## 1. Login y navegación

| Paso | Acción | Resultado |
|------|--------|-----------|
| 1.1 | Navegar a /login | OK |
| 1.2 | Rellenar email y contraseña | OK |
| 1.3 | Clic en "Acceder al Portal" | OK |
| 1.4 | Redirección a /dashboard | OK |
| 1.5 | Navegar a /ventas/facturas | OK |

---

## 2. Filtros y estados en lista

| Elemento | Verificación | Resultado |
|----------|--------------|-----------|
| Filtro combobox | Opciones: Todos, Borrador, Emitida, **Externa Emitida**, Parcial, Pagada, Vencida | OK |
| Filtro "Externa Emitida" | URL `?estado=externa-emitida` aplica correctamente | OK |
| Sin facturas externas emitidas | Muestra "No se encontraron facturas" | OK |

---

## 3. Crear factura externa como borrador

| Paso | Acción | Resultado |
|------|--------|-----------|
| 3.1 | Ir a Nueva Factura | OK |
| 3.2 | Activar switch "Factura Externa" | OK |
| 3.3 | Aparece campo "Documento PDF" y texto "Se asignará número..." | OK |
| 3.4 | Seleccionar cliente JEFFREY ESTEBAN BOLAÑOS | OK |
| 3.5 | Concepto: "Servicio de prueba factura externa" | OK |
| 3.6 | Precio: 150 € | OK |
| 3.7 | Total calculado: 181,50 € (150 + 21% IVA) | OK |
| 3.8 | Guardar Borrador | OK |
| 3.9 | **Número asignado: F2026-000** | OK (borrador externo no consume consecutivo) |
| 3.10 | Badge "EXT" + "Pendiente PDF" en tabla | OK |
| 3.11 | Stats actualizadas (Total Facturado 665,50 €) | OK |

---

## 4. Emitir factura externa (parcial)

| Paso | Acción | Resultado |
|------|--------|-----------|
| 4.1 | Ir a detalle de F2026-000 | OK |
| 4.2 | Editar → Subir PDF | OK (archivo seleccionado) |
| 4.3 | Guardar Cambios | Pendiente: botón no se habilitaba al subir PDF |
| 4.4 | **Fix aplicado:** `hayCambios` incluye `!!archivo` en editar-factura-form | OK |
| 4.5 | Emitir Factura sin PDF guardado | Toast: "Debes subir el PDF de la factura externa antes de emitirla" |
| 4.6 | Upload a Supabase Storage | No verificado: bucket `documentos` puede requerir configuración |

**Fix aplicado:** El formulario de edición usaba el bucket `documentos` (inexistente). Se cambió a `facturas-externas`, que existe y tiene políticas RLS para usuarios autenticados (upload + lectura).

---

## 5. Estados y badges verificados

| Estado | Condición | Badge mostrado |
|--------|-----------|----------------|
| Borrador externo sin PDF | `es_externa` + `estado=borrador` + `!archivo_url` | **Pendiente PDF** (ámbar) |
| Externa emitida | `es_externa` + `estado=emitida` | **Externa Emitida** (índigo) |
| Borrador normal | `estado=borrador` | Borrador |

---

## 6. Cambios de código realizados durante las pruebas

1. **editar-factura-form.tsx:** Añadido `!!archivo` a `hayCambios` para que el botón "Guardar Cambios" se habilite al subir un PDF.

---

## 7. Resumen

| Funcionalidad | Estado |
|---------------|--------|
| Login | OK |
| Filtro "Externa Emitida" | OK |
| Crear borrador externa (número 000) | OK |
| Badge "Pendiente PDF" | OK |
| Badge "Externa Emitida" | OK (lógica verificada) |
| Subir PDF en edición | Parcial (fix para habilitar Guardar) |
| Emitir externa con PDF | Pendiente (verificar bucket Supabase) |

---

## 8. Supabase Storage (verificado vía MCP)

| Bucket | Existe | Políticas |
|--------|--------|-----------|
| company-logos | Sí | INSERT/UPDATE/DELETE authenticated |
| comprobantes | Sí | SELECT public, INSERT public |
| facturas-externas | Sí | INSERT authenticated, SELECT authenticated |
| documentos | No | — |

**Corrección:** `editar-factura-form` usaba `documentos`. Actualizado a `facturas-externas`.

---

## 9. Próximos pasos recomendados

1. Probar emisión completa: subir PDF → Guardar → Emitir → verificar número consecutivo (ej. F2026-001).
2. Probar filtro "Externa Emitida" con al menos una factura externa emitida.
