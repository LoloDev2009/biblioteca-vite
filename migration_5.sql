-- Ejecutar en el SQL Editor de Supabase.

-- 1. Favoritos
alter table libros add column if not exists favorito boolean not null default false;

-- 2. Sistema de tags (etiquetas)
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique
);

create table if not exists libro_tags (
  libro_id uuid references libros(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (libro_id, tag_id)
);

alter table tags enable row level security;
alter table libro_tags enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'tags' and policyname = 'acceso total tags') then
    create policy "acceso total tags" on tags for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'libro_tags' and policyname = 'acceso total libro_tags') then
    create policy "acceso total libro_tags" on libro_tags for all using (true) with check (true);
  end if;
end $$;

-- 3. Búsqueda multi-campo, sin distinguir mayúsculas ni acentos.
-- Si esta línea da error de permisos, activá la extensión "unaccent" a mano
-- desde Database → Extensions en el panel de Supabase, y volvé a correr el resto.
create extension if not exists unaccent;

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
