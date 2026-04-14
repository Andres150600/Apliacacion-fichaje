-- =============================================
-- WorkClock - Setup de base de datos Supabase
-- Ejecutar en Supabase > SQL Editor
-- =============================================

-- 1. Empleados
create table if not exists empleados (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  email text unique not null,
  rol text not null default 'empleado',
  departamento text,
  cargo text,
  pin text not null,
  es_admin boolean default false,
  activo boolean default true,
  created_at timestamptz default now()
);

-- 2. Fichajes
create table if not exists fichajes (
  id uuid default gen_random_uuid() primary key,
  empleado_id uuid references empleados(id) on delete cascade,
  fecha date not null default current_date,
  entrada timestamptz,
  salida timestamptz,
  created_at timestamptz default now()
);

-- 3. Ausencias
create table if not exists ausencias (
  id uuid default gen_random_uuid() primary key,
  empleado_id uuid references empleados(id) on delete cascade,
  tipo text not null,
  desde date not null,
  hasta date not null,
  motivo text,
  estado text default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  created_at timestamptz default now()
);

-- 4. Documentos
create table if not exists documentos (
  id uuid default gen_random_uuid() primary key,
  empleado_id uuid references empleados(id) on delete cascade,
  nombre text not null,
  tipo text,
  descripcion text,
  url text,
  created_at timestamptz default now()
);

-- =============================================
-- Row Level Security (RLS) - Seguridad básica
-- =============================================
alter table empleados enable row level security;
alter table fichajes enable row level security;
alter table ausencias enable row level security;
alter table documentos enable row level security;

-- Políticas: acceso total con anon key (la app gestiona la lógica de roles)
create policy "acceso_empleados" on empleados for all using (true) with check (true);
create policy "acceso_fichajes" on fichajes for all using (true) with check (true);
create policy "acceso_ausencias" on ausencias for all using (true) with check (true);
create policy "acceso_documentos" on documentos for all using (true) with check (true);

-- =============================================
-- Datos de ejemplo
-- =============================================
insert into empleados (nombre, email, rol, departamento, cargo, pin, es_admin) values
  ('Admin Sistema',   'admin@empresa.com',   'admin',    'RRHH',      'Administrador',  '0000', true),
  ('Ana García',      'ana@empresa.com',      'empleado', 'IT',        'Desarrolladora', '1234', false),
  ('Carlos Ruiz',     'carlos@empresa.com',   'empleado', 'Marketing', 'Diseñador',      '2345', false),
  ('María López',     'maria@empresa.com',    'empleado', 'Finanzas',  'Contable',       '3456', false),
  ('Pedro Martínez',  'pedro@empresa.com',    'empleado', 'Ventas',    'Comercial',      '4567', false);
