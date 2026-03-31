-- Habilitar extensión pg_cron si no está habilitada
create extension if not exists pg_cron with schema extensions;

-- Función para limpiar tokens de firma expirados hace más de 30 días,
-- manteniendo el estado pendiente_firma para que pueda reenviarse.
create or replace function public.cleanup_expired_firma_tokens()
returns void
language plpgsql
security definer
as $$
begin
  update public.contratos
  set token_firma = null,
      token_firma_expira = null
  where estado = 'pendiente_firma'
    and token_firma_expira is not null
    and token_firma_expira < (now() - interval '30 days');
end;
$$;

-- Revocar acceso público a la función por seguridad
revoke execute on function public.cleanup_expired_firma_tokens() from public;
revoke execute on function public.cleanup_expired_firma_tokens() from anon;
revoke execute on function public.cleanup_expired_firma_tokens() from authenticated;

-- Eliminar tarea programada anterior si existe (idempotencia)
do $$
begin
  perform cron.unschedule('cleanup-expired-firma-tokens');
exception when others then
  -- ignorar error si no existía
end;
$$;

-- Programar el cron job para ejecutarse todos los días a las 02:00 AM
select cron.schedule(
  'cleanup-expired-firma-tokens', -- nombre del cron job
  '0 2 * * *',                    -- cron format: todos los días a las 2 AM
  $$select public.cleanup_expired_firma_tokens()$$
);
