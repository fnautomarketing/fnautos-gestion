# RFC-016: Invoice Payments Management Implementation

## Overview
Implemented a complete invoice payment management system, including registration, tracking, bank reconciliation, partial payments, and due date control.

## Database Changes
1. **New Table**: `pagos` created with RLS policies and indexes.
2. **Triggers**:
   - `trigger_pagos_updated_at`: Updates `updated_at` col.
   - `actualizar_estado_factura_por_pago`: Automatically updates invoice status (`pagada`, `parcial`, `emitida`) and `pagado`/`fecha_pago` fields when payments are inserted/updated/deleted.
3. **Table Updates**:
   - Added `fecha_pago` column to `facturas` table.
4. **Views**:
   - `vista_pagos_dashboard`: Joins payments with invoices and clients for dashboard display.
5. **Storage**:
   - Created `comprobantes` bucket with RLS policies.

## Backend Logic
1. **Server Actions** (`src/app/actions/pagos.ts`):
   - `registrarPagoAction`: Validates and inserts payment, updates invoice state via trigger.
   - `anularPagoAction`: Marks payment as anulado.
   - `toggleConciliadoAction`: Toggles reconciliation status.
   - `subirComprobanteAction`: Uploads receipt to Storage.
   - `getEstadisticasPagosAction`: Calculates dashboard metrics.
2. **Validation** (`src/lib/validations/pago-schema.ts`):
   - Zod schema for payment data validation.

## Frontend
1. **Pages**:
   - `/ventas/pagos`: Main dashboard with stats and filtered table.
   - `/ventas/pagos/registrar`: Form to register new payments.
2. **Components**:
   - `PagosStats`: Cards showing key metrics (Total Cobrado, Pendiente, Vencidos, Conciliados).
   - `PagosTabla`: Tabbed table with search and filters.
   - `PagoForm`: Form with validation for registering payments.

## Usage
- Navigate to **Ventas > Pagos**.
- Use "Registrar Pago" to add a payment for an emitted/partial invoice.
- Payment amount is validated against pending balance.
- Invoice status updates automatically.
