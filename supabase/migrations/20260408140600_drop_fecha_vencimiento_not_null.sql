-- Migration to drop NOT NULL constraint from fecha_vencimiento since it was removed from the UI
ALTER TABLE public.facturas ALTER COLUMN fecha_vencimiento DROP NOT NULL;
