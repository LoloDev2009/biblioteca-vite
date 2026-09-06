-- Ejecutar esto en el SQL Editor de Supabase (Project > SQL Editor > New query)
-- Esquema completo y al día, con autenticación desde el principio: cada
-- usuario autenticado tiene su propia biblioteca, completamente aislada de
-- las demás. Si ya tenías una base creada de antes, NO corras esto: usá las
-- migraciones (migration_2.sql en adelante, en orden) sobre tu base real.

create extension if not exists unaccent;

create table libros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  titulo text not null,
  autor text,
  portada_url text,
  genero text,
  isbn text,
  estante text,
  editorial text,
  leido boolean not null default false,
  favorito boolean not null default false,
  anio_publicacion integer,
  ejemplares_totales integer,
  notas text,
  descripcion text,
  paginas integer,
  idioma text,
  saga text,
  numero_saga numeric,
  resena text,
  puntuacion numeric,
  creado_en timestamptz default now()
);

create table prestamos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  libro_id uuid references libros(id) on delete cascade,
  nombre_persona text not null,
  contacto text,
  fecha_prestamo date not null default current_date,
  fecha_limite date,
  fecha_devolucion date,
  notas text,
  creado_en timestamptz default now()
);

create table wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  titulo text not null,
  autor text,
  portada_url text,
  genero text,
  isbn text,
  editorial text,
  notas text,
  creado_en timestamptz default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  nombre text not null
);
create unique index tags_nombre_usuario_unico on tags (user_id, nombre);

create table libro_tags (
  user_id uuid not null references auth.users(id),
  libro_id uuid references libros(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (libro_id, tag_id)
);

-- Perfiles de lectura: personas de tu casa (ej. "Yo", "Mamá", "Papá") que
-- no necesitan cuenta propia, solo sirven para marcar quién leyó cada libro.
-- libros.puntuacion/resena quedan aparte, como el histórico "general" del
-- libro; la puntuación/reseña de cada perfil vive en "lecturas".
create table perfiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  nombre text not null,
  creado_en timestamptz default now()
);
create unique index perfiles_nombre_usuario_unico on perfiles (user_id, nombre);

create table lecturas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  libro_id uuid references libros(id) on delete cascade,
  perfil_id uuid references perfiles(id) on delete cascade,
  fecha_lectura date default current_date,
  puntuacion numeric,
  resena text,
  unique (libro_id, perfil_id)
);

-- Índices útiles para búsqueda/filtro
create index idx_libros_titulo on libros using gin (to_tsvector('spanish', titulo));
create index idx_libros_autor on libros (autor);
create index idx_libros_genero on libros (genero);
create index idx_libros_user_id on libros (user_id);
create index idx_prestamos_libro_id on prestamos (libro_id);

-- Búsqueda multi-campo, sin distinguir mayúsculas ni acentos.
create or replace function buscar_libros(termino text)
returns setof libros
language sql
stable
as $$
  select *
  from libros
  where
    unaccent(lower(titulo)) like '%' || unaccent(lower(termino)) || '%'
    or unaccent(lower(coalesce(autor, ''))) like '%' || unaccent(lower(termino)) || '%'
    or unaccent(lower(coalesce(isbn, ''))) like '%' || unaccent(lower(termino)) || '%'
    or unaccent(lower(coalesce(saga, ''))) like '%' || unaccent(lower(termino)) || '%'
    or unaccent(lower(coalesce(genero, ''))) like '%' || unaccent(lower(termino)) || '%'
    or unaccent(lower(coalesce(idioma, ''))) like '%' || unaccent(lower(termino)) || '%'
    or unaccent(lower(coalesce(notas, ''))) like '%' || unaccent(lower(termino)) || '%'
$$;

-- ============================================================
-- Cuentas: permite desactivar el acceso de un usuario puntual sin
-- borrarle nada (lo usa el panel de super-admin). Se crea sola para
-- cada usuario nuevo que se registre.
-- ============================================================
create table cuentas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  activa boolean not null default true,
  creado_en timestamptz default now()
);

alter table cuentas enable row level security;
create policy "ver mi propia cuenta" on cuentas for select using (user_id = auth.uid());

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
-- Trigger: si el cliente no manda user_id al insertar, se completa
-- solo con el usuario logueado.
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

create trigger trg_user_libros before insert on libros for each row execute function set_user_id();
create trigger trg_user_prestamos before insert on prestamos for each row execute function set_user_id();
create trigger trg_user_wishlist before insert on wishlist for each row execute function set_user_id();
create trigger trg_user_tags before insert on tags for each row execute function set_user_id();
create trigger trg_user_libro_tags before insert on libro_tags for each row execute function set_user_id();
create trigger trg_user_perfiles before insert on perfiles for each row execute function set_user_id();
create trigger trg_user_lecturas before insert on lecturas for each row execute function set_user_id();

-- ============================================================
-- RLS: cada usuario ve y edita solo lo suyo, y solo si su cuenta
-- está activa.
-- ============================================================
alter table libros enable row level security;
alter table prestamos enable row level security;
alter table wishlist enable row level security;
alter table tags enable row level security;
alter table libro_tags enable row level security;
alter table perfiles enable row level security;
alter table lecturas enable row level security;

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
-- Super-admin (vos, el dueño de la plataforma). Sin policies: solo se
-- administra a mano por SQL, nunca desde la app.
-- ============================================================
create table super_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  creado_en timestamptz default now()
);
alter table super_admins enable row level security;

create or replace function es_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from super_admins where user_id = auth.uid())
$$;

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
-- Después de correr esto y de registrarte en la app, convertite en
-- super-admin (con tu User UID de Authentication → Users):
--
--   insert into super_admins (user_id) values ('TU_USER_ID');
-- ============================================================
