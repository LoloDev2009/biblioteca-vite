-- Ejecutar esto en el SQL Editor de Supabase (Project > SQL Editor > New query)
-- Esquema completo y al día. Si ya tenías una base creada de antes, NO corras
-- esto: usá las migraciones (migration_2.sql en adelante) en orden.

create extension if not exists unaccent;

create table libros (
  id uuid primary key default gen_random_uuid(),
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
  nombre text not null unique
);

create table libro_tags (
  libro_id uuid references libros(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (libro_id, tag_id)
);

-- Integrantes de la familia y quién leyó cada libro (con su propia
-- puntuación/reseña). libros.puntuacion/resena quedan aparte, como el
-- histórico "general" del libro.
create table perfiles (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  creado_en timestamptz default now()
);

create table lecturas (
  id uuid primary key default gen_random_uuid(),
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

-- RLS: por ahora abierto (proyecto personal). Si en algún momento lo exponés
-- públicamente, conviene restringir esto con políticas más finas.
alter table libros enable row level security;
alter table prestamos enable row level security;
alter table wishlist enable row level security;
alter table tags enable row level security;
alter table libro_tags enable row level security;
alter table perfiles enable row level security;
alter table lecturas enable row level security;

create policy "acceso total libros" on libros for all using (true) with check (true);
create policy "acceso total prestamos" on prestamos for all using (true) with check (true);
create policy "acceso total wishlist" on wishlist for all using (true) with check (true);
create policy "acceso total tags" on tags for all using (true) with check (true);
create policy "acceso total libro_tags" on libro_tags for all using (true) with check (true);
create policy "acceso total perfiles" on perfiles for all using (true) with check (true);
create policy "acceso total lecturas" on lecturas for all using (true) with check (true);
