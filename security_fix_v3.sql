-- ============================================================
-- WorkClock - Parche de seguridad v3
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- ============================================================
-- 1. RLS en fichajes
--    - anon puede SELECT, INSERT y UPDATE (para registrar entrada/salida)
--    - no puede DELETE
-- ============================================================
alter table fichajes enable row level security;

drop policy if exists "fichajes_select" on fichajes;
drop policy if exists "fichajes_insert" on fichajes;
drop policy if exists "fichajes_update" on fichajes;

create policy "fichajes_select" on fichajes
  for select using (true);

create policy "fichajes_insert" on fichajes
  for insert with check (true);

create policy "fichajes_update" on fichajes
  for update using (true);

-- ============================================================
-- 2. RLS en ausencias
--    - anon puede SELECT e INSERT (empleado solicita su ausencia)
--    - UPDATE solo via RPC (admin aprueba/rechaza) — bloqueado para anon directo
-- ============================================================
alter table ausencias enable row level security;

drop policy if exists "ausencias_select" on ausencias;
drop policy if exists "ausencias_insert" on ausencias;

create policy "ausencias_select" on ausencias
  for select using (true);

create policy "ausencias_insert" on ausencias
  for insert with check (true);

-- UPDATE y DELETE bloqueados para anon — el admin usa la función RPC admin_cambiar_ausencia

-- ============================================================
-- 3. RPC para que el admin apruebe/rechace ausencias
--    Reemplaza el UPDATE directo desde el frontend
-- ============================================================
create or replace function admin_cambiar_ausencia(
  p_admin_id  uuid,
  p_admin_pin text,
  p_aus_id    uuid,
  p_estado    text
)
returns json
language plpgsql
security definer
as $$
declare
  admin_emp empleados%rowtype;
begin
  if p_estado not in ('aprobada', 'rechazada') then
    return json_build_object('ok', false, 'error', 'Estado no válido');
  end if;

  select * into admin_emp
    from empleados
   where id = p_admin_id and activo = true and es_admin = true;

  if not found or admin_emp.pin != crypt(p_admin_pin, admin_emp.pin) then
    return json_build_object('ok', false, 'error', 'No autorizado');
  end if;

  update ausencias set estado = p_estado where id = p_aus_id;
  return json_build_object('ok', true);
end;
$$;

-- ============================================================
-- 4. RLS en turnos
--    - anon puede SELECT
--    - INSERT/UPDATE/DELETE bloqueados (solo via dashboard o RPC admin)
-- ============================================================
alter table turnos enable row level security;

drop policy if exists "turnos_select" on turnos;
drop policy if exists "turnos_insert" on turnos;
drop policy if exists "turnos_update" on turnos;
drop policy if exists "turnos_delete" on turnos;

create policy "turnos_select" on turnos
  for select using (true);

-- RPC para crear turno con autenticación admin
create or replace function admin_crear_turno(
  p_admin_id    uuid,
  p_admin_pin   text,
  p_nombre      text,
  p_empleado_id uuid,
  p_hora_entrada text,
  p_hora_salida  text,
  p_dias_semana  int[]
)
returns json
language plpgsql
security definer
as $$
declare
  admin_emp empleados%rowtype;
begin
  select * into admin_emp
    from empleados
   where id = p_admin_id and activo = true and es_admin = true;

  if not found or admin_emp.pin != crypt(p_admin_pin, admin_emp.pin) then
    return json_build_object('ok', false, 'error', 'No autorizado');
  end if;

  insert into turnos (nombre, empleado_id, hora_entrada, hora_salida, dias_semana, activo)
  values (p_nombre, p_empleado_id, p_hora_entrada, p_hora_salida, p_dias_semana, true);

  return json_build_object('ok', true);
end;
$$;

-- RPC para eliminar turno con autenticación admin
create or replace function admin_eliminar_turno(
  p_admin_id  uuid,
  p_admin_pin text,
  p_turno_id  uuid
)
returns json
language plpgsql
security definer
as $$
declare
  admin_emp empleados%rowtype;
begin
  select * into admin_emp
    from empleados
   where id = p_admin_id and activo = true and es_admin = true;

  if not found or admin_emp.pin != crypt(p_admin_pin, admin_emp.pin) then
    return json_build_object('ok', false, 'error', 'No autorizado');
  end if;

  update turnos set activo = false where id = p_turno_id;
  return json_build_object('ok', true);
end;
$$;

-- ============================================================
-- 5. RLS en documentos
--    - anon puede SELECT
--    - INSERT/UPDATE/DELETE bloqueados (solo via dashboard de Supabase)
-- ============================================================
alter table documentos enable row level security;

drop policy if exists "documentos_select" on documentos;

create policy "documentos_select" on documentos
  for select using (true);
