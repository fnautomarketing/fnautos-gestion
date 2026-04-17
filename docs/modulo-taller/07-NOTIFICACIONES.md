# 07 — Notificaciones y Comunicación

## 7.1 Emails Automatizados del Módulo Taller

El módulo de taller envía emails transaccionales en momentos clave del ciclo de vida de la reparación. Todos se envían a través de **Resend** (ya integrado en el ERP).

---

## 7.2 Catálogo de Emails

### EMAIL 1: Confirmación de Recepción del Vehículo

**Disparo**: Automático al crear la Orden de Reparación  
**Destinatario**: Cliente  
**Adjunto**: Resguardo de Depósito (PDF)

```
Asunto: ✅ Su vehículo ha sido recibido — OR-2026-0015

───────────────────────────────────────────────────

Estimado/a Juan García,

Le confirmamos que su vehículo ha sido recibido en nuestro taller
y se encuentra en custodia bajo las siguientes condiciones:

  🚗 Vehículo: BMW 320d — Matrícula: 1234 ABC
  📅 Fecha de recepción: 14 de abril de 2026
  🔧 Motivo: Ruido al frenar
  📋 Orden de Reparación: OR-2026-0015
  📅 Fecha estimada de entrega: 18 de abril de 2026

Adjuntamos el resguardo de depósito de su vehículo.

Próximos pasos:
  → Nuestro equipo técnico realizará un diagnóstico
  → Le enviaremos un presupuesto detallado para su aprobación
  → No se realizará ningún trabajo sin su autorización previa

Para cualquier consulta, contacte con nosotros:
📞 [Teléfono del taller]
📧 [Email del taller]

Atentamente,
FNAUTOS Taller
[Dirección]

───────────────────────────────────────────────────
```

---

### EMAIL 2: Presupuesto para Aprobación

**Disparo**: Manual (botón "Enviar presupuesto al cliente")  
**Destinatario**: Cliente  
**Adjunto**: Presupuesto Previo (PDF)

```
Asunto: 📋 Presupuesto de reparación — OR-2026-0015 | BMW 320d

───────────────────────────────────────────────────

Estimado/a Juan García,

Hemos realizado el diagnóstico de su vehículo y le enviamos
el presupuesto detallado para su revisión:

  🚗 BMW 320d — 1234 ABC

  RESUMEN DEL PRESUPUESTO
  ───────────────────────
  Mano de obra:          210,00 €
  Piezas y recambios:    256,90 €
  ─────────────────────────────
  Base Imponible:        466,90 €
  IVA (21%):              98,05 €
  ═════════════════════════════
  TOTAL:                 564,95 €

  📅 Validez del presupuesto: hasta el 30/04/2026

Para continuar con la reparación, necesitamos su confirmación:

  ✔️ [ACEPTAR PRESUPUESTO]    → Botón/enlace a página pública de aceptación
  ❌ [RECHAZAR PRESUPUESTO]   → Botón/enlace a página pública de rechazo

  (También puede contactarnos por teléfono para confirmar)

Adjuntamos el presupuesto detallado en PDF con el desglose
completo de trabajos y piezas.

📞 [Teléfono] | 📧 [Email]

Atentamente,
FNAUTOS Taller

───────────────────────────────────────────────────
```

---

### EMAIL 3: Avería Adicional Detectada

**Disparo**: Manual (cuando el mecánico reporta avería adicional y el gestor decide informar)  
**Destinatario**: Cliente

```
Asunto: ⚠️ Avería adicional detectada — OR-2026-0015

───────────────────────────────────────────────────

Estimado/a Juan García,

Durante la reparación de su vehículo BMW 320d (1234 ABC),
nuestro equipo técnico ha detectado un problema adicional
que requiere su atención:

  ⚠️ AVERÍA DETECTADA:
  Desgaste irregular en el disco de freno izquierdo,
  indicativo de un posible problema en la mordaza
  de freno. Se recomienda su sustitución.

  💰 COSTE ADICIONAL ESTIMADO:
  Mano de obra:        52,50 €
  Mordaza freno izq.:  185,00 €
  ─────────────────────────────
  Adicional (+ IVA):   237,50 € + 49,88 € IVA = 287,38 €

  ⏱️ Tiempo adicional estimado: 1,5 horas

🔒 No procederemos con esta reparación adicional sin su
autorización expresa, conforme al Real Decreto 1457/1986.

  ✅ Si desea APROBAR → Responda "ACEPTO" o llámenos
  ❌ Si desea RECHAZARLO → No se realizará este trabajo

Seguiremos con la reparación original aprobada mientras
esperamos su respuesta.

📞 [Teléfono] | 📧 [Email]

Atentamente,
FNAUTOS Taller

───────────────────────────────────────────────────
```

---

### EMAIL 4: 🔔 Vehículo Listo para Recoger

**Disparo**: Manual (botón "🔔 Notificar al cliente — Coche listo")  
**Destinatario**: Cliente  
**Este es el email más importante del flujo**

```
Asunto: 🟢 Su vehículo está listo para recoger — 1234 ABC

───────────────────────────────────────────────────

Estimado/a Juan García,

¡Buenas noticias! Su vehículo ya está listo para recoger:

  🚗 BMW 320d — 1234 ABC
  📋 Orden: OR-2026-0015

  TRABAJOS REALIZADOS
  ───────────────────
  ✅ Inspección completa del sistema de frenos
  ✅ Sustitución de pastillas de freno delanteras
  ✅ Sustitución de discos de freno delanteros
  ✅ Purga del circuito de frenos
  ✅ Verificación del nivel de líquido de frenos
  ✅ Prueba de rodaje satisfactoria

  💰 IMPORTE TOTAL: 564,95 € (IVA incluido)
  
  🛡️ GARANTÍA: 3 meses o 2.000 km
     (Válida hasta: 18/07/2026 o 89.460 km)

  📅 HORARIO DE RECOGIDA:
  Lunes a Viernes: 9:00 — 19:00
  Sábados: 9:00 — 14:00

  📍 DIRECCIÓN:
  [Dirección del taller]

Recuerde traer:
  • DNI o documento identificativo
  • Resguardo de depósito (si lo tiene en papel)

¿Tiene alguna pregunta sobre la reparación?
📞 [Teléfono] | 📧 [Email]

¡Gracias por confiar en FNAUTOS!

───────────────────────────────────────────────────
```

---

### EMAIL 5: Factura del Taller

**Disparo**: Manual (botón "📧 Enviar factura" en el detalle de la factura)  
**Destinatario**: Cliente  
**Adjunto**: Factura de Taller (PDF)

```
Asunto: 🧾 Factura FT-2026-0001 — FNAUTOS Taller

───────────────────────────────────────────────────

Estimado/a Juan García,

Le adjuntamos la factura correspondiente a la reparación
realizada en su vehículo:

  🚗 BMW 320d — 1234 ABC
  🧾 Factura: FT-2026-0001
  📅 Fecha: 18/04/2026

  RESUMEN
  ───────
  Mano de obra:     210,00 €
  Piezas:           256,90 €
  Base imponible:   466,90 €
  IVA (21%):         98,05 €
  ══════════════════════════
  TOTAL:            564,95 €

  💳 Pagado mediante: Tarjeta

  🛡️ Garantía: 3 meses / 2.000 km
     (18/04/2026 — 18/07/2026)

Conserve esta factura como justificante de pago y garantía
durante un mínimo de 6 años (obligación legal).

📞 [Teléfono] | 📧 [Email]

Atentamente,
FNAUTOS Taller

───────────────────────────────────────────────────
```

---

## 7.3 Notificaciones Internas del Sistema

Además de los emails al cliente, el sistema genera notificaciones internas (en la tabla `notificaciones` existente):

| Evento | Notificación a | Mensaje |
|--------|----------------|---------|
| Nueva orden creada | Gestor del taller | "Nueva OR-2026-0015: BMW 320d — Ruido al frenar" |
| Presupuesto aceptado | Gestor del taller | "✅ Presupuesto aceptado: OR-2026-0015" |
| Presupuesto rechazado | Gestor del taller | "❌ Presupuesto rechazado: OR-2026-0015" |
| Avería adicional | Gestor del taller | "⚠️ Avería detectada por [Mecánico] en OR-2026-0015" |
| Todas las tareas completadas | Gestor del taller | "🔧 Tareas completadas en OR-2026-0015 — Pendiente QA" |
| Factura pagada | Gestor del taller | "💰 Pago recibido: FT-2026-0001 — 564,95 €" |
| Stock bajo de pieza | Gestor del taller | "📦 Stock bajo: Pastillas Brembo P 06 075 (quedan 2)" |

---

## 7.4 Plantillas de Email (Resend)

Todas las plantillas siguen estos principios:
- **Responsive**: Se ven perfectas en móvil y desktop
- **Branding**: Colores y logo de FNAUTOS
- **Plain text fallback**: Para clientes con email sin HTML
- **Firma consistente**: Misma estructura que los emails actuales de facturas y contratos
- **Anti-spam**: Headers correctos, sin exceso de imágenes, texto equilibrado

### Implementación Técnica

Se crearán componentes de email reutilizables en:
```
src/lib/email/templates/
├── taller/
│   ├── recepcion-vehiculo.tsx     → Email 1
│   ├── presupuesto.tsx            → Email 2
│   ├── averia-adicional.tsx       → Email 3
│   ├── vehiculo-listo.tsx         → Email 4
│   └── factura-taller.tsx         → Email 5
```

Cada template recibe como props los datos de la orden, el cliente, y el vehículo, y renderiza un email HTML responsivo usando el mismo sistema que las plantillas actuales de facturas.

---

## 7.5 Emails Adicionales (Mejora)

### EMAIL 6: Recordatorio de Recogida

**Disparo**: Automático — 7 días después de notificar "coche listo" sin recogida  
**Destinatario**: Cliente

```
Asunto: ⏰ Recordatorio: Su vehículo está listo para recoger — 1234 ABC

─────────────────────────────────────────────────

Estimado/a Juan García,

Le recordamos que su vehículo BMW 320d (1234 ABC) lleva
esperando a ser recogido desde el [FECHA NOTIFICACIÓN].

  📅 HORARIO DE RECOGIDA:
  Lunes a Viernes: 9:00 — 19:00
  Sábados: 9:00 — 14:00

  📍 [Dirección del taller]

Si necesita aplazar la recogida, por favor contacte con
nosotros para coordinar.

📞 [Teléfono] | 📧 [Email]

Atentamente,
FNAUTOS Taller

─────────────────────────────────────────────────
```

---

### EMAIL 7: Presupuesto Caducado

**Disparo**: Automático — al cumplirse los 12 días hábiles de validez sin respuesta  
**Destinatario**: Cliente

```
Asunto: ⚠️ Su presupuesto ha caducado — OR-2026-0015

─────────────────────────────────────────────────

Estimado/a Juan García,

Le informamos que el presupuesto enviado el [FECHA EMISIÓN]
para su vehículo BMW 320d (1234 ABC) ha superado el plazo
de validez de 12 días hábiles.

  💰 Importe del presupuesto: 564,95 €
  📅 Válido hasta: [FECHA CADUCIDAD]

Si aún desea proceder con la reparación, contacte con
nosotros para emitir un nuevo presupuesto actualizado.

Puede recoger su vehículo en nuestro horario habitual.

📞 [Teléfono] | 📧 [Email]

Atentamente,
FNAUTOS Taller

─────────────────────────────────────────────────
```

---

## 7.6 Página Pública de Aceptación/Rechazo de Presupuesto

Similar al sistema de **firma digital de contratos** ya existente en el ERP, se crea una página pública acc para que el cliente acepte o rechace el presupuesto sin necesidad de responder al email:

**Ruta**: `/presupuesto/[token]`

Flujo:
1. Al enviar el presupuesto, se genera un **token único** seguro
2. El email incluye botones con el enlace `https://[dominio]/presupuesto/[token]`
3. La página muestra el resumen del presupuesto y dos botones: **Aceptar** / **Rechazar**
4. Al aceptar, se puede solicitar **firma digital** (react-signature-canvas, ya integrado)
5. Se actualiza el estado de la orden automáticamente
6. Se notifica al gestor del taller

---

## 7.7 Estructura Final de Templates

```
src/lib/email/templates/
├── taller/
│   ├── recepcion-vehiculo.tsx     → Email 1
│   ├── presupuesto.tsx            → Email 2
│   ├── averia-adicional.tsx       → Email 3
│   ├── vehiculo-listo.tsx         → Email 4
│   ├── factura-taller.tsx         → Email 5
│   ├── recordatorio-recogida.tsx  → Email 6 (nuevo)
│   └── presupuesto-caducado.tsx   → Email 7 (nuevo)
```

---

## 7.8 Rate Limiting y Protección Anti-Spam

| Regla | Descripción |
|-------|-------------|
| **Máx. 1 email de recepción por orden** | No reenviar automáticamente |
| **Máx. 3 presupuestos por orden** | Incluye reenvíos y actualizaciones |
| **Máx. 2 notificaciones "coche listo"** | Incluye el recordatorio |
| **Cooldown de 1 hora** | Entre emails manuales a un mismo cliente |
| **Log de envíos** | Todos los emails se registran en `eventos_orden` con timestamp |
