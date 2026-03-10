# Datos de Empresas - Referencia para Verificación

Documento de referencia con los datos de las empresas del sistema para comprobar que están correctos en la base de datos.

---

## IDs de referencia (usados en código y migraciones)

| Empresa | ID (UUID) | Prefijo serie | Series conocidas |
|---------|-----------|---------------|------------------|
| **Villegas** | `4b77324c-a10e-4714-b0a4-df4b9c5f6ca5` | V | V2026, F2026 |
| **Yenifer** | `e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a` | Y | Y2026 |
| **Edison** | `af15f25a-7ade-4de8-9241-a42e1b8407da` | E | E2026 |

> **Nota:** Estos IDs están hardcodeados en migraciones, scripts y tests E2E. La base de datos debe tener empresas con estos IDs para que el sistema funcione correctamente.

---

## Empresa 1: Villegas Logistics Solucions

| Campo | Valor esperado | Fuente |
|-------|----------------|--------|
| **ID** | `4b77324c-a10e-4714-b0a4-df4b9c5f6ca5` | Migraciones |
| **Razón social** | Villegas Logistics Solucions | Datos reales |
| **Nombre comercial** | Villegas Logistics | — |
| **CIF** | B70941000 | Datos reales |
| **Tipo** | sl (Sociedad Limitada) | — |
| **Dirección** | Carretera de Terrassa 148 1°1° | Datos reales |
| **Código postal** | 08206 | Datos reales |
| **Ciudad** | Sabadell | Datos reales |
| **Provincia** | Barcelona | Datos reales |
| **País** | España | — |
| **Teléfono** | 685.829.593 | Datos reales |
| **Email** | administracion@stvls.com | Común todas |
| **Web** | — | — |
| **IBAN** | ES2321000804380201246875 | Datos reales |
| **Banco** | — | — |
| **Titular cuenta** | Villegas Logistics Solucions | — |
| **IVA predeterminado** | 21% | — |
| **Retención IRPF** | 0% | TASK_10 |
| **Recargo equivalencia** | false | — |
| **Días pago** | 30 | — |
| **Lugar expedición** | Sabadell | — |
| **Plantilla PDF** | Premium (Plantilla Corporativa) | usuarios-empresas.ts |

---

## Empresa 2: Yenifer Rodriguez Lopez (autónomo)

| Campo | Valor esperado | Fuente |
|-------|----------------|--------|
| **ID** | `e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a` | Migraciones |
| **Razón social** | YENIFER RODRIGUEZ LOPEZ | Datos reales |
| **Nombre comercial** | — | — |
| **CIF/NIF** | 43582793R | Datos reales |
| **Tipo** | autonomo | — |
| **Dirección** | Carretera de Terrassa 148-156 | Datos reales |
| **Código postal** | 08206 | Datos reales |
| **Ciudad** | Sabadell | Datos reales |
| **Provincia** | Barcelona | Datos reales |
| **País** | España | — |
| **Teléfono** | 695972433 | Datos reales |
| **Email** | administracion@stvls.com | Común todas |
| **Web** | — | — |
| **IBAN** | ES0621003107732200208554 | Datos reales |
| **Banco** | — | — |
| **Titular cuenta** | YENIFER RODRIGUEZ LOPEZ | — |
| **IVA predeterminado** | 21% | — |
| **Retención IRPF** | 0% (TASK_10: sin IRPF) | TASK_10 |
| **Recargo equivalencia** | false | — |
| **Días pago** | 15 | — |
| **Lugar expedición** | Sabadell | — |
| **Plantilla PDF** | Estándar | usuarios-empresas.ts |

---

## Empresa 3: Edison Javier Arenas Arroyave (autónomo)

| Campo | Valor esperado | Fuente |
|-------|----------------|--------|
| **ID** | `af15f25a-7ade-4de8-9241-a42e1b8407da` | Migraciones |
| **Razón social** | EDISON JAVIER ARENAS ARROYAVE | Datos reales |
| **Nombre comercial** | — | — |
| **CIF/NIF** | 43586155M | Datos reales |
| **Tipo** | autonomo | — |
| **Dirección** | C/Domenech i Montaner 14 3º2º | Datos reales |
| **Código postal** | 08205 | Datos reales |
| **Ciudad** | Sabadell | Datos reales |
| **Provincia** | Barcelona | Datos reales |
| **País** | España | — |
| **Teléfono** | 662234567 | Datos reales |
| **Email** | administracion@stvls.com | Común todas |
| **Web** | — | — |
| **IBAN** | ES7500810011710002014204 | Datos reales |
| **Banco** | — | — |
| **Titular cuenta** | EDISON JAVIER ARENAS ARROYAVE | — |
| **IVA predeterminado** | 21% | — |
| **Retención IRPF** | **-1%** (TASK_10) | TASK_10 |
| **Recargo equivalencia** | false | — |
| **Días pago** | 30 | — |
| **Lugar expedición** | Sabadell | — |
| **Plantilla PDF** | Estándar | usuarios-empresas.ts |

---

## Series de facturación

| Empresa | Código serie | Formato | Ejemplo |
|---------|--------------|---------|---------|
| Villegas | V2026 o F2026 | V2026-0001 / F2026-0001 | 4 dígitos |
| Yenifer | Y2026 | Y2026-0001 | 4 dígitos |
| Edison | E2026 | E2026-0001 | 4 dígitos |

---

## Cuenta de administración

| Campo | Valor |
|-------|-------|
| **Email** | administracion@stvls.com |
| **Contraseña** | TecM@s.$4 |
| **Rol** | admin (Visión Global) |
| **Acceso** | Todas las empresas |

---

## Cómo verificar los datos

### 1. Script de verificación (requiere .env.local)

```bash
node scripts/verify-test-companies.js
```

### 2. Consulta directa en Supabase

```sql
SELECT id, razon_social, nombre_comercial, cif, tipo_empresa, ciudad, email, retencion_predeterminada
FROM empresas
WHERE id IN (
  '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5',
  'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a',
  'af15f25a-7ade-4de8-9241-a42e1b8407da'
)
ORDER BY razon_social;
```

### 3. Verificar series

```sql
SELECT e.razon_social, s.codigo, s.numero_actual, s.predeterminada
FROM series_facturacion s
JOIN empresas e ON e.id = s.empresa_id
WHERE s.empresa_id IN (
  '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5',
  'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a',
  'af15f25a-7ade-4de8-9241-a42e1b8407da'
)
ORDER BY e.razon_social, s.codigo;
```

---

## Notas

- **Email común** para las 3 empresas: administracion@stvls.com
- **IBAN**: Datos reales proporcionados. Formato en BD sin espacios (ej. ES2321000804380201246875).
- **IRPF Edison**: TASK_10 indica -1%. Verificar que `retencion_predeterminada` en la BD sea -1.

---

## Archivos de referencia

- `scripts/create-test-companies.js` — Datos de creación inicial
- `scripts/verify-test-companies.js` — Verificación
- `scripts/seed-clientes-empresas.mjs` — IDs de empresas
- `supabase/migrations/20260216_series_v2026_y2026_e2026.sql` — Series por empresa
- `TASK_10_CONFIG_DATOS.md` — IRPF y usuario administración
