-- ============================================================
-- WorkClock - Parche de seguridad
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- 1. Eliminar política permisiva de empleados
drop policy if exists "acceso_empleados" on empleados;

-- Solo lectura permitida para anon (y sin PIN, controlado en la RPC)
create policy "leer_empleados" on empleados
  for select using (true);

-- INSERT / UPDATE / DELETE sobre empleados quedan bloqueados para anon
-- Solo accesibles mediante funciones RPC con security definer

-- ============================================================
-- 2. RPC de login: verifica PIN en el servidor
--    Nunca devuelve el PIN al cliente
-- ============================================================
create or replace function verificar_pin(p_id uuid, p_pin text)
returns json
language plpgsql
security definer
as $$
declare
  emp empleados%rowtype;
begin
  select * into emp from empleados where id = p_id and activo = true;
  if not found then
    return json_build_object('ok', false);
  end if;
  if emp.pin != p_pin then
    return json_build_object('ok', false);
  end if;
  -- Devuelve el empleado SIN el campo pin
  return json_build_object(
    'ok', true,
    'empleado', (
      select row_to_json(e) from (
        select id, nombre, email, rol, departamento, cargo,
               es_admin, activo, dias_vacaciones, dias_usados
        from empleados where id = emp.id
      ) e
    )
  );
end;
$$;

-- ============================================================
-- 3. RPC admin: crear empleado (requiere ser admin)
-- ============================================================
create or replace function admin_crear_empleado(
  p_admin_id   uuid,
  p_admin_pin  text,
  p_nombre     text,
  p_email      text,
  p_departamento text,
  p_cargo      text,
  p_pin        text,
  p_dias_vacaciones int default 22
)
returns json
language plpgsql
security definer
as $$
declare
  admin_emp empleados%rowtype;
  new_id uuid;
begin
  -- Verificar que el solicitante es admin con PIN correcto
  select * into admin_emp
    from empleados
   where id = p_admin_id and activo = true and es_admin = true;
  if not found or admin_emp.pin != p_admin_pin then
    return json_build_object('ok', false, 'error', 'No autorizado');
  end if;

  insert into empleados (nombre, email, departamento, cargo, pin, es_admin, rol, activo, dias_vacaciones, dias_usados)
  values (p_nombre, p_email, p_departamento, p_cargo, p_pin, false, 'empleado', true, p_dias_vacaciones, 0)
  returning id into new_id;

  return json_build_object('ok', true, 'id', new_id);
end;
$$;

-- ============================================================
-- 4. RPC admin: desactivar empleado (requiere ser admin)
-- ============================================================
create or replace function admin_desactivar_empleado(
  p_admin_id  uuid,
  p_admin_pin text,
  p_emp_id    uuid
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
  if not found or admin_emp.pin != p_admin_pin then
    return json_build_object('ok', false, 'error', 'No autorizado');
  end if;

  -- Impedir eliminar al propio admin
  if p_emp_id = p_admin_id then
    return json_build_object('ok', false, 'error', 'No puedes eliminarte a ti mismo');
  end if;

  update empleados set activo = false where id = p_emp_id;
  return json_build_object('ok', true);
end;
$$;
