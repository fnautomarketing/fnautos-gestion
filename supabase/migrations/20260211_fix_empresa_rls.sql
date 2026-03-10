
-- 1. Enable RLS on usuarios_empresas if not already enabled
alter table usuarios_empresas enable row level security;

-- 2. Drop existing policy if exists to avoid conflict
drop policy if exists "Usuarios pueden ver sus propias vinculaciones" on usuarios_empresas;

-- 3. Create policy for usuarios_empresas
create policy "Usuarios pueden ver sus propias vinculaciones"
on usuarios_empresas for select
using ( auth.uid() = user_id );


-- 4. Enable RLS on empresas if not already enabled
alter table empresas enable row level security;

-- 5. Drop existing policy if exists to avoid conflict
drop policy if exists "Usuarios pueden ver empresas a las que pertenecen" on empresas;

-- 6. Create policy for empresas (users can see company details if they belong to it)
create policy "Usuarios pueden ver empresas a las que pertenecen"
on empresas for select
using (
  exists (
    select 1 from usuarios_empresas
    where usuarios_empresas.empresa_id = empresas.id
    and usuarios_empresas.user_id = auth.uid()
  )
);
