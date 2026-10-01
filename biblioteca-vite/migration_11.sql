-- Ejecutar en el SQL Editor de Supabase.
--
-- Paso final del cambio de modelo de datos: elimina de `libros` los tres
-- campos que ahora viven exclusivamente en `lecturas`, por perfil.
--
-- NO corras esto todavía si:
--   1. No corriste migration_10.sql primero, o
--   2. migration_10.sql te mostró casos ambiguos (paso 2 de su informe)
--      que todavía no revisaste/resolviste a mano.
--
-- Después de correr esto, ya no hay vuelta atrás: estos tres campos y
-- todo lo que tuvieran cargado desaparecen de libros para siempre (lo
-- que sí se haya migrado a `lecturas` en el paso anterior queda a salvo).

alter table libros drop column if exists leido;
alter table libros drop column if exists puntuacion;
alter table libros drop column if exists resena;
