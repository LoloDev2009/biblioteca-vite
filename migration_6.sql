-- Ejecutar en el SQL Editor de Supabase.

create table if not exists perfiles (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  creado_en timestamptz default now()
);

create table if not exists lecturas (
  id uuid primary key default gen_random_uuid(),
  libro_id uuid references libros(id) on delete cascade,
  perfil_id uuid references perfiles(id) on delete cascade,
  fecha_lectura date default current_date,
  puntuacion numeric,
  resena text,
  unique (libro_id, perfil_id)
);

alter table perfiles enable row level security;
alter table lecturas enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'perfiles' and policyname = 'acceso total perfiles') then
    create policy "acceso total perfiles" on perfiles for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'lecturas' and policyname = 'acceso total lecturas') then
    create policy "acceso total lecturas" on lecturas for all using (true) with check (true);
  end if;
end $$;

-- Nota: la columna "leido" de libros se mantiene, pero ahora se actualiza
-- sola: pasa a true apenas alguien tiene una lectura marcada, y vuelve a
-- false si se sacan todas. libros.puntuacion/resena quedan como están (el
-- historial general que ya tenías) y no se tocan ni se migran automáticamente;
-- la puntuación/reseña por persona vive de ahora en más en "lecturas".
