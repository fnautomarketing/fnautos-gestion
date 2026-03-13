sed -i 's/(supabase as any)/(supabase as unknown as import("@supabase\/supabase-js").SupabaseClient)/g' src/app/actions/plantillas.ts
sed -i 's/(supabase as any)/(supabase as unknown as import("@supabase\/supabase-js").SupabaseClient)/g' src/app/actions/recordatorios.ts
sed -i 's/(supabase as any)/(supabase as unknown as import("@supabase\/supabase-js").SupabaseClient)/g' src/app/actions/notificaciones.ts
sed -i 's/(supabase as any)/(supabase as unknown as import("@supabase\/supabase-js").SupabaseClient)/g' src/app/actions/empresas-crud.ts
sed -i 's/(adminClient as any)/(adminClient as unknown as import("@supabase\/supabase-js").SupabaseClient)/g' src/app/actions/conceptos.ts
