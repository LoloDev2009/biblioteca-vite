# Importar datos desde tu base vieja

## Paso 1 — Correr la migración
En el SQL Editor de tu proyecto de **Supabase** (la base nueva), pegá y ejecutá
el contenido de `migration_3.sql` (está en la raíz del proyecto). Esto agrega
las columnas nuevas sin tocar nada de lo que ya tenés.

## Paso 2 — Exportar CSVs de la base vieja
Conectate a tu base vieja con psql:
```
psql "postgresql://usuario:password@host:puerto/nombre_db"
```

Y corré estos 4 comandos (van a quedar los CSV en tu carpeta actual):
```sql
\copy (select * from libros) TO 'libros.csv' WITH CSV HEADER
\copy (select * from autores) TO 'autores.csv' WITH CSV HEADER
\copy (select * from generos) TO 'generos.csv' WITH CSV HEADER
\copy (select * from prestamos) TO 'prestamos.csv' WITH CSV HEADER
```

(No hace falta exportar `detalles` ni `sidebar`.)

Movés esos 4 archivos a la carpeta `scripts/data/` de este proyecto.

## Paso 3 — Instalar dependencias
Desde la raíz del proyecto (`papaparse` y `dotenv` ya están en el `package.json`):
```
npm install
```

Asegurate de tener tu `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
ya configurado (el mismo que usa la app).

## Paso 4 — Correr la importación
```
npm run importar
```

El script:
1. Lee `libros.csv`, resuelve `autor_id` → nombre y `genero_id` → nombre usando
   `autores.csv` y `generos.csv`, e inserta cada libro en la tabla `libros` de Supabase.
2. `ubicacion` de tu base vieja se mapea al campo `estante` que ya usa la app.
3. Marca `leido = true` automáticamente si el libro tenía puntuación o reseña
   cargada (asumiendo que si lo puntuaste, ya lo leíste). Si esa suposición no
   te sirve, después lo podés corregir a mano o pedirme que ajuste el script.
4. Guarda un mapeo de "id viejo → id nuevo" en `scripts/data/mapa_libros.json`.
5. Lee `prestamos.csv`, usa ese mapeo para asociar cada préstamo al libro
   correcto ya migrado, e inserta todo en la tabla `prestamos`.

Al final imprime un resumen con cuántos libros y préstamos se importaron, y
avisa si algún préstamo no pudo asociarse a un libro (por ejemplo si ese libro
no estaba en el CSV exportado).

## Nota
Los campos nuevos (descripción, páginas, idioma, saga, reseña, puntuación, año,
ejemplares totales, notas) se importan y quedan guardados en la base, pero
todavía no se muestran en las pantallas de la app. Si querés, en un siguiente
paso los agregamos al detalle del libro y al formulario de edición.
