-- Ejecutar en el SQL Editor de Supabase antes de importar los datos viejos.

alter table libros add column if not exists anio_publicacion integer;
alter table libros add column if not exists ejemplares_totales integer;
alter table libros add column if not exists notas text;
alter table libros add column if not exists descripcion text;
alter table libros add column if not exists paginas integer;
alter table libros add column if not exists idioma text;
alter table libros add column if not exists saga text;
alter table libros add column if not exists resena text;
alter table libros add column if not exists puntuacion numeric;

-- Campos extra que trae tu tabla de préstamos vieja
alter table prestamos add column if not exists contacto text;
alter table prestamos add column if not exists fecha_limite date;
alter table prestamos add column if not exists notas text;
