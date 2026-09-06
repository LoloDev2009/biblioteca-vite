# Mi Biblioteca

App web responsive para catalogar los libros de tu casa y llevar registro de préstamos.

## Setup

### 1. Crear el proyecto en Supabase
1. Andá a https://supabase.com y creá una cuenta / proyecto nuevo (plan free).
2. En el proyecto, andá a **SQL Editor** → **New query**, pegá el contenido de `schema.sql` y ejecutalo. Esto crea las tablas `libros`, `prestamos` y `wishlist`.
   - Si ya tenías la base creada de antes, en vez de `schema.sql` corré las migraciones en orden
     (`migration_2.sql`, `migration_3.sql`, `migration_4.sql`, `migration_5.sql`, `migration_6.sql`, `migration_7.sql`, `migration_8.sql`, `migration_9.sql`) sin borrar nada de lo que ya tenés.
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

## Multi-usuario (cada cuenta, su propia biblioteca)

Cada usuario autenticado tiene **su propia biblioteca**, completamente
aislada de las demás (libros, préstamos, wishlist, tags, perfiles, lecturas
— todo separado por usuario mediante RLS). No hay ningún concepto de
"familia" ni de compartir una biblioteca entre varias cuentas: si más de
una persona de tu casa va a usar la app, se resuelve con **perfiles de
lectura** (ver más abajo), no con logins separados.

### Pasos para activarlo

1. **Correr `migration_9.sql`** en el SQL Editor de Supabase (además de
   `migration_7.sql` y `migration_8.sql` si ya los habías corrido antes —
   `migration_9.sql` deshace el modelo de familias de esas dos y lo
   reemplaza por este). Esto agrega `user_id` a todas las tablas, reasigna
   tu biblioteca actual a tu usuario automáticamente, y elimina las tablas
   `familias`/`miembros_familia`.

2. **Activar autenticación por email en Supabase**: Dashboard → Authentication
   → Providers → activar "Email".

3. **Configurar las URLs de redirección**: Dashboard → Authentication → URL
   Configuration:
   - **Site URL**: tu dominio de Vercel (ej. `https://biblioteca-tuusuario.vercel.app`)
   - **Redirect URLs**: agregá también `http://localhost:5173` (para desarrollo local)

   Sin esto, el link mágico va a redirigir a la URL por defecto de Supabase
   y no vas a volver a tu app.

4. **Registrate en la app** con tu cuenta real (magic link o contraseña). Al
   correr `migration_9.sql`, tu biblioteca actual ya quedó reasignada a vos
   automáticamente (siempre que ya hubieras hecho el paso de "reclamar tu
   familia legado" de `migration_7.sql` en su momento — si no llegaste a
   hacerlo nunca, avisame y te doy el SQL puntual para tu caso).

### Cómo funciona
- **Login**: magic link (sin contraseña) o email + contraseña, a elección de
  cada persona, en la pantalla de inicio.
- **Cada cuenta = una biblioteca**. No hay invitaciones ni forma de compartir
  una biblioteca entre cuentas distintas. Si dos personas de tu casa quieren
  ver los mismos libros desde sus propios celulares, tienen que compartir
  las mismas credenciales de esa única cuenta.
- **Perfiles de lectura**: para marcar "¿quién lo leyó?" sin que cada
  persona necesite su propio login — cargás perfiles como "Yo", "Mamá",
  "Papá" desde la pantalla "Perfiles", y quedan disponibles para marcar
  lecturas dentro de tu biblioteca.
- **Aislamiento de datos**: las políticas de RLS en Postgres filtran todo
  automáticamente por `user_id = auth.uid()`. No hace falta que el código
  de cada pantalla agregue el filtro a mano — ni siquiera para insertar (un
  trigger completa `user_id` solo, según quién esté logueado).

## Panel de administración (para vos, el dueño de la plataforma)

Un rol de **super-admin** (vos), separado de los usuarios normales — para
si en algún momento le das acceso a la app a otra persona/familia (por
ejemplo cobrándole) y necesitás poder cortarle el acceso sin borrarle nada.

### Activarlo
1. Corré `migration_9.sql` (ya incluye esto) o `migration_8.sql` seguido de
   `migration_9.sql` si estás empezando de cero con esas dos.
2. Convertite en super-admin (una sola vez, con tu `User UID` de
   Authentication → Users):
   ```sql
   insert into super_admins (user_id) values ('TU_USER_ID');
   ```
3. Te va a aparecer un ítem **"Administración"** en el menú lateral, con una
   tabla de todos los usuarios registrados: mail, cantidad de libros, fecha
   de registro, y un botón para activar/desactivar cada uno.

### Qué hace "Desactivar"
Corta el acceso de ese usuario a su biblioteca (no puede ver ni editar nada
mientras esté desactivado), pero no borra ningún dato — si vuelve a pagar,
lo reactivás y está todo como lo dejó.

### Notas de seguridad
- La tabla `super_admins` no tiene ninguna política de RLS que permita
  leerla/escribirla desde la API — solo se toca a mano por SQL. Así nadie
  puede auto-otorgarse el rol, ni siquiera explotando un bug del frontend.
- El panel no expone el contenido de las bibliotecas (títulos de libros,
  etc.), solo métricas agregadas (cantidad de libros) y el mail de cada
  usuario — pensado para administrar cuentas, no para curiosear datos ajenos.

## Funcionalidad
- **Multi-usuario**: cada cuenta tiene su propia biblioteca, completamente aislada de las demás
  — sin ningún concepto de familia ni de compartir acceso entre cuentas. Login con magic link
  o contraseña. Ver la sección "Multi-usuario" más arriba para la puesta en marcha.
- **Administración**: como super-admin, ver todos los usuarios registrados y activar/desactivar
  el acceso de cada uno sin borrar sus datos. Ver la sección "Panel de administración" más arriba.
- **UX**: notificaciones toast en las acciones principales (agregar, editar, prestar, devolver, marcar leído, eliminar), skeleton loading mientras carga el catálogo, estados vacíos con acciones directas (agregar primer libro, limpiar búsqueda), bloqueo de eliminación si el libro está prestado, y sidebar en 3 niveles según el ancho de pantalla (completo en desktop, angosto en tablet, menú desplegable en mobile)
- **Perfiles de lectura**: cargá a las personas de tu casa (sin que necesiten cuenta propia). Cada libro se puede marcar como "leído por" cada perfil, con su propia puntuación y reseña — así tu biblioteca no depende de un único "leído: sí/no" que mezcla a todos
- **Catálogo**: búsqueda multi-campo (título, autor, ISBN, saga, género, idioma, notas), sin distinguir mayúsculas ni acentos; filtros combinables de género/autor/saga/idioma/estante/estado de lectura/estado de préstamo/favoritos/leído por integrante; chips de filtros activos con opción de sacarlos uno por uno o todos juntos; orden configurable (título, autor, año, puntuación, agregado) que se recuerda entre sesiones; vista en cuadrícula o en lista (también recordada); menú de acciones rápidas por libro (marcar leído general, prestar, editar, eliminar) sin entrar al detalle; botón flotante de agregar en mobile
- **Favoritos**: marcar/desmarcar con un clic desde la card del catálogo o desde el detalle, sin entrar a editar
- **Etiquetas**: agregar tags libres a cada libro desde su detalle (se crean al vuelo si no existen)
- **Detección de duplicados**: al agregar un libro, si ya existe uno con el mismo ISBN (en cualquier formato, 10 o 13 dígitos) o el mismo título+autor, avisa antes de guardar
- **Detalle de libro**: ver datos + sección "¿Quién lo leyó?" (marcar/desmarcar por integrante, con puntuación y reseña propia de cada uno) + sección de "más detalles" (saga, año, idioma, páginas, puntuación general, descripción, reseña general, notas), marcar favorito, prestar y registrar devolución, editar, eliminar
- **Editar / Agregar**: todos los campos, incluidos los extendidos, en una sección "Más detalles"; autocompletado por ISBN escaneando con la cámara o escribiendo el código a mano
- **Estantes**: vista de estantería con los libros como lomos de colores, agrupados por estante
- **Sagas**: libros agrupados por colección/saga, ordenados por N° de tomo (o año si no lo cargaste), con progreso de lectura
- **Estadísticas**: total de libros, % leídos, páginas leídas en total, puntuación promedio, préstamos activos, en wishlist, géneros y autores más frecuentes, y un desglose de libros/páginas leídas y puntuación promedio **por perfil de lectura**
- **Wishlist**: anotar libros que querés conseguir (con autocompletado por ISBN opcional); al conseguirlos, pasan al catálogo con un clic
- **Préstamos**: listado de préstamos activos con devolución rápida

## Estructura
```
src/
  components/
    ScannerIsbn.jsx     -> escaneo de código de barras (ISBN) con la cámara
    TagsLibro.jsx        -> gestión de etiquetas de un libro
    LecturasLibro.jsx      -> "¿quién lo leyó?" por integrante
    ToastHost.jsx           -> notificaciones toast
  context/
    AuthContext.jsx     -> sesión, esAdmin
  lib/
    supabase.js       -> cliente de Supabase
    auth.js            -> login (magic link/contraseña)
    admin.js            -> funciones del panel de super-admin
    libros.js             -> CRUD de libros + filtro leído + agrupado por estante
    prestamos.js           -> CRUD de préstamos
    wishlist.js             -> CRUD de wishlist + pasaje a catálogo
    perfiles.js              -> CRUD de perfiles de lectura
    lecturas.js               -> quién leyó cada libro + estadísticas por perfil
    tags.js                    -> CRUD de etiquetas
    isbn.js                     -> conversión ISBN-10/13 para duplicados
    toast.js                     -> sistema de notificaciones
    openLibrary.js                 -> autocompletado por ISBN vía Open Library API
  pages/
    Login.jsx           -> pantalla de inicio de sesión / registro
    Catalogo.jsx          -> lista + búsqueda + filtros + acciones rápidas
    DetalleLibro.jsx        -> ver libro, lecturas, prestar/devolver, eliminar
    EditarLibro.jsx           -> editar datos de un libro existente
    AgregarLibro.jsx            -> agregar libro (con autocompletado ISBN + duplicados)
    Estantes.jsx                  -> vista de estantería (lomos de libros)
    Sagas.jsx                      -> libros agrupados por saga/colección
    Wishlist.jsx                    -> libros deseados, con paso a catálogo
    Estadisticas.jsx                  -> dashboard de métricas de la colección
    Prestamos.jsx                       -> lista de préstamos activos
    Perfiles.jsx                          -> CRUD de perfiles de lectura
    Admin.jsx                               -> panel de super-admin (todos los usuarios)
```

## Importar datos de otra base
Si ya tenés libros cargados en otra base PostgreSQL, ver `scripts/README.md`
para el paso a paso (migración de esquema + export CSV + script de importación).

## Notas
- La columna `libros.leido` sigue existiendo, pero ahora se actualiza sola: pasa a `true` en
  cuanto alguien queda marcado como lector en "¿Quién lo leyó?", y vuelve a `false` si se
  sacan todas las lecturas. Sirve como cache rápido para el filtro "Sin leer" del catálogo.
  Los campos `libros.puntuacion`/`libros.resena` quedan como el histórico general (por ejemplo,
  lo que trajiste de la importación vieja) y no se tocan automáticamente; la puntuación y
  reseña de cada perfil vive en la tabla `lecturas`.
- Las políticas de RLS en `schema.sql` ya vienen listas para multi-usuario desde el principio
  (`user_id = auth.uid()`), no hace falta ninguna migración extra para instalaciones nuevas.
- El campo `estante` no lo completa Open Library — siempre se ingresa a mano.
- Se usa Open Library en vez de Google Books porque esta última, sin API key, comparte
  una cuota global entre todos los usuarios de internet que se agota fácilmente.
- El diseño usa un tema claro cálido (blanco roto, tonos madera, acento petróleo/oliva),
  con navegación lateral fija en desktop/tablet y menú desplegable en mobile.
  Tipografía: Fraunces (títulos) e Inter (interfaz), cargadas desde Google Fonts
  — necesita conexión a internet para verse como corresponde.
- El escaneo de ISBN con cámara necesita **HTTPS** (los navegadores bloquean el acceso a la
  cámara en sitios sin HTTPS). En Vercel esto ya viene solo. En desarrollo local (`npm run dev`)
  también funciona porque `localhost` cuenta como excepción — pero si probás la app desde el
  celu apuntando a la IP de tu compu en la red local (no `localhost`), la cámara no va a andar
  salvo que ese túnel también tenga HTTPS.
- La búsqueda multi-campo usa la extensión `unaccent` de Postgres (la activa `migration_5.sql`
  automáticamente). Si el `create extension` da error de permisos, activala a mano desde
  **Database → Extensions** en el panel de Supabase, buscando "unaccent", y volvé a correr
  el resto de la migración.
