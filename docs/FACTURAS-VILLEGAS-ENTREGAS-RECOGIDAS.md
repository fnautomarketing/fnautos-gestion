# Facturas Villegas: Entregas y Recogidas (Febrero 2026)

## 1. Lo que entiendo

- Las **hojas de reparto/recogida** (RDA) dan dos tipos de concepto: **Entregas** y **Recogidas**.
- Hay que emitir **dos facturas** desde la **empresa Villegas** (Martines Villegas Logistics):
  - Una factura para **Radox**: solo concepto **Entregas** (suma de las entregas de las rutas).
  - Una factura para **Ramonera**: solo concepto **Recogidas** (suma de las recogidas de las rutas).
- Los importes que salen de las hojas son **sin IVA** (base imponible). En factura hay que dejar claro el desglose y el IVA (0% o exento, salvo que indiques otra cosa).
- La suma de las dos facturas debe coincidir con el total de las hojas: 3.217,67 + 1.224,89 = **4.442,56 €**.

### Desglose por rutas (de las hojas)

| Ruta | Chófer | Entregas (€) | Recogidas (€) |
|------|--------|--------------|---------------|
| 126 | Álvaro López | 2.677,67 | 1.044,89 |
| 124 | Yorlen - Sebastian | 360,00 | 0,00 |
| 157 | Andrés Felipe López | 180,00 | 180,00 |

---

## 2. Lo que haré para crear las facturas

1. **Empresa emisora:** Villegas (Martines Villegas Logistics).  
   - En el sistema: empresa con `id` asociado a Villegas (p. ej. serie F2026).

2. **Dos facturas:**
   - **Factura 1 – Cliente Radox (solo Entregas)**  
     Líneas con concepto “Entregas” y desglose por ruta (o una línea con detalle en descripción), base = 3.217,67 €.
   - **Factura 2 – Cliente Ramonera (solo Recogidas)**  
     Líneas con concepto “Recogidas” y desglose por ruta (o una línea con detalle), base = 1.224,89 €.

3. **IVA:**  
   Los importes son **sin IVA**. Opciones que aplicaré salvo que me digas otra cosa:
   - **Opción A (por defecto):** Factura con **IVA 0%** o **exento**. Base = importe indicado, Cuota IVA = 0, Total = Base.
   - **Opción B:** Si quieres que la factura lleve IVA repercutido (p. ej. 21%), calcularé: Base + 21% = Total y desglosaré Base, Cuota IVA y Total.

4. **Fechas y numeración:**  
   - Fecha de factura: la que indiques (p. ej. 28/02/2026 o 02/03/2026).  
   - Número: lo asigna el sistema según la serie de Villegas (ej. F2026-0001, F2026-0002).

5. **Líneas en factura:**  
   - Puedo poner una línea por ruta (concepto “Entregas” o “Recogidas” + descripción “Ruta 126…”, etc.) o una sola línea con el total y en descripción/notas el desglose. Te dejo abajo el desglose propuesto para que lo revises.

---

## 3. Resumen para que lo revises

### Factura 1 – Radox (Solo Entregas)

| Campo | Valor |
|-------|--------|
| **Empresa** | Villegas (Martines Villegas Logistics) |
| **Cliente** | Radox |
| **Número factura** | El siguiente de la serie Villegas (ej. F2026-XXXX) |
| **Fecha** | A definir (ej. 28/02/2026 o 02/03/2026) |
| **Concepto** | Entregas (hojas reparto feb 2026) |

**Desglose:**

| Descripción | Base (€) |
|-------------|----------|
| Ruta 126 (Álvaro López) – Entregas | 2.677,67 |
| Ruta 124 (Yorlen - Sebastian) – Entregas | 360,00 |
| Ruta 157 (Andrés Felipe López) – Entregas | 180,00 |
| **Total base (sin IVA)** | **3.217,67** |
| IVA 0% / Exento | 0,00 |
| **Total factura** | **3.217,67** |

---

### Factura 2 – Ramonera (Solo Recogidas)

| Campo | Valor |
|-------|--------|
| **Empresa** | Villegas (Martines Villegas Logistics) |
| **Cliente** | Ramonera |
| **Número factura** | El siguiente de la serie Villegas (ej. F2026-XXXX) |
| **Fecha** | A definir (misma lógica que Factura 1) |
| **Concepto** | Recogidas (hojas reparto feb 2026) |

**Desglose:**

| Descripción | Base (€) |
|-------------|----------|
| Ruta 126 (Álvaro López) – Recogidas | 1.044,89 |
| Ruta 157 (Andrés Felipe López) – Recogidas | 180,00 |
| **Total base (sin IVA)** | **1.224,89** |
| IVA 0% / Exento | 0,00 |
| **Total factura** | **1.224,89** |

---

## 4. Comprobación

- Suma total: 3.217,67 + 1.224,89 = **4.442,56 €** (coincide con el total de las hojas).
- Ruta 124 no aparece en la factura de Ramonera porque no tiene recogidas (0 €).

---

## 5. Próximo paso

Cuando confirmes que **Empresa, Cliente, Fecha y este desglose** son correctos (y si quieres IVA 0% o IVA 21%), crearé en el ERP las dos facturas con estas bases y totales.

---

## 6. Guía rápida para próximas facturas (Radox / Ramonera)

### 6.1. Preparar los datos desde las hojas

1. **Identificar el periodo**  
   - Mes o rango de fechas que cubren las hojas (ej. febrero 2026).

2. **Separar por ruta y tipo de servicio**  
   - Para cada hoja/reporte, sacar una tabla con:
     - Ruta
     - Chófer
     - Importe Entregas (€)
     - Importe Recogidas (€)

3. **Calcular totales por cliente**  
   - **Factura Radox** → sumar **solo las Entregas** de todas las rutas.  
   - **Factura Ramonera** → sumar **solo las Recogidas** de todas las rutas (si una ruta tiene 0 en recogidas, no entra en esta factura).

### 6.2. Crear la factura de Radox (Entregas)

1. **Empresa emisora**  
   - Empresa: **Villegas (Martines Villegas Logistics)**.  
   - Serie: la serie de Villegas (ej. `F2026`).

2. **Cliente**  
   - Cliente: **Radox**.

3. **Datos generales de factura**  
   - Fecha: la del cierre del periodo (ej. último día de mes o fecha que acordemos).  
   - Número: lo asigna automáticamente el ERP dentro de la serie (`F2026-XXXX`).  
   - Notas/Descripción general (opcional): algo tipo  
     - `"Entregas correspondientes a hojas de reparto [mes/año]"`.

4. **Líneas de factura (contenido)**  
   - Opción recomendada (más clara): **una línea por ruta**:
     - Concepto: `"Entregas"` o `"Entregas ruta XXX"`.  
     - Descripción: incluir ruta y chófer, por ejemplo  
       - `"Ruta 126 – Entregas – Álvaro López – Periodo feb 2026"`.  
     - Base imponible: el importe de entregas de esa ruta.
   - Alternativa: **una sola línea** con el total de entregas y en descripción o notas el desglose por ruta.

5. **Impuestos (IVA / IRPF)**  
   - Por defecto usar lo mismo que en este documento:  
     - IVA 0% / exento (Base = Total, IVA = 0).  
   - Si en algún momento cambian las condiciones (por ejemplo, aplicar 21% de IVA), recalcular así:  
     - Base = importes de las hojas.  
     - Cuota IVA = Base × 21%.  
     - Total = Base + Cuota IVA.

### 6.3. Crear la factura de Ramonera (Recogidas)

1. **Empresa emisora**  
   - Igual que Radox: **Villegas (Martines Villegas Logistics)**, serie `F2026` (o la que corresponda).

2. **Cliente**  
   - Cliente: **Ramonera**.

3. **Datos generales de factura**  
   - Fecha: coherente con la factura de Radox (normalmente misma fecha).  
   - Número: siguiente número disponible en la serie (`F2026-XXXX`).  
   - Notas/Descripción general (opcional):  
     - `"Recogidas correspondientes a hojas de reparto [mes/año]"`.

4. **Líneas de factura (contenido)**  
   - Igual enfoque que en Radox pero **solo con Recogidas**:
     - Una línea por ruta con recogidas > 0.  
     - Concepto: `"Recogidas"` o `"Recogidas ruta XXX"`.  
     - Descripción: `"Ruta 126 – Recogidas – [Chófer] – Periodo [mes/año]"`.  
     - Base imponible: importe de recogidas de esa ruta.
   - Alternativa: una única línea con el total y el desglose en descripción/notas.

5. **Impuestos (IVA / IRPF)**  
   - Usar el mismo criterio que en Radox (por defecto IVA 0% / exento, salvo que se acuerde otro tipo).

### 6.4. Comprobaciones finales

1. **Suma de bases**  
   - Verificar que:  
     - Base factura Radox (solo Entregas) + Base factura Ramonera (solo Recogidas)  
     - = **total de las hojas del periodo**.

2. **Coherencia de rutas**  
   - Cada ruta del periodo debe aparecer:
     - En la factura de Radox si tiene Entregas > 0.  
     - En la factura de Ramonera si tiene Recogidas > 0.  
   - Las rutas con 0 en recogidas **no** aparecen en la factura de Ramonera (como pasó con Ruta 124 en el ejemplo).

3. **Texto visible en la factura**  
   - Revisar que en:
     - Conceptos  
     - Descripciones  
     - Notas  
   - quede claro:
     - Periodo (mes/año).  
     - Ruta(s).  
     - Si se trata de Entregas o Recogidas.  
     - Cualquier otro detalle que necesites para justificar la factura frente al cliente.

Con esta guía, las próximas facturas para **Radox** (Entregas) y **Ramonera** (Recogidas) deberían seguir siempre la misma lógica que hemos usado en febrero de 2026.
