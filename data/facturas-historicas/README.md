# Facturas históricas (enero y otras)

Facturas creadas, enviadas y cobradas **fuera del programa** (a mano o por otra persona). Aquí puedes añadir los datos para importarlas al sistema y que aparezcan en Ventas › Facturas, Pagos e informes.

## Cómo usarlo

1. **Copia el archivo de ejemplo**  
   - Copia `facturas-enero.ejemplo.json` y renómbralo a `facturas-enero.json` (o el nombre que quieras, p. ej. `facturas-enero-2025.json`).

2. **Rellena tus facturas**  
   - Abre el JSON y edita el array `facturas`. Cada objeto es una factura.  
   - Puedes poner **solo los datos que tengas**; lo mínimo es: empresa, cliente, número, fechas y total (o líneas).  
   - Si no recuerdas el CIF del cliente, usa el **nombre fiscal**; el importador intentará localizar el cliente por CIF o por nombre.

3. **Opcional: PDFs**  
   - Si tienes el PDF de cada factura, pon los archivos en esta misma carpeta y en cada factura indica el nombre del archivo en `archivo_pdf` (ej. `"archivo_pdf": "factura-001.pdf"`).  
   - El script de importación podrá subirlos a Supabase y enlazarlos a la factura.

4. **Ejecutar la importación**  
   - Cuando el archivo esté listo, se puede ejecutar el script de importación (ver más abajo) para crear las facturas en el programa con estado “emitida”, “enviada” y “pagada” según indiques.

## Formato de cada factura en el JSON

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `empresa` | Sí | Nombre de la empresa que emitió la factura (ej. `"Villegas"`, `"Edison"`) o UUID si lo conoces. |
| `cliente` | Sí | CIF/NIF del cliente **o** nombre fiscal (ej. `"ACME S.L."`). Se busca el cliente por CIF o por nombre. |
| `numero_manual` | Sí | Número que tiene la factura (ej. `"F2025-0001"`, `"1"`). |
| `fecha_emision` | Sí | Fecha de emisión en formato `YYYY-MM-DD` (ej. `"2025-01-15"`). |
| `fecha_vencimiento` | No | Fecha de vencimiento `YYYY-MM-DD`. Si no se pone, se calcula según días de pago. |
| `total` | Sí* | Importe total con IVA. *Si pones `lineas`, se puede calcular solo con las líneas. |
| `base_imponible` | No | Base imponible. Si no se pone y hay `total` e `iva_porcentaje`, se calcula. |
| `iva_porcentaje` | No | IVA aplicado (ej. 21). Por defecto 21. |
| `lineas` | Recomendado | Array de líneas: `concepto`, `descripcion` (opcional), `cantidad`, `precio_unitario`, `iva_porcentaje`, `subtotal`. |
| `enviada` | No | `true` si la factura se envió por email al cliente. |
| `email_enviado_a` | Si enviada | Email al que se envió (ej. `"cliente@ejemplo.com"`). |
| `fecha_pago` | Si pagada | Fecha en que se cobró `YYYY-MM-DD`. |
| `pagada` | No | `true` si ya está cobrada. |
| `metodo_pago` | No | Ej. `"Transferencia"`, `"Domiciliación"`. |
| `referencia_pago` | No | Referencia del pago si la tienes. |
| `archivo_pdf` | No | Nombre del archivo PDF en esta carpeta (ej. `"enero-001.pdf"`) para subirlo y enlazarlo. |
| `notas` | No | Notas internas. |

## Empresas reconocidas

El importador reconoce por nombre (sin distinguir mayúsculas/minúsculas) algo como:

- `Villegas`, `Villegas Asociados`, etc. → empresa Villegas  
- `Edison`, `Edison Javier`, etc. → empresa Edison  
- `Yenifer` → empresa Yenifer  

Si usas el **UUID** de la empresa en lugar del nombre, también funciona.

## Después de importar

- Las facturas aparecerán en **Ventas › Facturas** con estado **Emitida** o **Pagada**.  
- Si indicaste `enviada: true` y `email_enviado_a`, se creará un registro de envío y la factura podrá salir en filtros de “enviada”.  
- Si indicaste `pagada: true` y `fecha_pago`, se creará el pago y el estado pasará a **Pagada**.  
- Los informes y totales de facturación incluirán estas facturas.

## Cómo descargar los PDF subidos en la aplicación

Los PDF que indicaste en `archivo_pdf` se suben a Supabase Storage y se enlazan a cada factura. Para descargarlos:

1. Entra en **Ventas › Facturas** y elige la empresa en el selector del header si tienes varias.
2. Haz clic en la fila de la factura para abrir el **detalle** (no debe aparecer error 404).
3. En el detalle, pulsa el botón **«Descargar PDF»**.
4. Se abre la página de vista/descarga de PDF. Si esa factura tiene PDF original subido, verás el botón **«Descargar PDF original»**; al pulsarlo se abre o descarga el archivo.  
   Si no tiene PDF original, puedes usar **«Descargar PDF»** para generar uno con la plantilla del programa.

## Dónde está el script de importación

El script que lee este JSON e inserta en la base de datos está en la raíz del proyecto:

- **`scripts/importar-facturas-historicas.mjs`**

Uso (desde la raíz del proyecto; usa `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`):

```bash
node scripts/importar-facturas-historicas.mjs data/facturas-historicas/facturas-enero.json
```

Antes de ejecutarlo en producción, conviene probar con 1–2 facturas en un archivo de prueba (por ejemplo copiando el ejemplo y renombrándolo).
