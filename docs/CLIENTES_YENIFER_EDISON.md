# Clientes comunes Yenifer + Edison

## Análisis de datos proporcionados

| Cliente | CIF/NIF | Tipo | Dirección | CP | Ciudad | Provincia | Teléfono | Email |
|---------|---------|------|-----------|-----|--------|-----------|----------|-------|
| ROIELLA S.L | B60710282 | Empresa | AVD.prat de la riba 180 nv 7 | 08780 | Palleja | Barcelona | — | Vicentecalzadaprieto1966@gmail.com |
| Yerai Serveis Logistic S.L. | B66617010 | Empresa | Pol. industrial Moli d'en Xec, c/Moli d'en Xec, Nau 3 | 08291 | Ripollet | Barcelona | 672277660 | traficoserveislogistics@gmail.com |
| MILTON CASTIBLANCO | 54449716E | Autónomo | CALLE SAMUNTADA 52 | 08203 | Sabadell | Barcelona | 615803020 | info@taxitruck.es |
| COMERCIAL FRAMAN S.A | A08887473 | Empresa | C/MANUEL FERNANDEZ MARQUEZ, 30 | 08918 | Badalona | Barcelona | 932081890 | alex@framan.es |

---

## Campos de la aplicación vs datos disponibles

### Campos obligatorios en el formulario (cliente-schema.ts)

| Campo | Tipo | Validación | Datos disponibles |
|-------|------|------------|-------------------|
| nombre_fiscal | string | min 3, max 255 | ✅ Sí (4 clientes) |
| cif | string | validarCIF | ✅ Sí (4 clientes) |
| email_principal | string | email | ✅ Sí (4 clientes) |
| telefono_principal | string | min 9 | ⚠️ **ROIELLA: no tiene teléfono** |
| direccion | string | min 5 | ✅ Sí (4 clientes) |
| codigo_postal | string | 5 dígitos | ✅ Sí (4 clientes) |
| ciudad | string | min 2 | ✅ Sí (4 clientes) |

### Campos opcionales en la aplicación

| Campo | Disponible en datos |
|-------|---------------------|
| nombre_comercial | Parcial (ROIELLA, FRAMAN no tienen) |
| email_secundario | No |
| telefono_secundario | No |
| persona_contacto | No |
| provincia | ✅ Sí (Barcelona en todos) |
| pais | No (se usará "España" por defecto) |
| iban, banco, bic_swift | No |
| forma_pago_predeterminada | No (default: transferencia_30) |
| dias_vencimiento | No (default: 30) |
| descuento_comercial | No (default: 0) |
| iva_aplicable | No (default: 21) |

---

## Problemas detectados

1. **ROIELLA S.L.** no tiene teléfono.  
   - **Solución aplicada:** `telefono_principal` es ahora opcional en el formulario y schema. ROIELLA se inserta sin teléfono.

2. **CIF validation:** 54449716E (MILTON) es NIF de persona → validarCIF lo acepta ✓

3. **tipo_cliente:** MILTON CASTIBLANCO es autónomo; el resto son empresas.

---

## Plan de implementación

### 1. Crear script de seed

Archivo: `scripts/seed-clientes-yenifer-edison.mjs`

- Insertar los 4 clientes en `clientes` (empresa_id = null).
- Insertar en `clientes_empresas` las asociaciones:
  - Cada cliente → `empresa_id` = Yenifer (e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a)
  - Cada cliente → `empresa_id` = Edison (af15f25a-7ade-4de8-9241-a42e1b8407da)

### 2. Datos normalizados para el script

```javascript
const CLIENTES = [
  {
    cif: 'B60710282',
    nombre_fiscal: 'ROIELLA S.L',
    direccion: "AVD.prat de la riba 180 nv 7",
    codigo_postal: '08780',
    ciudad: 'Palleja',
    provincia: 'Barcelona',
    email_principal: 'Vicentecalzadaprieto1966@gmail.com',
    telefono_principal: '000000000', // placeholder - no proporcionado
    tipo_cliente: 'empresa',
  },
  {
    cif: 'B66617010',
    nombre_fiscal: "Yerai Serveis Logistic S.L.",
    direccion: "Poligono industrial Moli d'en Xec c/moli d'en Xec, Nau 3",
    codigo_postal: '08291',
    ciudad: 'Ripollet',
    provincia: 'Barcelona',
    email_principal: 'traficoserveislogistics@gmail.com',
    telefono_principal: '672277660',
    tipo_cliente: 'empresa',
  },
  {
    cif: '54449716E',
    nombre_fiscal: 'MILTON CASTIBLANCO',
    direccion: 'CALLE SAMUNTADA 52',
    codigo_postal: '08203',
    ciudad: 'Sabadell',
    provincia: 'Barcelona',
    email_principal: 'info@taxitruck.es',
    telefono_principal: '615803020',
    tipo_cliente: 'autonomo',
  },
  {
    cif: 'A08887473',
    nombre_fiscal: 'COMERCIAL FRAMAN S.A',
    direccion: 'C/MANUEL FERNANDEZ MARQUEZ, 30',
    codigo_postal: '08918',
    ciudad: 'Badalona',
    provincia: 'Barcelona',
    email_principal: 'alex@framan.es',
    telefono_principal: '932081890',
    tipo_cliente: 'empresa',
  },
]
```

### 3. Ejecución

```bash
node scripts/seed-clientes-yenifer-edison.mjs
```

---

## Resumen

| Aspecto | Estado |
|---------|--------|
| Campos de la aplicación | ✅ Cubren todos los datos necesarios |
| Datos incompletos | ⚠️ ROIELLA sin teléfono → placeholder |
| Validación CIF | ✅ Todos los CIF/NIF válidos |
| Implementación | Script de seed + clientes_empresas (Yenifer + Edison) |
