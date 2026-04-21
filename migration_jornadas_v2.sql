-- ============================================================
-- WorkClock - Migración v2: jornadas N:N con empleados
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- 1. Tabla intermedia empleado_turnos (N empleados ↔ N jornadas)
create table if not exists empleado_turnos (
  empleado_id uuid references empleados(id) on delete cascade,
  turno_id    uuid references turnos(id)    on delete cascade,
  primary key (empleado_id, turno_id)
);

alter table empleado_turnos enable row level security;
create policy "et_all" on empleado_turnos for all using (true) with check (true);

-- 2. Migrar asignaciones existentes (empleados.turno_id → tabla intermedia)
insert into empleado_turnos (empleado_id, turno_id)
select id, turno_id from empleados where turno_id is not null
on conflict do nothing;

-- 3. Eliminar columna turno_id de empleados (la relación ahora está en empleado_turnos)
alter table empleados drop column if exists turno_id;
