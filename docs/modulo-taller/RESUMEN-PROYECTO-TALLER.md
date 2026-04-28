# 🔧 FNAUTOS — Módulo de Taller Profesional

### Propuesta de Desarrollo · Abril 2026

---

> **¿Qué es esto?**  
> Un nuevo módulo dentro del ERP de FNAUTOS que permitirá gestionar **todo el proceso de reparación de vehículos** de forma profesional: desde que el cliente trae su coche hasta que lo recoge reparado. Incluye presupuestos, facturación con NIF propio del taller, panel para mecánicos, notificaciones automáticas al cliente y cumplimiento de toda la normativa legal española.

---

## 📋 Índice

1. [¿Qué va a poder hacer el taller con esto?](#1-qué-va-a-poder-hacer-el-taller-con-esto)
2. [El recorrido completo: desde que llega el coche hasta que se lo lleva el cliente](#2-el-recorrido-completo)
3. [Lo que verá el gestor del taller](#3-lo-que-verá-el-gestor-del-taller)
4. [Lo que verá el mecánico en su tablet](#4-lo-que-verá-el-mecánico-en-su-tablet)
5. [Facturación independiente con NIF del taller](#5-facturación-independiente-con-nif-del-taller)
6. [Los documentos PDF que se generan](#6-los-documentos-pdf-que-se-generan)
7. [Emails automáticos al cliente](#7-emails-automáticos-al-cliente)
8. [Presupuestos: el cliente acepta desde su móvil](#8-presupuestos-el-cliente-acepta-desde-su-móvil)
9. [Historial del vehículo y garantías](#9-historial-del-vehículo-y-garantías)
10. [Métricas y rentabilidad del taller](#10-métricas-y-rentabilidad-del-taller)
11. [Cumplimiento legal — todo en regla](#11-cumplimiento-legal)
12. [Calendario de desarrollo](#12-calendario-de-desarrollo)

---

## 1. ¿Qué va a poder hacer el taller con esto?

En resumen, **gestionar todo el negocio del taller desde el ordenador o la tablet**, como lo hacen los talleres más profesionales de España, pero integrado en nuestro propio ERP.

### Lo que se podrá hacer:

| Función | Descripción |
|---------|-------------|
| ✅ **Abrir órdenes de reparación** | Registrar la entrada de un coche con todos sus datos, fotos del estado y motivo de entrada |
| ✅ **Hacer presupuestos** | Con desglose de mano de obra y piezas, que el cliente puede aceptar o rechazar desde su móvil |
| ✅ **Asignar tareas a mecánicos** | Cada mecánico ve en su tablet qué tiene que hacer, en qué orden, y marca cuando termina |
| ✅ **Facturar con NIF propio** | Las facturas del taller salen con el NIF del taller, separadas de las de vehículos |
| ✅ **Enviar emails automáticos** | "Hemos recibido su coche", "Su presupuesto está listo", "Su coche está listo para recoger" |
| ✅ **Controlar garantías** | 3 meses ó 2.000 km automáticos, como exige la ley |
| ✅ **Ver el historial** | Todas las reparaciones de un coche, por matrícula, de un vistazo |
| ✅ **Ver la rentabilidad** | Cuánto facturamos al mes, tiempo medio de reparación, productividad de cada mecánico |

---

## 2. El recorrido completo

Así funciona paso a paso, desde que el cliente llega hasta que se va con su coche reparado:

### 📍 PASO 1 — El cliente trae el coche

El gestor del taller abre una **Nueva Orden de Reparación** en el sistema:

- Busca al cliente (si ya existe) o lo crea nuevo
- Escribe la matrícula → **el sistema busca automáticamente si ese coche ya ha estado aquí antes** y rellena todos los datos (marca, modelo, color, VIN...)
- Si es un coche nuevo, se rellena una vez y queda guardado para siempre
- Se apuntan los kilómetros del coche al entrar
- Se describe el problema: *"Ruido al frenar"*, *"Luz de motor encendida"*, *"Revisión ITV"*
- Se pueden **tomar fotos** del estado del coche (arañazos, golpes previos) para que quede constancia
- Se elige la prioridad: urgente, alta, normal o baja

El sistema genera automáticamente:
- Un **número de orden** correlativo (OR-2026-0001, OR-2026-0002, etc.)
- Un **resguardo de depósito** en PDF para que el cliente firme
- Un **email al cliente** confirmando que hemos recibido su vehículo

### 📍 PASO 2 — Se prepara el presupuesto

El gestor del taller crea el presupuesto:

- Selecciona los trabajos a realizar del **catálogo de servicios** (ej: "Cambio de pastillas de freno — 2h — 80€/h")
- Añade las **piezas necesarias** del catálogo (ej: "Pastillas Brembo P85020 — 45,90€ x 2")
- El sistema calcula automáticamente: mano de obra + piezas + IVA = **total del presupuesto**
- Se genera un **PDF del presupuesto** con todo el desglose

### 📍 PASO 3 — El cliente acepta o rechaza

El presupuesto se envía por email al cliente. El email incluye **dos botones**:

- 🟢 **ACEPTAR PRESUPUESTO** → El cliente hace clic, ve el resumen en una página web y puede firmar digitalmente para aceptar
- 🔴 **RECHAZAR PRESUPUESTO** → El cliente hace clic y el coche se devuelve sin coste

> **Esto funciona igual que la firma de contratos que ya tenemos**: una página web pública donde el cliente ve los datos y firma con el dedo en el móvil.

Si el cliente no contesta en **12 días hábiles**, el presupuesto caduca automáticamente y se le envía un aviso.

### 📍 PASO 4 — Se repara el coche

Una vez aceptado el presupuesto:

- El gestor **asigna cada tarea a un mecánico** concreto
- El mecánico ve sus tareas en su tablet (Paso 4 detallado más abajo)
- Si durante la reparación el mecánico **descubre una avería nueva** que no estaba en el presupuesto:
  - Lo reporta desde su tablet
  - El gestor recibe una alerta
  - Se crea un nuevo mini-presupuesto y se envía al cliente para aprobación
  - Solo se repara si el cliente acepta

### 📍 PASO 5 — Revisión de calidad

Cuando el mecánico termina todas las tareas, la orden pasa a **revisión de calidad**:

- El gestor o jefe de taller revisa que todo está bien
- Si algo no está correcto, lo devuelve al mecánico con una nota
- Si todo está bien, aprueba la revisión

### 📍 PASO 6 — Se factura

Se genera la factura del taller:

- Con el **NIF del taller** (diferente al de vehículos)
- Con el desglose de mano de obra y piezas
- Con la garantía legal incluida
- Se envía por email al cliente con el PDF adjunto
- Se puede registrar el pago (efectivo, tarjeta, transferencia, Bizum, o mixto)

### 📍 PASO 7 — Se avisa al cliente

El sistema envía un email al cliente: **"Su vehículo está listo para recoger"** con:

- Resumen de lo que se ha hecho
- Horario de recogida
- Dirección del taller

Si el cliente no viene a recogerlo en 7 días, se le envía un **recordatorio automático**.

### 📍 PASO 8 — Entrega del vehículo

El gestor marca la orden como **entregada**:

- Se apuntan los kilómetros de salida
- Se activa automáticamente la **garantía** (3 meses ó 2.000 km)
- La orden queda cerrada y se archiva en el historial del vehículo

---

## 3. Lo que verá el gestor del taller

El gestor accede al módulo desde el menú lateral del ERP, en la sección **🔧 TALLER**.

### Pantalla principal: Lista de órdenes

Una tabla con todas las órdenes activas, con colores por estado y prioridad:

| Orden | Vehículo | Cliente | Estado | Prioridad | Progreso |
|-------|----------|---------|--------|-----------|----------|
| OR-0015 | BMW 320d · 1234-ABC | Juan García | 🔵 En reparación | 🔴 Urgente | ████░░ 60% |
| OR-0014 | Peugeot 208 · 5678-XYZ | María López | 🟡 Esperando piezas | 🟡 Alta | ██░░░░ 30% |
| OR-0013 | Seat Ibiza · 9012-DEF | Antonio Martín | 🟢 Listo para recoger | 🔵 Normal | ██████ 100% |

**Lo más importante para el día a día:**

- Se puede **cambiar la prioridad** de cualquier orden con un solo clic, sin tener que abrir nada
- Si hay varias órdenes urgentes, se pueden **reordenar arrastrando** para decidir cuál va primero
- Se puede **cambiar el estado** directamente desde la lista, sin entrar a cada orden
- Los filtros permiten ver solo las órdenes de un estado concreto, de un mecánico, o de un rango de fechas

### Dentro de cada orden

Al hacer clic en una orden, se ve todo organizado en pestañas:

- **Datos**: Información del coche, cliente, motivo de entrada
- **Tareas**: Lista de trabajos a realizar, con horas y precios (todo editable)
- **Piezas**: Material necesario, con precios y cantidades (todo editable)
- **Fotos**: Fotos del estado del vehículo
- **Presupuesto**: Generar, enviar, ver estado de aceptación
- **Timeline**: Historial de todo lo que ha pasado con esta orden (quién hizo qué y cuándo)

**Todo es editable mientras la orden esté abierta**: se pueden añadir o quitar tareas, cambiar precios, reasignar mecánicos, cambiar prioridad... Los cambios se guardan automáticamente.

---

## 4. Lo que verá el mecánico en su tablet

El mecánico tiene su propio acceso al sistema, con un usuario y contraseña personal. Al entrar, **solo ve sus tareas** — no ve facturas, no ve configuración, no ve datos de otros mecánicos.

### Su pantalla: Panel Kanban

Columnas tipo "tablón" donde las tarjetas se pueden arrastrar:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  PENDIENTE  │  │ EN PROGRESO │  │  ESPERANDO  │  │ COMPLETADO  │
│             │  │             │  │             │  │             │
│ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │
│ │🔴 URGENTE│ │  │ │Cambio de│ │  │ │Esperando│ │  │ │✅ Cambio │ │
│ │Cambio de│ │  │ │aceite   │ │  │ │pastillas│ │  │ │de filtro│ │
│ │embrague │ │  │ │         │ │  │ │Brembo   │ │  │ │de aire  │ │
│ │BMW 320d │ │  │ │Seat Ibiz│ │  │ │Peugeot  │ │  │ │Seat Ibiz│ │
│ │1234-ABC │ │  │ │9012-DEF │ │  │ │5678-XYZ │ │  │ │9012-DEF │ │
│ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │
│             │  │             │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

**Lo que puede hacer el mecánico:**

| Acción | Cómo |
|--------|------|
| **Ver sus tareas** | Solo las que tiene asignadas, organizadas por estado |
| **Mover tarjetas** | Arrastrar de "Pendiente" a "En Progreso" cuando empieza |
| **Marcar como completada** | Arrastrar a "Completado" o marcar el checkbox |
| **Añadir notas** | Escribir observaciones sobre la reparación |
| **Tomar fotos** | Fotografiar el trabajo realizado |
| **Reportar avería nueva** | Si encuentra un problema adicional, lo reporta desde aquí y llega al gestor |

**Lo que NO puede hacer el mecánico:**
- ❌ No puede facturar
- ❌ No puede ver precios ni costes
- ❌ No puede enviar emails al cliente
- ❌ No puede ver las tareas de otros mecánicos
- ❌ No puede cancelar órdenes ni cerrarlas

---

## 5. Facturación independiente con NIF del taller

El taller tiene un **NIF diferente** al de la venta de vehículos. El sistema gestiona ambos por separado:

| | Facturas de Vehículos | Facturas de Taller |
|---|---|---|
| **NIF** | El del autónomo de vehículos | El del autónomo del taller |
| **Serie** | F, FRA, etc. (la actual) | FT (Factura Taller) |
| **Numeración** | FRA-2026-0001, 0002... | FT-2026-0001, 0002... |
| **Contenido** | Datos del vehículo vendido | Desglose mano de obra + piezas + garantía |
| **Dónde se gestiona** | Menú Ventas → Facturas | Menú Taller → Facturas |

**Importante**: Aunque son dos tipos de factura con NIF diferente, el sistema las gestiona con la misma lógica interna. Esto significa que:
- Los pagos se registran igual (efectivo, tarjeta, transferencia, Bizum)
- Las anulaciones/rectificativas funcionan igual
- Los informes fiscales separan automáticamente lo de vehículos y lo de taller

---

## 6. Los documentos PDF que se generan

El módulo genera **4 tipos de documentos PDF**:

### 📄 1. Resguardo de Depósito
Se genera al recibir el coche. Es el justificante de que el taller tiene el vehículo del cliente.

**Contenido:**
- Datos del taller (nombre, NIF, dirección, nº registro industrial)
- Datos del cliente (nombre, NIF, teléfono)
- Datos del vehículo (matrícula, marca, modelo, VIN, kilómetros, color)
- Motivo de la entrada
- Observaciones del estado del vehículo (arañazos, golpes previos)
- Fecha estimada de entrega
- Espacio para firma del cliente y del taller

### 📄 2. Presupuesto Previo
El documento que se envía al cliente antes de reparar. **Obligatorio por ley** (salvo renuncia expresa del cliente).

**Contenido:**
- Todo lo del resguardo de depósito
- Desglose completo de trabajos previstos:
  - Descripción del trabajo
  - Horas estimadas × tarifa/hora
  - Subtotal por trabajo
- Desglose de piezas:
  - Nombre de la pieza, referencia, marca
  - Si es nueva, reconstruida o usada (la ley obliga a informar)
  - Cantidad × precio unitario
  - Subtotal por pieza
- **Totales**: Mano de obra + Piezas + IVA = TOTAL
- Validez: 12 días hábiles
- Espacio para aceptación con firma

### 📄 3. Factura de Taller
La factura final cuando se termina la reparación.

**Contenido:**
- **Cabecera**: Datos del taller con NIF propio + datos del cliente
- **Nº de Registro Industrial** del taller
- **Datos del vehículo**: matrícula, marca, modelo, VIN, km entrada y km salida
- **Referencia a la orden**: Nº OR-2026-XXXX
- **Desglose de mano de obra**:

  | Descripción | Horas | €/hora | Importe |
  |-------------|:-----:|:------:|--------:|
  | Cambio de pastillas de freno | 2,0 | 55,00 € | 110,00 € |
  | Rectificado de discos de freno | 1,5 | 55,00 € | 82,50 € |
  | **Total mano de obra** | | | **192,50 €** |

- **Desglose de piezas y materiales**:

  | Pieza | Ref. | Tipo | Uds. | Precio | Importe |
  |-------|------|:----:|:----:|-------:|--------:|
  | Pastillas freno delanteras Brembo | P85020 | Nueva | 1 | 45,90 € | 45,90 € |
  | Disco de freno delantero | BD1234 | Nuevo | 2 | 62,50 € | 125,00 € |
  | **Total piezas** | | | | | **170,90 €** |

- **Totales**: Base imponible + IVA (21%) = Total
- **Garantía**: *"Garantía de 3 meses o 2.000 km (lo que ocurra primero) sobre mano de obra y materiales, según Real Decreto 1457/1986"*
- **Nota legal**: *"Las piezas sustituidas quedan a disposición del cliente durante 15 días"*
- **Hojas de reclamaciones**: *"Este taller dispone de hojas de reclamaciones a disposición del cliente"*

### 📄 4. Hoja de Trabajo del Mecánico
Documento interno para el mecánico (imprimible).

**Contenido:**
- Matrícula del coche en grande (fácil de ver en el taller)
- Lista de tareas con checkboxes para marcar
- Lista de piezas necesarias
- Espacio para notas a mano
- Firma del mecánico

---

## 7. Emails automáticos al cliente

El sistema envía **7 emails automáticos** en momentos clave. El cliente no tiene que llamar para preguntar — el taller le informa proactivamente.

### 📧 Email 1: "Hemos recibido su vehículo"
**Cuándo se envía**: Al crear la orden de reparación

> Estimado/a Juan García,
>
> Le confirmamos que hemos recibido su vehículo **BMW 320d (1234-ABC)** en nuestro taller.
>
> - 📋 Nº de Orden: OR-2026-0015
> - 📝 Motivo: Ruido al frenar
> - 📅 Fecha estimada: 22/04/2026
>
> Le mantendremos informado del progreso.

---

### 📧 Email 2: "Su presupuesto está listo"
**Cuándo se envía**: Al enviar el presupuesto

> Su presupuesto para el BMW 320d está listo:
>
> - 💰 **Total: 564,95 €** (IVA incluido)
> - 📋 Mano de obra: 192,50 €
> - 🔧 Piezas: 274,00 €
>
> **[✔️ ACEPTAR PRESUPUESTO]** ← botón que lleva a una página web
>
> **[❌ RECHAZAR PRESUPUESTO]** ← botón que rechaza
>
> También puede llamarnos al teléfono para confirmar.

---

### 📧 Email 3: "Hemos detectado una avería adicional"
**Cuándo se envía**: Si el mecánico encuentra algo nuevo durante la reparación

> Durante la reparación de su BMW 320d hemos encontrado que el **sensor de ABS trasero derecho** necesita ser sustituido.
>
> Coste adicional estimado: **145,00 €**
>
> **[✔️ ACEPTAR]** **[❌ RECHAZAR]**
>
> Si rechaza, continuaremos solo con los trabajos ya aprobados.

---

### 📧 Email 4: "Su coche está listo para recoger"
**Cuándo se envía**: Cuando se completa la reparación

> ¡Buenas noticias! Su BMW 320d (1234-ABC) está **listo para recoger**.
>
> - 📅 Horario: Lunes a Viernes 9:00-19:00, Sábados 9:00-14:00
> - 📍 Dirección del taller
> - 💰 Importe: 564,95 €
> - 💳 Métodos de pago: Efectivo, tarjeta, transferencia, Bizum

---

### 📧 Email 5: "Su factura"
**Cuándo se envía**: Al generar la factura (con el PDF adjunto)

---

### 📧 Email 6: "Recordatorio de recogida"
**Cuándo se envía**: Automáticamente si pasan 7 días sin que el cliente recoja el coche

> Le recordamos que su vehículo lleva esperando a ser recogido desde el 14/04/2026.

---

### 📧 Email 7: "Su presupuesto ha caducado"
**Cuándo se envía**: Si pasan 12 días hábiles sin que el cliente responda al presupuesto

> El presupuesto enviado el 01/04/2026 ha superado el plazo de validez. Puede recoger su vehículo o contactarnos para un nuevo presupuesto.

---

## 8. Presupuestos: el cliente acepta desde su móvil

Cuando el cliente recibe el email del presupuesto y hace clic en **"ACEPTAR"**, se abre una **página web** (como la que ya usamos para la firma de contratos) donde:

1. Ve el **resumen del presupuesto** con el desglose de trabajos y piezas
2. Ve el **total** con IVA
3. Puede **firmar con el dedo** en la pantalla del móvil para aceptar
4. El sistema actualiza automáticamente el estado de la orden
5. El gestor del taller recibe una notificación de que el cliente ha aceptado

Si el cliente **rechaza**, el coche se le devuelve sin coste ni compromiso.

---

## 9. Historial del vehículo y garantías

### Historial por matrícula

Con solo buscar una matrícula, el sistema muestra **todas las veces que ese coche ha estado en el taller**:

| Fecha | Orden | Trabajos | Importe | Km |
|-------|-------|----------|--------:|---:|
| 18/04/2026 | OR-0015 | Cambio pastillas + discos freno | 564,95 € | 87.320 |
| 12/01/2026 | OR-0008 | Cambio de aceite + filtros | 189,00 € | 82.100 |
| 03/09/2025 | OR-0002 | Revisión pre-ITV | 95,00 € | 78.500 |

Esto es muy valioso para:
- Saber qué se le ha hecho al coche anteriormente
- Detectar problemas recurrentes
- Ofrecer un servicio personalizado al cliente
- Recomendar mantenimientos basados en el historial

### Garantías automáticas

Cada reparación genera automáticamente una **garantía** según la ley:

- **Duración**: 3 meses ó 2.000 km (lo que ocurra primero)
- **Desde cuándo**: Desde la fecha de entrega del vehículo
- **Qué cubre**: Mano de obra y materiales de la reparación realizada
- **Seguimiento**: El sistema rastrea cuándo caduca cada garantía

Si un cliente vuelve con el mismo problema dentro del período de garantía, el sistema lo detecta y lo marca como **reparación en garantía** (sin coste para el cliente).

---

## 10. Métricas y rentabilidad del taller

El módulo incluirá un **panel de control con datos clave** del negocio del taller:

### En el dashboard principal del ERP (resumen rápido)

4 indicadores visibles nada más entrar:

| | | | |
|:---:|:---:|:---:|:---:|
| **12** | **5** | **3.200 €** | **85%** |
| Órdenes activas | En reparación | Facturado este mes | Tasa de aceptación |

### En el dashboard propio del taller (detalle completo)

Un panel completo solo para el taller con:

- **📊 Gráfico de facturación mensual** — ¿Cuánto facturamos cada mes?
- **👨‍🔧 Productividad por mecánico** — ¿Cuántas horas factura cada uno al mes?
- **⏱️ Tiempo medio de reparación** — ¿Cuántos días tardamos de media?
- **📈 Tasa de aceptación** — ¿Qué porcentaje de presupuestos acepta el cliente?
- **💰 Ticket medio** — ¿Cuánto facturamos de media por reparación?
- **⚠️ Alertas activas**:
  - Coches sin recoger hace más de 7 días
  - Presupuestos a punto de caducar
  - Stock de piezas bajo mínimos

---

## 11. Cumplimiento legal

El módulo cumple toda la normativa aplicable a talleres en España:

### Real Decreto 1457/1986 (Talleres de Reparación)

| Obligación legal | ¿Cómo se cumple? |
|-----------------|-------------------|
| **Presupuesto previo obligatorio** | Se genera automáticamente y se envía por email. El cliente acepta o rechaza online |
| **Resguardo de depósito** | PDF generado al recibir el vehículo |
| **Garantía mínima de 3 meses o 2.000 km** | Se activa automáticamente al entregar el coche y se incluye en la factura |
| **Desglose de mano de obra y piezas** | Cada factura separa mano de obra (horas × tarifa) y piezas (referencia, tipo, precio) |
| **Informar si las piezas son nuevas, reconstruidas o usadas** | Campo obligatorio en cada pieza del presupuesto y la factura |
| **Piezas antiguas a disposición del cliente** | Texto legal incluido automáticamente en la factura |
| **Hojas de reclamaciones** | Mención obligatoria incluida en la factura |
| **Libro-registro de reparaciones** | Exportable a CSV/PDF desde el historial para inspecciones |
| **Número de Registro Industrial** | Visible en todos los documentos (facturas, presupuestos, resguardos) |

### Fiscalidad

| Aspecto | Solución |
|---------|----------|
| **Doble NIF** | Facturas de vehículos con un NIF, facturas de taller con otro NIF |
| **Series de facturación** | Serie FT independiente con numeración correlativa propia |
| **VeriFactu** | Preparado para cuando entre en vigor (previsto julio 2026) |
| **Informes fiscales** | Separados por actividad (vehículos vs taller) para declaraciones de IVA |
| **Conservación 6 años** | Todos los documentos quedan almacenados permanentemente en el sistema |

### Protección de datos (RGPD)

- Los datos de clientes se gestionan con el CRUD existente
- Las fotos de vehículos se almacenan con acceso restringido
- Cada usuario solo ve los datos de su empresa

---

## 12. Calendario de desarrollo

| Fase | Qué se hace | Duración |
|------|------------|----------|
| **Fase 1** | Base de datos, doble emisor, crear órdenes, catálogos | Semana 1-2 |
| **Fase 2** | Panel del mecánico, presupuestos, page pública de aceptación, prioridades | Semana 2-3 |
| **Fase 3** | Facturación del taller, PDF, pagos | Semana 3-4 |
| **Fase 4** | Emails, historial, dashboard, testing completo y puesta a punto | Semana 4-5 |

Al final de cada fase se hacen pruebas completas para asegurar que todo funciona correctamente antes de pasar a la siguiente.

---

> **En resumen**: Este módulo convierte el taller en un negocio profesional y digitalizado, con gestión integral de todo el proceso, comunicación automática con el cliente, cumplimiento legal total y visibilidad completa de la rentabilidad. Todo integrado en el mismo ERP que ya usamos para vehículos.
