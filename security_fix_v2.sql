-- ============================================================
-- WorkClock - Parche de seguridad v2
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- 1. Activar extensión bcrypt
create extension if not exists pgcrypto;

-- ============================================================
-- 2. Tabla de control de intentos de login (rate limiting)
-- ============================================================
create table if not exists intentos_login (
  id          uuid default gen_random_uuid() primary key,
  empleado_id uuid not null,
  created_at  timestamptz default now()
);
alter table intentos_login enable row level security;
-- Sin policies = anon no puede leer ni escribir directamente

-- ============================================================
-- 3. Hashear todos los PINs existentes con bcrypt
--    Solo afecta a los que aún están en texto plano
-- ============================================================
update empleados
set pin = crypt(pin, gen_salt('bf', 8))
where pin not like '$2a$%'
  and pin not like '$2b$%'
  and pin not like '$2y$%';

-- ============================================================
-- 4. Actualizar verificar_pin: bcrypt + rate limiting
-- ============================================================
create or replace function verificar_pin(p_id uuid, p_pin text)
returns json
language plpgsql
security definer
as $$
declare
  emp      empleados%rowtype;
  intentos int;
begin
  -- Comprobar intentos fallidos en los últimos 15 minutos
  select count(*) into intentos
  from intentos_login
  where empleado_id = p_id
    and created_at > now() - interval '15 minutes';

  if intentos >= 5 then
    return json_build_object(
      'ok', false,
      'bloqueado', true,
      'error', 'Demasiados intentos. Espera 15 minutos.'
    );
  end if;

  select * into emp from empleados where id = p_id and activo = true;
  if not found then
    return json_build_object('ok', false);
  end if;

  -- Registrar el intento antes de verificar
  insert into intentos_login (empleado_id) values (p_id);

  -- Verificar PIN con bcrypt
  if emp.pin != crypt(p_pin, emp.pin) then
    return json_build_object('ok', false);
  end if;

  -- Éxito: limpiar intentos
  delete from intentos_login where empleado_id = p_id;

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
-- 5. Actualizar admin_crear_empleado: bcrypt + validación PIN
-- ============================================================
create or replace function admin_crear_empleado(
  p_admin_id        uuid,
  p_admin_pin       text,
  p_nombre          text,
  p_email           text,
  p_departamento    text,
  p_cargo           text,
  p_pin             text,
  p_dias_vacaciones int default 22
)
returns json
language plpgsql
security definer
as $$
declare
  admin_emp empleados%rowtype;
  new_id    uuid;
begin
  select * into admin_emp
    from empleados
   where id = p_admin_id and activo = true and es_admin = true;

  if not found or admin_emp.pin != crypt(p_admin_pin, admin_emp.pin) then
    return json_build_object('ok', false, 'error', 'No autorizado');
  end if;

  if length(p_pin) < 4 then
    return json_build_object('ok', false, 'error', 'El PIN debe tener al menos 4 caracteres');
  end if;

  insert into empleados (nombre, email, departamento, cargo, pin, es_admin, rol, activo, dias_vacaciones, dias_usados)
  values (p_nombre, p_email, p_departamento, p_cargo,
          crypt(p_pin, gen_salt('bf', 8)),
          false, 'empleado', true, p_dias_vacaciones, 0)
  returning id into new_id;

  return json_build_object('ok', true, 'id', new_id);
end;
$$;

-- ============================================================
-- 6. Actualizar admin_desactivar_empleado: usar bcrypt
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

  if not found or admin_emp.pin != crypt(p_admin_pin, admin_emp.pin) then
    return json_build_object('ok', false, 'error', 'No autorizado');
  end if;

  if p_emp_id = p_admin_id then
    return json_build_object('ok', false, 'error', 'No puedes eliminarte a ti mismo');
  end if;

  update empleados set activo = false where id = p_emp_id;
  return json_build_object('ok', true);
end;
$$;

-- ============================================================
-- 7. Limpieza automática de intentos antiguos (opcional)
--    Ejecutar periódicamente o como cron en Supabase
-- ============================================================
create or replace function limpiar_intentos_login()
returns void
language sql
security definer
as $$
  delete from intentos_login where created_at < now() - interval '1 day';
$$;
