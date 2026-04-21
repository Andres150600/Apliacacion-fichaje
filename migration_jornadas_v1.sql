-- ============================================================
-- WorkClock - Migración jornadas como plantillas globales
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- 1. Añadir turno_id a empleados (relación empleado → jornada)
alter table empleados
  add column if not exists turno_id uuid references turnos(id) on delete set null;

-- 2. Hacer empleado_id nullable en turnos (si no lo era ya)
--    La tabla turnos pasa a ser una plantilla global, sin empleado_id obligatorio
alter table turnos
  alter column empleado_id drop not null;

-- 3. Abrir RLS de turnos para INSERT/UPDATE/DELETE desde service_role
--    (el backend usa service_role key que bypasea RLS, pero dejamos explícito)
drop policy if exists "turnos_insert" on turnos;
drop policy if exists "turnos_update" on turnos;
drop policy if exists "turnos_delete" on turnos;

create policy "turnos_insert" on turnos
  for insert with check (true);

create policy "turnos_update" on turnos
  for update using (true);

create policy "turnos_delete" on turnos
  for delete using (true);
