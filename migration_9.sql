-- Ejecutar en el SQL Editor de Supabase.
-- Deshace el modelo de "familias" (migration_7/8) y lo reemplaza por uno
-- más simple y correcto: cada usuario autenticado tiene SU PROPIA
-- biblioteca. Los perfiles de lectura ("Yo", "Mamá", etc.) se mantienen,
-- pero ahora cuelgan directo del usuario, no de una familia compartida.
--
-- No se borra ningún libro, préstamo, wishlist, tag, perfil ni lectura:
-- todo se reasigna automáticamente a tu usuario.

-- ============================================================
-- 1. Agregar user_id (nullable por ahora) a las 7 tablas de datos
-- ============================================================
alter table libros add column if not exists user_id uuid references auth.users(id);
alter table prestamos add column if not exists user_id uuid references auth.users(id);
alter table wishlist add column if not exists user_id uuid references auth.users(id);
alter table tags add column if not exists user_id uuid references auth.users(id);
alter table libro_tags add column if not exists user_id uuid references auth.users(id);
alter table perfiles add column if not exists user_id uuid references auth.users(id);
alter table lecturas add column if not exists user_id uuid references auth.users(id);

-- ============================================================
-- 2. Backfill: cada fila pasa al dueño real de la familia a la que
--    pertenecía (el miembro con rol 'dueño'; si por algún motivo no había
--    ninguno marcado así, toma cualquier miembro de esa familia).
-- ============================================================
update libros l set user_id = (
  select m.user_id from miembros_familia m
  where m.familia_id = l.familia_id
  order by (m.rol = 'dueño') desc, m.creado_en asc
  limit 1
) where user_id is null;

update prestamos t set user_id = (
  select m.user_id from miembros_familia m
  where m.familia_id = t.familia_id
  order by (m.rol = 'dueño') desc, m.creado_en asc
  limit 1
) where user_id is null;

update wishlist t set user_id = (
  select m.user_id from miembros_familia m
  where m.familia_id = t.familia_id
  order by (m.rol = 'dueño') desc, m.creado_en asc
  limit 1
) where user_id is null;

update tags t set user_id = (
  select m.user_id from miembros_familia m
  where m.familia_id = t.familia_id
  order by (m.rol = 'dueño') desc, m.creado_en asc
  limit 1
) where user_id is null;

update libro_tags t set user_id = (
  select m.user_id from miembros_familia m
  where m.familia_id = t.familia_id
  order by (m.rol = 'dueño') desc, m.creado_en asc
  limit 1
) where user_id is null;

update perfiles t set user_id = (
  select m.user_id from miembros_familia m
  where m.familia_id = t.familia_id
  order by (m.rol = 'dueño') desc, m.creado_en asc
  limit 1
) where user_id is null;

update lecturas t set user_id = (
  select m.user_id from miembros_familia m
  where m.familia_id = t.familia_id
  order by (m.rol = 'dueño') desc, m.creado_en asc
  limit 1
) where user_id is null;

-- Si alguna fila quedó sin user_id (por ejemplo una familia sin ningún
-- miembro todavía, caso raro), este aviso te lo señala para revisar a mano
-- en vez de fallar en silencio.
do $$
declare
  huerfanos int;
begin
  select count(*) into huerfanos from libros where user_id is null;
  if huerfanos > 0 then
    raise notice 'Hay % libros sin user_id asignado. Revisalos a mano antes de continuar.', huerfanos;
  end if;
end $$;

-- ============================================================
-- 3. Nuevos constraints únicos por usuario (reemplazan a los de familia)
-- ============================================================
drop index if exists tags_nombre_familia_unico;
create unique index if not exists tags_nombre_usuario_unico on tags (user_id, nombre);

drop index if exists perfiles_nombre_familia_unico;
create unique index if not exists perfiles_nombre_usuario_unico on perfiles (user_id, nombre);

-- ============================================================
-- 4. Trigger: si el cliente no manda user_id, se completa solo con
--    el usuario logueado (reemplaza a set_familia_id).
-- ============================================================
create or replace function set_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_familia_libros on libros;
drop trigger if exists trg_user_libros on libros;
create trigger trg_user_libros before insert on libros
  for each row execute function set_user_id();

drop trigger if exists trg_familia_prestamos on prestamos;
drop trigger if exists trg_user_prestamos on prestamos;
create trigger trg_user_prestamos before insert on prestamos
  for each row execute function set_user_id();

drop trigger if exists trg_familia_wishlist on wishlist;
drop trigger if exists trg_user_wishlist on wishlist;
create trigger trg_user_wishlist before insert on wishlist
  for each row execute function set_user_id();

drop trigger if exists trg_familia_tags on tags;
drop trigger if exists trg_user_tags on tags;
create trigger trg_user_tags before insert on tags
  for each row execute function set_user_id();

drop trigger if exists trg_familia_libro_tags on libro_tags;
drop trigger if exists trg_user_libro_tags on libro_tags;
create trigger trg_user_libro_tags before insert on libro_tags
  for each row execute function set_user_id();

drop trigger if exists trg_familia_perfiles on perfiles;
drop trigger if exists trg_user_perfiles on perfiles;
create trigger trg_user_perfiles before insert on perfiles
  for each row execute function set_user_id();

drop trigger if exists trg_familia_lecturas on lecturas;
drop trigger if exists trg_user_lecturas on lecturas;
create trigger trg_user_lecturas before insert on lecturas
  for each row execute function set_user_id();

-- ============================================================
-- 5. Cuentas: reemplaza el "activa" de familias, ahora por usuario.
--    Se crea sola para cada usuario nuevo que se registre.
-- ============================================================
create table if not exists cuentas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  activa boolean not null default true,
  creado_en timestamptz default now()
);

alter table cuentas enable row level security;
create policy "ver mi propia cuenta" on cuentas for select using (user_id = auth.uid());

insert into cuentas (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create or replace function crear_cuenta_para_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into cuentas (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_crear_cuenta on auth.users;
create trigger trg_crear_cuenta after insert on auth.users
  for each row execute function crear_cuenta_para_nuevo_usuario();

create or replace function cuenta_esta_activa(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select activa from cuentas where user_id = uid), true)
$$;

-- ============================================================
-- 6. RLS nuevas: cada usuario ve solo lo suyo, y solo si su cuenta
--    está activa. Reemplazan a las de familia (migration_7/8).
-- ============================================================
drop policy if exists "acceso por familia activa" on libros;
drop policy if exists "acceso por familia activa" on prestamos;
drop policy if exists "acceso por familia activa" on wishlist;
drop policy if exists "acceso por familia activa" on tags;
drop policy if exists "acceso por familia activa" on libro_tags;
drop policy if exists "acceso por familia activa" on perfiles;
drop policy if exists "acceso por familia activa" on lecturas;
-- por si quedó alguna del nombre viejo de migration_7 sin pasar por migration_8:
drop policy if exists "acceso por familia" on libros;
drop policy if exists "acceso por familia" on prestamos;
drop policy if exists "acceso por familia" on wishlist;
drop policy if exists "acceso por familia" on tags;
drop policy if exists "acceso por familia" on libro_tags;
drop policy if exists "acceso por familia" on perfiles;
drop policy if exists "acceso por familia" on lecturas;

create policy "acceso por usuario" on libros for all
  using (user_id = auth.uid() and cuenta_esta_activa(user_id))
  with check (user_id = auth.uid() and cuenta_esta_activa(user_id));
create policy "acceso por usuario" on prestamos for all
  using (user_id = auth.uid() and cuenta_esta_activa(user_id))
  with check (user_id = auth.uid() and cuenta_esta_activa(user_id));
create policy "acceso por usuario" on wishlist for all
  using (user_id = auth.uid() and cuenta_esta_activa(user_id))
  with check (user_id = auth.uid() and cuenta_esta_activa(user_id));
create policy "acceso por usuario" on tags for all
  using (user_id = auth.uid() and cuenta_esta_activa(user_id))
  with check (user_id = auth.uid() and cuenta_esta_activa(user_id));
create policy "acceso por usuario" on libro_tags for all
  using (user_id = auth.uid() and cuenta_esta_activa(user_id))
  with check (user_id = auth.uid() and cuenta_esta_activa(user_id));
create policy "acceso por usuario" on perfiles for all
  using (user_id = auth.uid() and cuenta_esta_activa(user_id))
  with check (user_id = auth.uid() and cuenta_esta_activa(user_id));
create policy "acceso por usuario" on lecturas for all
  using (user_id = auth.uid() and cuenta_esta_activa(user_id))
  with check (user_id = auth.uid() and cuenta_esta_activa(user_id));

-- ============================================================
-- 7. Una vez migrado todo, user_id pasa a ser obligatorio
--    (si el aviso del paso 2 marcó huérfanos, esto va a fallar a
--    propósito hasta que los resuelvas a mano).
-- ============================================================
alter table libros alter column user_id set not null;
alter table prestamos alter column user_id set not null;
alter table wishlist alter column user_id set not null;
alter table tags alter column user_id set not null;
alter table libro_tags alter column user_id set not null;
alter table perfiles alter column user_id set not null;
alter table lecturas alter column user_id set not null;

-- ============================================================
-- 8. Ya no hace falta familia_id en ninguna tabla de datos
-- ============================================================
alter table libros drop column if exists familia_id;
alter table prestamos drop column if exists familia_id;
alter table wishlist drop column if exists familia_id;
alter table tags drop column if exists familia_id;
alter table libro_tags drop column if exists familia_id;
alter table perfiles drop column if exists familia_id;
alter table lecturas drop column if exists familia_id;

-- ============================================================
-- 9. Panel de administración: pasa de listar familias a listar usuarios
-- ============================================================
drop function if exists admin_listar_familias();
drop function if exists admin_set_familia_activa(uuid, boolean);

create or replace function admin_listar_usuarios()
returns table (
  user_id uuid,
  email text,
  activa boolean,
  creado_en timestamptz,
  cantidad_libros bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id as user_id,
    u.email,
    c.activa,
    u.created_at as creado_en,
    (select count(*) from libros l where l.user_id = u.id) as cantidad_libros
  from auth.users u
  join cuentas c on c.user_id = u.id
  where es_super_admin()
  order by u.created_at desc
$$;

create or replace function admin_set_usuario_activo(user_id_param uuid, nueva_activa boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not es_super_admin() then
    raise exception 'No autorizado';
  end if;
  update cuentas set activa = nueva_activa where user_id = user_id_param;
end;
$$;

-- ============================================================
-- 10. Ya no queda nada apoyado en familias: se pueden borrar del todo
-- ============================================================
drop function if exists obtener_familia_actual();
drop function if exists set_familia_id();
drop function if exists familia_esta_activa(uuid);
drop table if exists miembros_familia;
drop table if exists familias;

-- ============================================================
-- Nada más que hacer a mano: tu biblioteca ya quedó reasignada a tu
-- usuario en el paso 2. Si el aviso del paso 2 mencionó libros huérfanos,
-- revisalos manualmente (poco probable, solo pasaría si tenías una familia
-- sin ningún miembro vinculado).
-- ============================================================
