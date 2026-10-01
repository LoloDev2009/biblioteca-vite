-- Ejecutar en el SQL Editor de Supabase.
--
-- Elimina el concepto de "lectura global" del libro. A partir de ahora la
-- única fuente de verdad sobre si un libro fue leído (y su puntuación y
-- reseña) es la tabla `lecturas`, siempre asociada a un perfil de lectura
-- puntual, nunca al libro en sí.
--
-- Este script NO borra libros.leido / libros.puntuacion / libros.resena.
-- Solo migra los datos existentes de forma segura y termina con un informe
-- de los casos que no se pudieron migrar solos por ser ambiguos. Las
-- columnas se eliminan recién en migration_11.sql, después de revisar
-- ese informe.

-- ============================================================
-- 1. Migración segura de leido/puntuacion/resena -> lecturas.
--
--    Solo se migra automáticamente cuando el dueño del libro tiene
--    EXACTAMENTE un perfil de lectura creado: ahí no hay ninguna duda
--    de a quién correspondía el dato global. Con 0 perfiles (no hay
--    dónde migrarlo) o 2+ perfiles (no sabemos cuál de todos era) no
--    se toca nada, para no inventar a quién pertenecía la lectura.
--
--    Tampoco se pisa ninguna lectura que ya exista para esa combinación
--    libro+perfil (por ejemplo si ya la habías cargado a mano con el
--    sistema nuevo): se preserva la que ya está.
--
--    No se crean lecturas para libros que nunca estuvieron marcados
--    como leídos ni tenían puntuación/reseña cargada.
--
--    fecha_lectura queda en su default (hoy), porque libros nunca tuvo
--    una fecha de cuándo se marcó como leído para preservar.
-- ============================================================
with migradas as (
  insert into lecturas (libro_id, perfil_id, user_id, puntuacion, resena)
  select l.id, p.id, l.user_id, l.puntuacion, l.resena
  from libros l
  join perfiles p on p.user_id = l.user_id
  where (l.leido = true or l.puntuacion is not null or l.resena is not null)
    and (select count(*) from perfiles p2 where p2.user_id = l.user_id) = 1
    and not exists (
      select 1 from lecturas lec where lec.libro_id = l.id and lec.perfil_id = p.id
    )
  returning 1
)
select count(*) as lecturas_migradas from migradas;

-- ============================================================
-- 2. Informe de casos ambiguos: libros con leido=true y/o
--    puntuación/reseña cargada, que TODAVÍA no tienen ninguna lectura
--    registrada (ni la de arriba ni una manual previa). Son los que el
--    paso 1 no pudo resolver solo, porque el dueño tiene 0 o 2+
--    perfiles. Revisalos a mano (crear el perfil que falte y/o marcar
--    la lectura correcta desde la ficha del libro) antes de correr
--    migration_11.sql.
-- ============================================================
select
  l.user_id,
  (select count(*) from perfiles p2 where p2.user_id = l.user_id) as cantidad_perfiles,
  l.id as libro_id,
  l.titulo,
  l.leido,
  l.puntuacion,
  l.resena
from libros l
where (l.leido = true or l.puntuacion is not null or l.resena is not null)
  and not exists (select 1 from lecturas lec where lec.libro_id = l.id)
order by l.user_id, l.titulo;
