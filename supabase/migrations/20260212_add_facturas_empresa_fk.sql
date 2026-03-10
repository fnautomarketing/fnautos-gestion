-- Add FK constraint for facturas.empresa_id to allow joins with companies
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_facturas_empresa' 
    AND table_name = 'facturas'
  ) THEN 
    ALTER TABLE "public"."facturas" 
    ADD CONSTRAINT "fk_facturas_empresa" 
    FOREIGN KEY ("empresa_id") 
    REFERENCES "public"."empresas" ("id") ON DELETE CASCADE;
  END IF;
END $$;
