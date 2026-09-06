-- Ejecutar en el SQL Editor de Supabase.
-- Este es el cambio más grande hasta ahora: agrega cuentas reales (Supabase
-- Auth) y aísla los datos por familia. Leé el README antes de correrlo,
-- hay pasos manuales después (activar Auth en el dashboard, y "reclamar"
-- tu biblioteca actual con tu usuario nuevo).

-- ============================================================
-- 1. Tablas de familias (el "tenant") y membresías
-- ============================================================
create table if not exists familias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null default 'Mi biblioteca',
  codigo_invitacion text not null unique,
  creado_por uuid references auth.users(id),
  creado_en timestamptz default now()
);

create table if not exists miembros_familia (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references familias(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rol text not null default 'miembro', -- 'dueño' | 'miembro'
  creado_en timestamptz default now(),
  unique (user_id) -- cada cuenta pertenece a una sola familia
);

alter table familias enable row level security;
alter table miembros_familia enable row level security;

-- Cualquiera que esté logueado puede buscar una familia por su código de
-- invitación (para poder unirse). No expone datos de libros, solo nombre.
create policy "buscar familia por invitacion" on familias for select using (true);
create policy "el dueño actualiza su familia" on familias for update
  using (id = (select familia_id from miembros_familia where user_id = auth.uid()));

create policy "ver mi propia membresia" on miembros_familia for select
  using (user_id = auth.uid());
create policy "unirme como miembro" on miembros_familia for insert
  with check (user_id = auth.uid());

-- ============================================================
-- 2. Función que devuelve la familia del usuario logueado
-- ============================================================
create or replace function obtener_familia_actual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select familia_id from miembros_familia where user_id = auth.uid() limit 1
$$;

-- ============================================================
-- 3. Columna familia_id en todas las tablas de datos
-- ============================================================
alter table libros add column if not exists familia_id uuid references familias(id);
alter table prestamos add column if not exists familia_id uuid references familias(id);
alter table wishlist add column if not exists familia_id uuid references familias(id);
alter table tags add column if not exists familia_id uuid references familias(id);
alter table libro_tags add column if not exists familia_id uuid references familias(id);
alter table perfiles add column if not exists familia_id uuid references familias(id);
alter table lecturas add column if not exists familia_id uuid references familias(id);

-- tags tenía "nombre" único global; ahora tiene que ser único por familia
alter table tags drop constraint if exists tags_nombre_key;
create unique index if not exists tags_nombre_familia_unico on tags (familia_id, nombre);

-- perfiles tenía "nombre" único global; ahora único por familia
alter table perfiles drop constraint if exists perfiles_nombre_key;
create unique index if not exists perfiles_nombre_familia_unico on perfiles (familia_id, nombre);

-- ============================================================
-- 4. Migrar los datos existentes a una familia "legado"
-- ============================================================
do $$
declare
  familia_legado_id uuid;
begin
  if not exists (select 1 from familias) then
    insert into familias (nombre, codigo_invitacion)
    values ('Mi biblioteca', substr(md5(random()::text), 1, 8))
    returning id into familia_legado_id;

    update libros set familia_id = familia_legado_id where familia_id is null;
    update prestamos set familia_id = familia_legado_id where familia_id is null;
    update wishlist set familia_id = familia_legado_id where familia_id is null;
    update tags set familia_id = familia_legado_id where familia_id is null;
    update libro_tags set familia_id = familia_legado_id where familia_id is null;
    update perfiles set familia_id = familia_legado_id where familia_id is null;
    update lecturas set familia_id = familia_legado_id where familia_id is null;
  end if;
end $$;

-- ============================================================
-- 5. Triggers: si el cliente no manda familia_id, se completa solo
--    con la familia del usuario logueado.
-- ============================================================
create or replace function set_familia_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.familia_id is null then
    new.familia_id := obtener_familia_actual();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_familia_libros on libros;
create trigger trg_familia_libros before insert on libros
  for each row execute function set_familia_id();

drop trigger if exists trg_familia_prestamos on prestamos;
create trigger trg_familia_prestamos before insert on prestamos
  for each row execute function set_familia_id();

drop trigger if exists trg_familia_wishlist on wishlist;
create trigger trg_familia_wishlist before insert on wishlist
  for each row execute function set_familia_id();

drop trigger if exists trg_familia_tags on tags;
create trigger trg_familia_tags before insert on tags
  for each row execute function set_familia_id();

drop trigger if exists trg_familia_libro_tags on libro_tags;
create trigger trg_familia_libro_tags before insert on libro_tags
  for each row execute function set_familia_id();

drop trigger if exists trg_familia_perfiles on perfiles;
create trigger trg_familia_perfiles before insert on perfiles
  for each row execute function set_familia_id();

drop trigger if exists trg_familia_lecturas on lecturas;
create trigger trg_familia_lecturas before insert on lecturas
  for each row execute function set_familia_id();

-- ============================================================
-- 6. RLS: reemplazar "acceso total" por "acceso solo a tu familia"
-- ============================================================
drop policy if exists "acceso total libros" on libros;
drop policy if exists "acceso total prestamos" on prestamos;
drop policy if exists "acceso total wishlist" on wishlist;
drop policy if exists "acceso total tags" on tags;
drop policy if exists "acceso total libro_tags" on libro_tags;
drop policy if exists "acceso total perfiles" on perfiles;
drop policy if exists "acceso total lecturas" on lecturas;

create policy "acceso por familia" on libros for all
  using (familia_id = obtener_familia_actual()) with check (familia_id = obtener_familia_actual());
create policy "acceso por familia" on prestamos for all
  using (familia_id = obtener_familia_actual()) with check (familia_id = obtener_familia_actual());
create policy "acceso por familia" on wishlist for all
  using (familia_id = obtener_familia_actual()) with check (familia_id = obtener_familia_actual());
create policy "acceso por familia" on tags for all
  using (familia_id = obtener_familia_actual()) with check (familia_id = obtener_familia_actual());
create policy "acceso por familia" on libro_tags for all
  using (familia_id = obtener_familia_actual()) with check (familia_id = obtener_familia_actual());
create policy "acceso por familia" on perfiles for all
  using (familia_id = obtener_familia_actual()) with check (familia_id = obtener_familia_actual());
create policy "acceso por familia" on lecturas for all
  using (familia_id = obtener_familia_actual()) with check (familia_id = obtener_familia_actual());

-- ============================================================
-- 7. Una vez que TODO tiene familia_id, lo hacemos obligatorio
-- ============================================================
alter table libros alter column familia_id set not null;
alter table prestamos alter column familia_id set not null;
alter table wishlist alter column familia_id set not null;
alter table tags alter column familia_id set not null;
alter table libro_tags alter column familia_id set not null;
alter table perfiles alter column familia_id set not null;
alter table lecturas alter column familia_id set not null;

-- ============================================================
-- IMPORTANTE — pasos manuales después de correr esto:
-- 1. Activar el proveedor "Email" en Supabase (Authentication → Providers).
-- 2. Configurar Site URL y Redirect URLs (Authentication → URL Configuration)
--    con tu dominio de Vercel y http://localhost:5173 para desarrollo.
-- 3. Registrarte en la app con tu cuenta real (te va a crear una familia
--    NUEVA y vacía, porque todavía no sabe que tu biblioteca actual es tuya).
-- 4. Correr el bloque de abajo UNA VEZ, reemplazando TU_USER_ID por el que
--    ves en Authentication → Users después de registrarte, para "reclamar"
--    la familia legado con toda tu biblioteca ya cargada:
--
--    delete from miembros_familia where user_id = 'TU_USER_ID';
--    insert into miembros_familia (user_id, familia_id, rol)
--      values ('TU_USER_ID', (select id from familias order by creado_en asc limit 1), 'dueño');
--    update familias set creado_por = 'TU_USER_ID'
--      where id = (select id from familias order by creado_en asc limit 1);
--    -- Opcional: borrá la familia vacía que se creó sola al registrarte,
--    -- si el id es distinto al de la familia legado de arriba.
-- ============================================================
