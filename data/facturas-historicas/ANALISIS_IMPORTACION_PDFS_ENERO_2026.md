# Análisis e importación: facturas PDF enero 2026 (STV)

Documento que resume el análisis de los 8 PDFs proporcionados y el plan para subirlos al programa.

---

## 1. Resumen de los PDFs analizados

| # | Archivo | Emisor (empresa) | Cliente facturado | CIF cliente | Nº factura | Fecha | Total (€) | Base | IVA 21% |
|---|---------|------------------|-------------------|-------------|------------|-------|-----------|------|--------|
| 1 | FACTURA 01-2026 (1).pdf | **Yenifer** (Barcelona-IFEMA) | COMERCIAL FRAMAN S.A | A08887473 | 1 | 31/01/2026 | 2.565,20 | 2.120,00 | 445,20 |
| 2 | FACTURA 01-2026.pdf | **Edison** (Barcelona-IFEMA) | Yerai serveis Logistic S.L. | B66617010 | 1 | 31/01/2026 | 6.987,00 | 5.822,50 | 1.222,72 |
| 3 | FACTURA 02-2026.pdf | **Yenifer** | MILTON CASTIBLANCO | 54449716E | 2 | 31/01/2026 | 1.801,20 | 1.488,60 | 312,60 |
| 4 | FACTURA 4-2026.pdf | **Villegas** (Villegas Logistics Solucions) | RADOCKS S.L. | B60901766 | 4 | 31/01/2026 | 4.057,26 | 3.353,11 | 704,15 |
| 5 | FACTURA 5-2026.pdf | **Villegas** | EMPRESAS RAMONEDA S.A | A08227829 | 5 | 31/01/2026 | 973,03 | 804,16 | 168,87 |
| 6 | FACTURA CANO 1-2026.pdf | **Villegas** | CARFERTRANSPORTO627, SL | B67394387 | 1 (CANO) | 31/01/2026 | 10.648,00 | 8.800,00 | 1.848,00 |
| 7 | FACTURA JSTRANS 2-2026.pdf | **Villegas** (Villegas Logistics Solutions SL) | JS Trans 2016 SL | B67181768 | 2 (JSTRANS) | 31/01/2026 | 3.896,81 | 3.390,00* | 21% |
| 8 | FACTURA JSTRANS 3-2026.pdf | **Villegas** | JS Trans 2016 SL | B67181768 | 3 (JSTRANS) | 31/01/2026 | 1.504,70 | 1.309,00* | 21% |

\* En JSTRANS hay descuento 5% sobre base; el total ya lo incluye.

---

## 2. Estructura de cada tipo de factura

### 2.1 Facturas Yenifer / Edison (formato “Barcelona-IFEMA”)

- **Cabecera:** FACTURA, N.º DE FACTURA, FECHA, FACTURAR A (nombre + DNI + dirección del titular).
- **Cuenta / destinatario económico:** NUMERO DE CUENTA + razón social + CIF + dirección + teléfono + IBAN.
- **Líneas:** DESCRIPCIÓN | DÍAS | PRECIO UNITARIO | IMPORTE.
- **Totales:** SUBTOTAL, IVA 21%, RET-1%, TOTAL.
- **Emisor:** Se deduce por el “FACTURAR A” (Yenifer Rodríguez / Edison Javier = empresa que emite a nombre de autónomo).

### 2.2 Facturas Villegas (formato “Villegas Logistics”)

- **Cabecera:** Factura, FECHA, Nº.
- **Dos columnas:** CLIENTE (nombre, CIF, dirección, teléfono) | INFORMACION DE EMPRESA (Villegas Logistics Solucions, B70941000, etc.).
- **Líneas:** DIA | DESCRIPCION | PRECIO | IMPORTE (p. ej. “RUTA 268”, “RUTA 126”).
- **Totales:** Base Imponible, IVA 21%, TOTAL A LIQUIDAR.

### 2.3 Facturas Villegas → JS Trans (formato “JS Trans 2016 SL”)

- **Emisor:** VILLEGAS LOGISTICS SOLUTIONS SL (B70941000).
- **Cliente:** JS Trans 2016 SL (B67181768).
- **Líneas:** FECHA | PRECIO | UDS | IMPORTE | CONCEPTO | CLIENTE (ref. interna).
- **Totales:** Base, descuento, IVA 21%, IRPF, TOTAL.

---

## 3. Cómo haría la importación

### Opción A (recomendada): JSON de datos + PDFs en carpeta

1. **Copiar los 8 PDFs** a `data/facturas-historicas/` (o a una subcarpeta `enero-2026/`).
2. **Crear un JSON** (p. ej. `facturas-enero-2026.json`) con una factura por cada PDF, usando los datos extraídos de la tabla del apartado 1.
3. **En cada factura en el JSON:**
   - `empresa`: `"Yenifer"`, `"Edison"` o `"Villegas"` (según la columna “Emisor”).
   - `cliente`: CIF del cliente (A08887473, B66617010, etc.) o nombre fiscal si en el programa está así.
   - `numero_manual`: el número que aparece en el PDF (1, 2, 4, 5, "1-CANO", "2-JSTRANS", "3-JSTRANS"…).
   - `fecha_emision`: `"2026-01-31"`.
   - `total`, `base_imponible`, `iva_porcentaje`: 21.
   - `lineas`: una o varias líneas con concepto, cantidad, precio_unitario, iva_porcentaje, subtotal (según lo que salga del PDF).
   - `archivo_pdf`: nombre del archivo en la carpeta (ej. `"FACTURA 01-2026 (1).pdf"`).
   - `pagada`: `true`, `fecha_pago`: por ejemplo `"2026-01-31"` o la fecha real si la conoces.
   - `enviada`: `true` si quieres que conste como enviada.

4. **Ejecutar el script de importación** actual:
   ```bash
   node scripts/importar-facturas-historicas.mjs data/facturas-historicas/facturas-enero-2026.json
   ```
   Eso crea facturas + líneas + pago en el programa.

5. **Subir los PDFs a Supabase** y rellenar `archivo_url` de cada factura (opcional):
   - O ampliar el script para que, si existe `archivo_pdf` y el archivo está en la misma carpeta (o en `data/facturas-historicas/`), suba el PDF al bucket `facturas-externas` y actualice la factura con la URL.

### Opción B: Parser automático de PDF

- Usar una librería (pdf-parse, pdfjs-dist, etc.) para extraer texto de cada PDF y, con reglas o heurísticas, rellenar empresa, cliente, número, fechas, líneas y totales.
- **Pros:** menos trabajo manual.
- **Contras:** tres formatos distintos (Yenifer/Edison, Villegas estándar, Villegas JSTRANS); frágil ante cambios de maquetación; hay que mantener el parser.

Recomendación: usar **Opción A** para estas 8 facturas y, si más adelante hay muchas más, valorar un pequeño parser solo para el formato que más se repita.

### Opción C: Solo colgar los PDFs

- Subir los PDFs al Storage y crear en el programa una “factura externa” por cada una con solo: empresa, cliente, número, fecha, total y `archivo_url`.
- Las líneas podrían ser una sola (“Factura externa – ver PDF”) o dejarse vacías y que el detalle esté solo en el PDF.

---

## 4. Prerrequisitos en el programa

- **Empresas** con nombre reconocible: Yenifer, Edison, Villegas (el script ya resuelve por nombre).
- **Clientes** dados de alta con el CIF correcto (o nombre fiscal que coincida) y asociados a la empresa correspondiente en `clientes_empresas`:
  - COMERCIAL FRAMAN S.A (A08887473)
  - Yerai serveis Logistic S.L. (B66617010)
  - MILTON CASTIBLANCO (54449716E)
  - RADOCKS S.L. (B60901766)
  - EMPRESAS RAMONEDA S.A (A08227829)
  - CARFERTRANSPORTO627, SL (B67394387)
  - JS Trans 2016 SL (B67181768)

Si falta alguno, hay que crearlo en Ventas › Clientes y asignarlo a la empresa.

---

## 5. Siguiente paso concreto

1. Copiar los 8 PDFs a `data/facturas-historicas/enero-2026/` (o directamente a `data/facturas-historicas/`).
2. Crear `data/facturas-historicas/facturas-enero-2026.json` con las 8 facturas en el formato del README (y de `facturas-enero.ejemplo.json`), usando la tabla de este documento.
3. Ejecutar:
   ```bash
   node scripts/importar-facturas-historicas.mjs data/facturas-historicas/facturas-enero-2026.json
   ```
4. **Hecho:** El script sube cada PDF desde `data/facturas-historicas` al bucket `facturas-externas` (ruta `facturas/historicas/{factura_id}.pdf`) y asigna `archivo_url` a la factura para poder descargarlo desde el programa.

5. **Numeración siguiente:** Tras importar, el script deja las series listas para que la siguiente factura nueva sea: **Edison = 2**, **Yenifer = 3** (codificado como 0003 si la serie usa 4 dígitos). No se modifica la serie de Villegas.

Si quieres, el siguiente paso puede ser generar yo mismo el `facturas-enero-2026.json` con las 8 facturas y las líneas aproximadas a partir de este análisis, para que solo tengas que revisar y ejecutar el script.
