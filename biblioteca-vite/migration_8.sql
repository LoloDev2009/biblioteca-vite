-- Ejecutar en el SQL Editor de Supabase.
-- Agrega un rol de "dueño de la plataforma" (vos), separado del rol
-- "dueño de familia" que ya existía. El super-admin puede ver todas las
-- familias registradas y activar/desactivar el acceso de cada una, sin
-- necesidad de ver el contenido de sus bibliotecas.

-- ============================================================
-- 1. Tabla de super-admins (solo vos, por ahora). No tiene policies de
--    insert/update/delete para nadie: solo se toca a mano desde el SQL
--    Editor, nunca desde la app.
-- ============================================================
create table if not exists super_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  creado_en timestamptz default now()
);

alter table super_admins enable row level security;
-- Sin policies = nadie puede leer ni escribir esta tabla vía la API, ni
-- siquiera el propio super-admin. Se administra únicamente por SQL directo.

create or replace function es_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from super_admins where user_id = auth.uid())
$$;

-- ============================================================
-- 2. Familias: se pueden activar/desactivar (para cortar el acceso sin
--    borrar nada, por ejemplo si alguien deja de pagar).
-- ============================================================
alter table familias add column if not exists activa boolean not null default true;

create policy "superadmin actualiza cualquier familia" on familias for update
  using (es_super_admin());

-- ============================================================
-- 3. Las políticas de las tablas de datos ahora también exigen que la
--    familia esté activa. Se reemplazan las de migration_7.
-- ============================================================
drop policy if exists "acceso por familia" on libros;
drop policy if exists "acceso por familia" on prestamos;
drop policy if exists "acceso por familia" on wishlist;
drop policy if exists "acceso por familia" on tags;
drop policy if exists "acceso por familia" on libro_tags;
drop policy if exists "acceso por familia" on perfiles;
drop policy if exists "acceso por familia" on lecturas;

create or replace function familia_esta_activa(fid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select activa from familias where id = fid), false)
$$;

create policy "acceso por familia activa" on libros for all
  using (familia_id = obtener_familia_actual() and familia_esta_activa(familia_id))
  with check (familia_id = obtener_familia_actual() and familia_esta_activa(familia_id));
create policy "acceso por familia activa" on prestamos for all
  using (familia_id = obtener_familia_actual() and familia_esta_activa(familia_id))
  with check (familia_id = obtener_familia_actual() and familia_esta_activa(familia_id));
create policy "acceso por familia activa" on wishlist for all
  using (familia_id = obtener_familia_actual() and familia_esta_activa(familia_id))
  with check (familia_id = obtener_familia_actual() and familia_esta_activa(familia_id));
create policy "acceso por familia activa" on tags for all
  using (familia_id = obtener_familia_actual() and familia_esta_activa(familia_id))
  with check (familia_id = obtener_familia_actual() and familia_esta_activa(familia_id));
create policy "acceso por familia activa" on libro_tags for all
  using (familia_id = obtener_familia_actual() and familia_esta_activa(familia_id))
  with check (familia_id = obtener_familia_actual() and familia_esta_activa(familia_id));
create policy "acceso por familia activa" on perfiles for all
  using (familia_id = obtener_familia_actual() and familia_esta_activa(familia_id))
  with check (familia_id = obtener_familia_actual() and familia_esta_activa(familia_id));
create policy "acceso por familia activa" on lecturas for all
  using (familia_id = obtener_familia_actual() and familia_esta_activa(familia_id))
  with check (familia_id = obtener_familia_actual() and familia_esta_activa(familia_id));

-- ============================================================
-- 4. Funciones para el panel de administración (solo funcionan si
--    quien las llama es super-admin; si no, no devuelven nada).
-- ============================================================
create or replace function admin_listar_familias()
returns table (
  id uuid,
  nombre text,
  codigo_invitacion text,
  activa boolean,
  creado_en timestamptz,
  email_dueño text,
  cantidad_miembros bigint,
  cantidad_libros bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    f.id,
    f.nombre,
    f.codigo_invitacion,
    f.activa,
    f.creado_en,
    (
      select u.email from miembros_familia m
      join auth.users u on u.id = m.user_id
      where m.familia_id = f.id and m.rol = 'dueño'
      limit 1
    ) as email_dueño,
    (select count(*) from miembros_familia m where m.familia_id = f.id) as cantidad_miembros,
    (select count(*) from libros l where l.familia_id = f.id) as cantidad_libros
  from familias f
  where es_super_admin()
  order by f.creado_en desc
$$;

create or replace function admin_set_familia_activa(familia_id_param uuid, nueva_activa boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not es_super_admin() then
    raise exception 'No autorizado';
  end if;
  update familias set activa = nueva_activa where id = familia_id_param;
end;
$$;

-- ============================================================
-- IMPORTANTE — paso manual después de correr esto:
-- Convertite a vos mismo en super-admin (reemplazá TU_USER_ID por el que
-- ves en Authentication → Users):
--
--    insert into super_admins (user_id) values ('TU_USER_ID');
-- ============================================================
