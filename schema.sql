-- Ejecutar esto en el SQL Editor de Supabase (Project > SQL Editor > New query)

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
  creado_en timestamptz default now()
);

create table prestamos (
  id uuid primary key default gen_random_uuid(),
  libro_id uuid references libros(id) on delete cascade,
  nombre_persona text not null,
  fecha_prestamo date not null default current_date,
  fecha_devolucion date,
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

-- Índices útiles para búsqueda/filtro
create index idx_libros_titulo on libros using gin (to_tsvector('spanish', titulo));
create index idx_libros_autor on libros (autor);
create index idx_libros_genero on libros (genero);
create index idx_prestamos_libro_id on prestamos (libro_id);

-- RLS: por ahora abierto (proyecto personal). Si en algún momento lo exponés
-- públicamente, conviene restringir esto con políticas más finas.
alter table libros enable row level security;
alter table prestamos enable row level security;
alter table wishlist enable row level security;

create policy "acceso total libros" on libros for all using (true) with check (true);
create policy "acceso total prestamos" on prestamos for all using (true) with check (true);
create policy "acceso total wishlist" on wishlist for all using (true) with check (true);
