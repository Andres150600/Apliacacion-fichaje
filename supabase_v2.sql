-- Nuevas tablas para WorkClock v2
-- Ejecutar en Supabase > SQL Editor

-- Turnos
create table if not exists turnos (
  id uuid default gen_random_uuid() primary key,
  empleado_id uuid references empleados(id) on delete cascade,
  nombre text not null,
  hora_entrada time not null,
  hora_salida time not null,
  dias_semana int[] default '{1,2,3,4,5}',
  activo boolean default true,
  created_at timestamptz default now()
);

-- Vacaciones (contador)
alter table empleados add column if not exists dias_vacaciones int default 22;
alter table empleados add column if not exists dias_usados int default 0;

-- Geolocalización en fichajes
alter table fichajes add column if not exists lat_entrada float;
alter table fichajes add column if not exists lng_entrada float;
alter table fichajes add column if not exists lat_salida float;
alter table fichajes add column if not exists lng_salida float;

-- Configuración empresa (para geo)
create table if not exists configuracion (
  id uuid default gen_random_uuid() primary key,
  clave text unique not null,
  valor text not null
);

insert into configuracion (clave, valor) values
  ('geo_activa', 'false'),
  ('geo_lat', '0'),
  ('geo_lng', '0'),
  ('geo_radio', '200')
on conflict (clave) do nothing;

-- Políticas
create policy if not exists "acceso_turnos" on turnos for all using (true) with check (true);
create policy if not exists "acceso_config" on configuracion for all using (true) with check (true);
alter table turnos enable row level security;
alter table configuracion enable row level security;
