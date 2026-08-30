-- Unifica variantes de un mismo género que quedaron cargadas distinto
-- (por ejemplo por tildes). Ajustá los valores según haga falta.

update libros set genero = 'Fantasia' where genero = 'Fantasía';
