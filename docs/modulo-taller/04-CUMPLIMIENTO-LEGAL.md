# 04 — Cumplimiento Legal España

## 4.1 Normativa Aplicable

| Norma | Ámbito | Relevancia |
|-------|--------|------------|
| **Real Decreto 1457/1986** | Actividad de talleres de reparación de vehículos | OBLIGATORIA — regula presupuestos, resguardos, garantías, piezas |
| **Reglamento de Facturación (RD 1619/2012)** | Contenido de facturas | OBLIGATORIA — contenido mínimo de toda factura |
| **Ley Antifraude (Ley 11/2021)** | Sistemas informáticos de facturación | OBLIGATORIA — prohibición de software de doble uso |
| **Reglamento VeriFactu (RD 1007/2023)** | Requisitos técnicos de facturación electrónica | OBLIGATORIA desde julio 2026 para autónomos |
| **Ley General de Consumidores (RDL 1/2007)** | Derechos generales del consumidor | APLICABLE |
| **Normativa autonómica** | Requisitos específicos de la comunidad autónoma | CONSULTAR — varía por CCAA |

---

## 4.2 Presupuesto Previo (Art. 14, RD 1457/1986)

### Obligaciones del Taller

1. **Derecho del usuario**: Todo usuario puede solicitar presupuesto escrito ANTES de la reparación
2. **Validez mínima**: 12 días hábiles desde la emisión
3. **Solo reparar tras aceptación**: La reparación NO puede iniciarse sin autorización expresa del cliente
4. **Renuncia**: El cliente puede renunciar al presupuesto de forma fehaciente (se debe documentar)

### Contenido Obligatorio del Presupuesto

| Campo | Obligatorio | Implementación en el ERP |
|-------|:-----------:|--------------------------|
| Número de registro del taller | ✅ | Campo en `empresas` (tipo taller) |
| NIF del taller | ✅ | `empresas.nif` |
| Domicilio del taller | ✅ | `empresas.direccion` |
| Datos del usuario (nombre, NIF, dirección) | ✅ | Desde tabla `clientes` |
| Marca, modelo, matrícula del vehículo | ✅ | `ordenes_reparacion.vehiculo_*` |
| Kilómetros recorridos | ✅ | `ordenes_reparacion.vehiculo_km` |
| Reparaciones a efectuar (detallado) | ✅ | `tareas_reparacion` |
| Piezas a sustituir (detallado) | ✅ | `piezas_orden` |
| Precio total desglosado (mano obra + piezas + IVA) | ✅ | Calculado automáticamente |
| Fecha prevista de entrega | ✅ | `ordenes_reparacion.fecha_entrega_estimada` |
| Fecha del presupuesto | ✅ | `presupuestos_taller.fecha_emision` |
| Firma del taller | ✅ | Generada automáticamente |
| Firma del usuario | ✅ | `presupuestos_taller.firma_cliente` |

### Implementación

- El PDF del presupuesto se genera con TODOS estos campos
- Al enviar por email, se adjunta el PDF y se incluye un enlace para firmar digitalmente
- Se calcula automáticamente la fecha de caducidad (12 días hábiles)
- Si caduca sin respuesta → estado `caducado`

---

## 4.3 Resguardo de Depósito (Art. 14, RD 1457/1986)

### Obligaciones

Siempre que un vehículo sea entregado al taller (para presupuesto O para reparación), se DEBE entregar al usuario un resguardo de depósito.

### Contenido Obligatorio

| Campo | Obligatorio |
|-------|:-----------:|
| Identificación del taller (razón social, NIF, dirección) | ✅ |
| Identificación del usuario (nombre, NIF) | ✅ |
| Identificación del vehículo (marca, modelo, matrícula, km) | ✅ |
| Objeto del depósito (presupuesto o reparación) | ✅ |
| Fecha prevista de entrega | ✅ |
| Firma del taller y del usuario | ✅ |

### Implementación

- Se genera automáticamente al crear la Orden de Reparación
- Es el PRIMER documento que el taller entrega al cliente
- Se puede imprimir en el acto o enviar por email
- El presupuesto aceptado puede servir como resguardo de depósito (RD 1457/1986)

---

## 4.4 Factura de Taller — Requisitos Legales

### Contenido Obligatorio (Reglamento de Facturación)

| Campo | Obligatorio | Notas |
|-------|:-----------:|-------|
| Número de factura correlativo y único | ✅ | Serie "FT-" |
| Fecha de expedición | ✅ | |
| NIF del emisor (taller) | ✅ | Del emisor tipo `taller` |
| Nombre/razón social del emisor | ✅ | |
| Dirección fiscal del emisor | ✅ | |
| NIF del receptor | ✅ | Si es empresa/profesional |
| Nombre del receptor | ✅ | |
| Dirección del receptor | ✅ | Si es empresa/profesional |
| Descripción detallada de operaciones | ✅ | Mano de obra desglosada |
| Detalle de piezas (nombre, cantidad, precio) | ✅ | |
| Horas de mano de obra y precio/hora | ✅ | |
| Base imponible | ✅ | |
| Tipo de IVA (21%) | ✅ | |
| Cuota de IVA | ✅ | |
| Importe total | ✅ | |

### Requisitos VeriFactu (Obligatorio desde julio 2026 para autónomos)

| Requisito | Implementación |
|-----------|----------------|
| Código QR con datos de la factura | Se incluirá en el PDF cuando el sistema esté homologado |
| Frase: "Factura verificable en la sede electrónica de la AEAT" | Se incluirá en el pie de la factura |
| Integridad e inalterabilidad de registros | PostgreSQL con RLS + audit trail en `eventos_orden` |
| Prohibición de borrado | Las facturas emitidas nunca se borran, solo se anulan |

> **Nota**: La implementación completa de VeriFactu requiere homologación del software por la AEAT. Se prepara la infraestructura para añadir el QR y la frase legal cuando se obtenga la certificación.

> ⚠️ **URGENTE**: Verificar la fecha exacta de obligatoriedad de VeriFactu para autónomos. Originalmente prevista para julio 2025, se ha retrasado varias veces. La última fecha oficial es **julio 2026**, lo cual es **inminente**. Afecta a AMBOS emisores fiscales (vehículos y taller).

---

## 4.5 Campos Específicos Legales para Taller

### Garantía (Art. 15f, RD 1457/1986)

- **Garantía mínima**: 3 meses O 2.000 kilómetros (lo que se cumpla primero)
- **Alcance total**: Incluye materiales, mano de obra Y gastos de desplazamiento
- **Se pierde si**: El vehículo es manipulado o reparado por terceros
- **En la factura**: Se DEBE incluir texto de garantía

Texto estándar implementado:
> *"Esta reparación tiene una garantía de 3 meses o 2.000 km recorridos (lo que se cumpla primero), que cubre la totalidad de materiales empleados y mano de obra, de conformidad con el Real Decreto 1457/1986. La garantía quedará sin efecto si el vehículo es manipulado o reparado por terceros en los elementos objeto de esta reparación."*

### Piezas Sustituidas (Art. 15, RD 1457/1986)

- El taller DEBE ofrecer la devolución de las piezas sustituidas al cliente
- Se registra en `piezas_orden.pieza_vieja_devuelta`
- Si el cliente renuncia, se debe documentar

### Piezas Usadas/Reconstruidas

- Por defecto se usan piezas NUEVAS
- Para usar piezas usadas o reconstruidas se REQUIERE consentimiento por escrito del cliente
- Se registra en `piezas_orden.tipo_pieza` y `piezas_orden.consentimiento_cliente`

### Tamaño de Letra

- Texto inferior a 1,5 mm está prohibido en documentos que afecten a los derechos del consumidor
- Nuestro PDF usa un mínimo de 8pt (~2,82 mm), muy por encima del mínimo legal

---

## 4.6 Conservación de Documentos

| Documento | Plazo de conservación |
|-----------|----------------------|
| Facturas emitidas | 6 años (Código de Comercio) |
| Presupuestos | 6 años |
| Resguardos de depósito | 6 años |
| Registros de facturación | 6 años |

**Implementación**: Todos los documentos se almacenan permanentemente en PostgreSQL/Supabase. Las facturas emitidas no se pueden eliminar, solo anular con una factura rectificativa.

---

## 4.7 Libro-Registro de Reparaciones

El RD 1457/1986 obliga a los talleres a mantener un **libro-registro** de reparaciones efectuadas. El sistema debe permitir generar un informe/exportación con:

| Campo | Descripción |
|-------|-------------|
| Número de orden | Correlativo |
| Fecha de entrada y salida | De la orden |
| Datos del vehículo | Marca, modelo, matrícula |
| Datos del propietario | Nombre, NIF |
| Trabajos realizados | Resumen de tareas |
| Importe total | Facturado |
| Garantía | Período |

**Implementación**: Informe exportable a CSV/PDF desde `Taller → Historial`, filtrable por rango de fechas.

---

## 4.8 Número de Registro Industrial del Taller

Los talleres deben estar inscritos en el Registro Industrial. Este número aparece en documentación oficial.

```sql
-- Añadir a la tabla empresas (solo para emisores tipo 'taller')
ALTER TABLE empresas ADD COLUMN numero_registro_industrial TEXT;
```

Se muestra en:
- Pie de página de la factura
- Presupuesto previo
- Resguardo de depósito

---

## 4.9 Protección de Datos (LOPD / RGPD)

Al manejar datos personales de clientes y fotos de vehículos:

| Requisito | Implementación |
|-----------|----------------|
| **Política de privacidad** | Incluir enlace en emails y formularios públicos |
| **Consentimiento** | Registrar consentimiento al crear el cliente |
| **Fotos de vehículos** | Almacenadas en Supabase Storage con acceso restringido vía RLS |
| **Derecho de acceso/rectificación/supresión** | Soportado por el CRUD de clientes existente |
| **Retención de datos** | Facturas: 6 años mínimo. Datos de cliente: mientras exista relación comercial |
