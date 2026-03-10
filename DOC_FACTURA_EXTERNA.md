# Factura Externa: Funcionamiento Actual y Mejoras Propuestas

## 1. Flujo de negocio esperado (según tu descripción)

1. **Reservar número**: Cogemos una serie (ej. V2026) y el próximo número (ej. 0005) de nuestra numeración.
2. **Enviar a empresa externa**: Enviamos ese número (V2026-0005) a una empresa externa que nos hace la factura.
3. **Recibir PDF**: La empresa externa emite la factura y nos envía el PDF.
4. **Registrar en sistema**: Subimos el PDF y damos la factura como "Emitida Externa".

---

## 2. Funcionamiento ACTUAL

### 2.1 Estados de la factura externa

| Estado | Condición | Badge mostrado |
|--------|-----------|----------------|
| **Borrador sin PDF** | `es_externa=true` + `estado=borrador` + `!archivo_url` | **Pendiente PDF** (ámbar) |
| **Borrador con PDF** | `es_externa=true` + `estado=borrador` + `archivo_url` | **Borrador** (gris) |
| **Emitida** | `es_externa=true` + `estado=emitida` | **Externa Emitida** (índigo) |

### 2.2 Serie y número

| Momento | Comportamiento actual |
|---------|------------------------|
| **Borrador** | Se guarda `numero='000'`, `serie` = código de la serie seleccionada (ej. V2026). No se reserva número. |
| **Emitir** | Se llama `obtenerSiguienteNumero()` → se consume el **siguiente** número de la serie. Se ignora cualquier `numero_manual`. |

**Problema**: El número se asigna **al emitir**, no al crear el borrador. No puedes saber qué número enviar a la empresa externa hasta que subas el PDF y emitas.

### 2.3 Visibilidad del formulario "Factura Externa"

- **Serie**: Siempre visible (igual que factura normal).
- **Cliente**: Siempre visible.
- **Subida PDF**: Solo visible cuando `esExterna=true`.
- **Número manual**: Existe en el estado del formulario pero **no se muestra en la UI**. Se envía al backend pero **no se usa**.

### 2.4 Dónde se puede crear/editar

| Contexto | Nueva factura | Editar | Emitir desde borrador |
|----------|---------------|--------|------------------------|
| **Visión Global** | ✅ (selector Empresa en el form) | ⚠️ Depende de la página de detalle | ❌ **Falla**: usa `perfil.empresa_id`, no la empresa de la factura |
| **Empresa seleccionada** (Villegas, Yenifer, Edison) | ✅ | ✅ | ✅ |

**Problema**: `emitirDesdeBorradorAction` filtra por `empresa_id = perfil.empresa_id`. En Visión Global, si la factura es de otra empresa, no la encuentra o el usuario no puede emitirla.

### 2.5 Filtros en listado

- Estado `externa-emitida`: facturas con `estado=emitida` y `es_externa=true`.

### 2.6 Validaciones

- **Emitir externa**: Obligatorio tener `archivo_url` (PDF subido).
- **Borrador externa**: No obligatorio el PDF; se puede guardar y subir después.

---

## 3. Mejoras propuestas para que sea correcto

### 3.1 Flujo de numeración (prioridad alta)

**Objetivo**: Poder saber el número **antes** de enviarlo a la empresa externa.

**Opción A – Reservar al crear borrador (recomendada)**  
1. Al guardar borrador externa: llamar `obtenerSiguienteNumero()` y guardar ese número en el borrador.  
2. Mostrar en la UI: "Número asignado: V2026-0005 (envía este número a la empresa externa)".  
3. Al emitir: usar el número ya guardado, **sin** llamar de nuevo a `obtenerSiguienteNumero()`.

**Opción B – Número manual**  
1. Mostrar campo "Número de factura" cuando `esExterna=true`.  
2. El usuario introduce el número que enviará (ej. 0005).  
3. Validar que no exista ya para esa serie/empresa.  
4. Al emitir: usar ese número, sin consumir de la serie (o actualizar el contador si se desea).

### 3.2 Visión Global y `emitirDesdeBorradorAction`

- Usar `getUserContext()` como en `registrarPagoAction`.  
- Si el usuario está en Visión Global: usar `empresa_id` de la factura.  
- Si no: usar `perfil.empresa_id` como hasta ahora.

### 3.3 UI del formulario

- Si se usa **Opción A**: mostrar claramente el número reservado en el borrador.  
- Si se usa **Opción B**: mostrar y usar el campo "Número manual" que ya existe en el form.  
- Mensaje más claro: "Envía este número a la empresa externa. Cuando recibas el PDF, súbelo y emite la factura."

### 3.4 Resumen de cambios sugeridos

| Área | Cambio |
|------|--------|
| `guardarBorradorAction` | Si `es_externa`: reservar número con `obtenerSiguienteNumero()` y guardarlo en el borrador. |
| `emitirDesdeBorradorAction` | Para externas: no llamar `obtenerSiguienteNumero()`, usar el número del borrador. |
| `emitirDesdeBorradorAction` | Soporte Visión Global: usar `empresa_id` de la factura cuando el usuario es admin global. |
| `crearFacturaAction` | Si `es_externa` y hay `numero_manual`: usarlo en lugar de `obtenerSiguienteNumero()`. |
| `nueva-factura-form` | Mostrar número reservado o campo número manual cuando `esExterna=true`. |

---

## 4. Resumen ejecutivo

**Hoy**:  
- El número se asigna al emitir, no al crear el borrador.  
- No puedes saber qué número enviar a la empresa externa hasta tener el PDF.  
- En Visión Global, emitir desde borrador puede fallar.

**Objetivo**:  
- Reservar o introducir el número al crear el borrador.  
- Mostrarlo claramente para enviarlo a la empresa externa.  
- Al subir el PDF y emitir, usar ese mismo número.  
- Que todo funcione también en Visión Global.
