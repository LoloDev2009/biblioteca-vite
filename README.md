# Mi Biblioteca

App web responsive para catalogar los libros de tu casa y llevar registro de préstamos.

## Setup

### 1. Crear el proyecto en Supabase
1. Andá a https://supabase.com y creá una cuenta / proyecto nuevo (plan free).
2. En el proyecto, andá a **SQL Editor** → **New query**, pegá el contenido de `schema.sql` y ejecutalo. Esto crea las tablas `libros`, `prestamos` y `wishlist`.
   - Si ya tenías la base creada de antes, en vez de `schema.sql` corré las migraciones en orden
     (`migration_2.sql`, `migration_3.sql`, `migration_4.sql`) sin borrar nada de lo que ya tenés.
3. Andá a **Project Settings → API** y copiá:
   - `Project URL`
   - `anon public key` (en proyectos nuevos puede figurar como "Publishable key" — es lo mismo)

### 2. Configurar variables de entorno
Copiá `.env.example` a `.env` y completá con los datos de Supabase:
```
cp .env.example .env
```

### 3. Instalar dependencias y correr
```
npm install
npm run dev
```
La app va a estar en `http://localhost:5173`.

### 4. Deploy a Vercel
1. Subí este proyecto a un repo de GitHub.
2. Andá a https://vercel.com → **New Project** → importá el repo.
3. En **Environment Variables**, agregá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (los mismos valores del `.env`).
4. Deploy. Listo — accesible desde el celu y la PC.

## Funcionalidad
- **Catálogo**: buscar por título, filtrar por género/autor/saga/idioma, ordenar (título, autor, año, puntuación, agregado recientemente), filtro "sin leer"
- **Detalle de libro**: ver datos + sección de "más detalles" (saga, año, idioma, páginas, puntuación, descripción, reseña, notas), marcar leído/no leído, prestar y registrar devolución, editar, eliminar
- **Editar / Agregar**: todos los campos, incluidos los extendidos, en una sección "Más detalles"
- **Estantes**: vista de estantería con los libros como lomos de colores, agrupados por estante
- **Sagas**: libros agrupados por colección/saga, ordenados por año de publicación, con progreso de lectura
- **Estadísticas**: total de libros, % leídos, páginas leídas, puntuación promedio, préstamos activos, en wishlist, géneros y autores más frecuentes
- **Wishlist**: anotar libros que querés conseguir (con autocompletado por ISBN opcional); al conseguirlos, pasan al catálogo con un clic
- **Préstamos**: listado de préstamos activos con devolución rápida

## Estructura
```
src/
  lib/
    supabase.js       -> cliente de Supabase
    libros.js          -> CRUD de libros + filtro leído + agrupado por estante
    prestamos.js        -> CRUD de préstamos
    wishlist.js          -> CRUD de wishlist + pasaje a catálogo
    openLibrary.js        -> autocompletado por ISBN vía Open Library API
  pages/
    Catalogo.jsx        -> lista + búsqueda + filtros + sin leer
    DetalleLibro.jsx      -> ver libro, marcar leído, prestar/devolver, eliminar
    EditarLibro.jsx         -> editar datos de un libro existente
    AgregarLibro.jsx          -> agregar libro (con autocompletado ISBN)
    Estantes.jsx                -> vista de estantería (lomos de libros)
    Sagas.jsx                    -> libros agrupados por saga/colección
    Wishlist.jsx                  -> libros deseados, con paso a catálogo
    Estadisticas.jsx                -> dashboard de métricas de la colección
    Prestamos.jsx                     -> lista de préstamos activos
```

## Importar datos de otra base
Si ya tenés libros cargados en otra base PostgreSQL, ver `scripts/README.md`
para el paso a paso (migración de esquema + export CSV + script de importación).

## Notas
- Las políticas de RLS en `schema.sql` están abiertas (`using (true)`) porque es un proyecto
  personal sin login. Si en algún momento lo publicás con usuarios, hay que ajustarlas.
- El campo `estante` no lo completa Open Library — siempre se ingresa a mano.
- Se usa Open Library en vez de Google Books porque esta última, sin API key, comparte
  una cuota global entre todos los usuarios de internet que se agota fácilmente.
- El diseño usa un tema claro cálido (blanco roto, tonos madera, acento petróleo/oliva),
  con navegación lateral fija en desktop/tablet y menú desplegable en mobile.
  Tipografía: Fraunces (títulos) e Inter (interfaz), cargadas desde Google Fonts
  — necesita conexión a internet para verse como corresponde.
