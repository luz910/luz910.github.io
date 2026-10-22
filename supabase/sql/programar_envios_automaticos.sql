-- =====================================================================
-- BIOQUNS — Revisión automática de novedades para el newsletter
-- Ejecutar DESPUÉS de desplegar la Edge Function "admin" y de definir el
-- secreto CRON_SECRET (ver README, sección "Correo electrónico").
--
-- Cada 10 minutos, la base de datos llama a la función, que busca artículos,
-- cursos (y publicaciones, si está activado) que ya estén publicados y aún no
-- se hayan avisado. Así también funcionan las publicaciones programadas.
--
-- Reemplazá los dos valores marcados antes de ejecutar:
--   TU-PROYECTO   → el identificador de tu proyecto (https://TU-PROYECTO.supabase.co)
--   TU-CRON-SECRET → el mismo valor que guardaste como secreto CRON_SECRET
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Guarda el secreto en el Vault cifrado de Supabase (no queda en texto plano en el job).
select vault.create_secret('TU-CRON-SECRET', 'bioquns_cron_secret')
where not exists (select 1 from vault.secrets where name = 'bioquns_cron_secret');

select cron.unschedule('bioquns-novedades')
where exists (select 1 from cron.job where jobname = 'bioquns-novedades');

select cron.schedule(
  'bioquns-novedades',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://TU-PROYECTO.supabase.co/functions/v1/admin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'bioquns_cron_secret')
    ),
    body := '{"action":"dispatch"}'::jsonb
  );
  $$
);

-- Para comprobar: select * from cron.job;  y  select * from cron.job_run_details order by start_time desc limit 5;
