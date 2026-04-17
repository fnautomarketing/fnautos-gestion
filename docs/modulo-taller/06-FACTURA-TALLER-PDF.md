# 06 — Factura de Taller — Contenido del PDF

## 6.1 Requisitos Legales del PDF

La factura de taller en España tiene requisitos específicos que van MÁS ALLÁ de una factura ordinaria, al estar regulada también por el Real Decreto 1457/1986 de talleres de reparación.

> **Implementación (DA-01)**: La factura de taller se almacena en la tabla `facturas` existente con `tipo = 'taller'`. El PDF se renderiza con una plantilla diferente a la de vehículos, pero reutiliza la misma infraestructura de generación.

---

## 6.2 Estructura del PDF — Contenido Completo

### CABECERA

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [LOGO FNAUTOS]           FACTURA DE TALLER                      │
│                           Nº: FT-2026-0001                      │
│                           Fecha: 18/04/2026                      │
│                                                                  │
│  ───────────────────────────────────────────────────────────     │
│  EMISOR (Datos del Taller)           CLIENTE                     │
│  ──────────────────────              ──────                      │
│  [Nombre/Razón Social]              [Nombre del Cliente]         │
│  NIF: [NIF del Taller]              NIF: [NIF del Cliente]       │
│  [Dirección fiscal]                 [Dirección]                  │
│  [CP, Ciudad, Provincia]            [CP, Ciudad]                 │
│  Tel: [Teléfono]                    Tel: [Teléfono]              │
│  Email: [Email del taller]          Email: [Email cliente]       │
│  Nº Reg. Industrial: [XXXXX]                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### DATOS DEL VEHÍCULO (Específico de taller)

```
┌─────────────────────────────────────────────────────────────────┐
│  DATOS DEL VEHÍCULO                                              │
│  ───────────────────                                             │
│  Matrícula: 1234 ABC             Marca: BMW                     │
│  Modelo: 320d                    Año: 2020                      │
│  Nº Bastidor (VIN): WBAXXXXXXXXXXXXXXXXX                        │
│  Kilómetros entrada: 87.452      Kilómetros salida: 87.460      │
│  Orden de Reparación: OR-2026-0015                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### DESGLOSE DE MANO DE OBRA

```
┌─────────────────────────────────────────────────────────────────┐
│  MANO DE OBRA                                                    │
│  ─────────────                                                   │
│  ┌──────────────────────────────┬───────┬─────────┬───────────┐ │
│  │ Descripción                  │ Horas │ €/Hora  │ Total     │ │
│  ├──────────────────────────────┼───────┼─────────┼───────────┤ │
│  │ Inspección sistema de frenos │  2,00 │  35,00  │    70,00 €│ │
│  │ Sust. pastillas delanteras   │  1,00 │  35,00  │    35,00 €│ │
│  │ Sust. discos delanteros      │  1,50 │  35,00  │    52,50 €│ │
│  │ Purga circuito de frenos     │  0,50 │  35,00  │    17,50 €│ │
│  │ Nivel líquido frenos         │  0,50 │  35,00  │    17,50 €│ │
│  │ Prueba de rodaje/control     │  0,50 │  35,00  │    17,50 €│ │
│  ├──────────────────────────────┼───────┼─────────┼───────────┤ │
│  │ TOTAL MANO DE OBRA           │  6,00 │         │   210,00 €│ │
│  └──────────────────────────────┴───────┴─────────┴───────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### DESGLOSE DE PIEZAS Y RECAMBIOS

```
┌─────────────────────────────────────────────────────────────────┐
│  PIEZAS Y RECAMBIOS                                              │
│  ──────────────────                                              │
│  ┌────────────┬───────────────────────┬─────┬────────┬────────┐ │
│  │ Referencia │ Descripción           │ Uds │ PVP/Ud │ Total  │ │
│  ├────────────┼───────────────────────┼─────┼────────┼────────┤ │
│  │ P 06 075   │ Pastillas freno       │   1 │  65,00 │  65,00€│ │
│  │            │ Brembo delanteras     │     │        │        │ │
│  ├────────────┼───────────────────────┼─────┼────────┼────────┤ │
│  │ 09.C401.13 │ Disco freno Brembo    │   2 │  89,50 │ 179,00€│ │
│  │            │ ventilado 300mm       │     │        │        │ │
│  ├────────────┼───────────────────────┼─────┼────────┼────────┤ │
│  │ DOT4-1L    │ Líquido frenos DOT4   │   1 │  12,90 │  12,90€│ │
│  │            │ ATE 1 litro           │     │        │        │ │
│  ├────────────┼───────────────────────┼─────┼────────┼────────┤ │
│  │            │ TOTAL PIEZAS          │     │        │ 256,90€│ │
│  └────────────┴───────────────────────┴─────┴────────┴────────┘ │
│                                                                  │
│  ✅ Todas las piezas utilizadas son NUEVAS y originales/         │
│  equivalentes homologadas.                                       │
│  ✅ Las piezas sustituidas han sido ofrecidas/entregadas          │
│  al cliente conforme al RD 1457/1986.                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### RESUMEN ECONÓMICO

```
┌─────────────────────────────────────────────────────────────────┐
│  RESUMEN                                                         │
│  ───────                                                         │
│                                                                  │
│                          Total Mano de Obra:        210,00 €     │
│                          Total Piezas:              256,90 €     │
│                          ─────────────────────────────────       │
│                          Base Imponible:            466,90 €     │
│                          IVA (21%):                  98,05 €     │
│                          ═════════════════════════════════       │
│                          TOTAL FACTURA:             564,95 €     │
│                                                                  │
│  Forma de pago: Tarjeta                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### GARANTÍA Y CONDICIONES LEGALES

```
┌─────────────────────────────────────────────────────────────────┐
│  GARANTÍA                                                        │
│  ────────                                                        │
│                                                                  │
│  Esta reparación tiene una garantía de 3 meses o 2.000 km       │
│  recorridos (lo que se cumpla primero), que cubre la totalidad   │
│  de materiales empleados y mano de obra, de conformidad con      │
│  el Real Decreto 1457/1986, de 10 de enero, por el que se        │
│  regulan la actividad industrial y la prestación de servicios    │
│  en los talleres de reparación de vehículos automóviles, de      │
│  sus equipos y componentes.                                      │
│                                                                  │
│  La garantía quedará sin efecto si el vehículo es manipulado     │
│  o reparado por terceros en los elementos objeto de esta          │
│  reparación.                                                     │
│                                                                  │
│  Período de garantía: 18/04/2026 — 18/07/2026                   │
│  Km al entregar: 87.460 | Km límite garantía: 89.460            │
│                                                                  │
│  ───────────────────────────────────────────────────────────     │
│                                                                  │
│  Las piezas sustituidas son propiedad del cliente, pudiendo      │
│  retirarlas en el taller en un plazo máximo de 30 días.          │
│                                                                  │
│  De conformidad con el Art. 14 del RD 1457/1986, el usuario      │
│  dispone de hojas de reclamaciones a su disposición en el        │
│  establecimiento.                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### PIE DE PÁGINA

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [Nombre del Taller] | NIF: [NIF] | [Dirección completa]        │
│  Tel: [Teléfono] | Email: [Email]                                │
│  Nº Registro Industrial del Taller: [Si aplica]                  │
│                                                                  │
│  Factura verificable en la sede electrónica de la AEAT           │
│  [Código QR — cuando esté homologado VeriFactu]                  │
│                                                                  │
│  Conserve este documento. Plazo legal de conservación: 6 años.   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6.3 Diferencias con la Factura de Vehículos Actual

| Aspecto | Factura Vehículos (actual) | Factura Taller (nueva) |
|---------|---------------------------|------------------------|
| Emisor fiscal | NIF del autónomo de vehículos | NIF del autónomo del taller |
| Serie de facturación | F, FRA, etc. | FT (Factura Taller) |
| Datos del vehículo | No incluye | Incluye matrícula, marca, modelo, VIN, km |
| Desglose mano de obra | No | Sí (horas × tarifa, desglosado por trabajo) |
| Desglose piezas | No especifico | Sí (referencia, nombre, marca, cantidad, PVP) |
| Tipo de pieza | N/A | Nueva / Reconstruida / Usada |
| Garantía | No | Sí (3 meses / 2.000 km — RD 1457/1986) |
| Referencia a OR | No | Sí (número de orden de reparación) |
| Devolución piezas viejas | No | Sí (obligación legal) |
| Hojas de reclamaciones | No menciona | Obligatorio mencionar disponibilidad |
| Nº Registro Industrial | No | Sí (obligatorio en documentos del taller) |

> **Nota técnica**: Ambas plantillas (vehículos y taller) comparten el mismo sistema de generación PDF server-side. La selección de plantilla es automática según `factura.tipo`. Se reusa el componente de envío por email, registro de pagos y anulación.

---

## 6.4 Documentos PDF Adicionales

Además de la factura, el módulo taller genera los siguientes PDFs:

### Resguardo de Depósito
- Datos del taller y del cliente
- Datos del vehículo con km
- Motivo del depósito
- Fecha estimada de entrega
- Espacio para firmas
- Observaciones del estado del vehículo

### Presupuesto Previo
- Todos los datos del resguardo de depósito
- Desglose completo de trabajos y piezas previstos
- Importes con IVA
- Validez (12 días hábiles)
- Espacio para aceptación/renuncia con firma
- Condiciones generales

### Hoja de Trabajo del Mecánico
- Datos del vehículo destacados (matrícula grande, visible)
- Lista de tareas con checkboxes imprimibles
- Lista de piezas necesarias
- Espacio para notas manuscritas
- Espacio para firma del mecánico

---

## 6.5 Ruta de Generación del PDF

La factura de taller se genera como PDF en la misma API route que las facturas de vehículos, seleccionando la plantilla según el `tipo`:

```
API: /api/facturas/[id]/pdf

1. Obtener factura por ID
2. Si factura.tipo === 'taller' → usar plantilla FacturaTallerPDF
3. Si factura.tipo === 'vehiculo' → usar plantilla FacturaVehiculoPDF (actual)
4. Obtener datos del emisor según tipo de actividad
5. Generar PDF con @react-pdf/renderer
6. Devolver como stream
```

Esto asegura que:
- Un solo endpoint para ambos tipos de factura
- La lógica de envío por email funciona igual
- Los pagos y anulaciones no necesitan cambios
