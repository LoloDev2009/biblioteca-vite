-- Ejecutar en el SQL Editor de Supabase si ya habías corrido schema.sql antes.
-- Si es una instalación nueva, no hace falta: schema.sql ya incluye todo esto.

alter table libros add column if not exists leido boolean not null default false;

create table if not exists wishlist (
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

alter table wishlist enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'wishlist' and policyname = 'acceso total wishlist'
  ) then
    create policy "acceso total wishlist" on wishlist for all using (true) with check (true);
  end if;
end $$;
