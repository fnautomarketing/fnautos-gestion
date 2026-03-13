import fs from 'fs';

let content = fs.readFileSync('src/app/actions/ventas.ts', 'utf-8');

// Line 34
content = content.replace(
  "await (supabase as any).rpc('liberar_numero_serie'",
  "await (supabase as unknown as { rpc: (name: string, payload: Record<string, unknown>) => Promise<{error: Error | null}> }).rpc('liberar_numero_serie'"
);

// Line 45
content = content.replace(
  "await (supabase as any).rpc('obtener_proximo_numero_preview'",
  "await (supabase as unknown as { rpc: (name: string, payload: Record<string, unknown>) => Promise<{data: unknown, error: Error | null}> }).rpc('obtener_proximo_numero_preview'"
);

// Line 114
content = content.replace(
  "await (supabase.from('facturas') as any)\n            .insert",
  "await supabase.from('facturas')\n            .insert"
);

// Line 236
content = content.replace(
  "if (cliente && (cliente as any).tipo_cliente === 'particular') {",
  "if (cliente && 'tipo_cliente' in cliente && cliente.tipo_cliente === 'particular') {"
);

// Line 275-276
content = content.replace(
  "importe_descuento: (validatedData as any).importe_descuento ?? 0,",
  "importe_descuento: ('importe_descuento' in validatedData ? Number(validatedData.importe_descuento) : 0),"
);
content = content.replace(
  "importe_retencion: (validatedData as any).importe_retencion ?? 0,",
  "importe_retencion: ('importe_retencion' in validatedData ? Number(validatedData.importe_retencion) : 0),"
);

// Line 281
content = content.replace(
  "            } as any)",
  "            })"
);

// Line 401
content = content.replace(
  "if (cliente && (cliente as any).tipo_cliente === 'particular') {",
  "if (cliente && 'tipo_cliente' in cliente && cliente.tipo_cliente === 'particular') {"
);

// Line 438
content = content.replace(
  "(updates as any).archivo_url = archivo_url",
  "(updates as FacturaUpdate & { archivo_url?: string }).archivo_url = archivo_url"
);

// Line 447
content = content.replace(
  "(updates as any).cliente_id = cliente_id",
  "updates.cliente_id = cliente_id"
);

// Line 451
content = content.replace(
  "(updates as any).fecha_emision = fecha_emision",
  "updates.fecha_emision = fecha_emision"
);

// Line 526
content = content.replace(
  ".update(updates as any)",
  ".update(updates)"
);

// Line 675
content = content.replace(
  "if ((factura as any).estado === 'anulada') {",
  "if (factura.estado === 'anulada') {"
);

// Line 795
content = content.replace(
  "const { numero, serieCodigo } = await obtenerSiguienteNumero(empresaId, serie)",
  "const { numero } = await obtenerSiguienteNumero(empresaId, serie)"
);

// Line 846
content = content.replace(
  ".insert(nuevaFactura as any)",
  ".insert(nuevaFactura)"
);

// Line 925
content = content.replace(
  "if ((factura as any).estado === 'pagada') {",
  "if ('estado' in factura && factura.estado === 'pagada') {"
);

// Line 940-941
content = content.replace(
  "if ((factura as any).estado === 'borrador' && (factura as any).es_externa && (factura as any).serie_id && (factura as any).numero !== '000') {\n            await liberarNumeroSerie((factura as any).serie_id)\n        }",
  "if ('estado' in factura && factura.estado === 'borrador' && 'es_externa' in factura && factura.es_externa && 'serie_id' in factura && factura.serie_id && 'numero' in factura && factura.numero !== '000') {\n            await liberarNumeroSerie(String(factura.serie_id))\n        }"
);

fs.writeFileSync('src/app/actions/ventas.ts', content, 'utf-8');
