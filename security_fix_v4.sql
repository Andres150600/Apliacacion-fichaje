-- ============================================================
-- WorkClock - Parche de seguridad v4
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- 1. Activar extensión pg_cron (viene incluida en Supabase)
create extension if not exists pg_cron;

-- 2. Programar limpieza diaria de intentos_login a las 3:00 AM
--    Elimina intentos con más de 1 día de antigüedad
select cron.schedule(
  'limpiar_intentos_login_diario',   -- nombre del job
  '0 3 * * *',                       -- cada día a las 3:00 AM
  'select limpiar_intentos_login()'
);
