# Mi Biblioteca

App web responsive para catalogar los libros de tu casa y llevar registro de préstamos.

## Setup

### 1. Crear el proyecto en Supabase
1. Andá a https://supabase.com y creá una cuenta / proyecto nuevo (plan free).
2. En el proyecto, andá a **SQL Editor** → **New query**, pegá el contenido de `schema.sql` y ejecutalo. Esto crea las tablas `libros`, `prestamos` y `wishlist`.
   - Si ya tenías la base creada de antes, en vez de `schema.sql` corré las migraciones en orden
     (`migration_2.sql`, `migration_3.sql`, `migration_4.sql`, `migration_5.sql`, `migration_6.sql`, `migration_7.sql`, `migration_8.sql`) sin borrar nada de lo que ya tenés.
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

## Multi-usuario (cuentas y familias separadas)

A partir de `migration_7.sql`, la app pasó a ser multi-tenant: cada cuenta
pertenece a una "familia" (tenant), y cada familia tiene su propia biblioteca
completamente aislada de las demás (libros, préstamos, wishlist, tags,
perfiles, lecturas — todo separado por familia mediante RLS).

### Pasos para activarlo

1. **Correr `migration_7.sql`** en el SQL Editor de Supabase. Esto crea las
   tablas `familias`/`miembros_familia`, agrega `familia_id` a todas las
   tablas existentes, y mueve automáticamente TODA tu biblioteca actual a una
   familia "legado" nueva (no perdés nada, pero todavía no está vinculada a
   ninguna cuenta real).

2. **Activar autenticación por email en Supabase**: Dashboard → Authentication
   → Providers → activar "Email". Si vas a usar el link mágico, andá a
   Authentication → Providers → Email y dejá activado "Enable Email OTP" (o
   el nombre equivalente según la versión del dashboard).

3. **Configurar las URLs de redirección**: Dashboard → Authentication → URL
   Configuration:
   - **Site URL**: tu dominio de Vercel (ej. `https://biblioteca-tuusuario.vercel.app`)
   - **Redirect URLs**: agregá también `http://localhost:5173` (para desarrollo local)

   Sin esto, el link mágico va a redirigir a la URL por defecto de Supabase
   y no vas a volver a tu app.

4. **Registrate en la app** con tu cuenta real (con magic link o con
   contraseña, lo que prefieras). Al hacerlo, la app te crea una familia
   **nueva y vacía** — porque todavía no sabe que la biblioteca legado del
   paso 1 es tuya.

5. **Reclamá tu biblioteca legado** (un solo paso manual, una sola vez): andá
   a Supabase Dashboard → Authentication → Users, copiá tu `User UID`, y
   corré esto en el SQL Editor reemplazando `TU_USER_ID`:
   ```sql
   delete from miembros_familia where user_id = 'TU_USER_ID';
   insert into miembros_familia (user_id, familia_id, rol)
     values ('TU_USER_ID', (select id from familias order by creado_en asc limit 1), 'dueño');
   update familias set creado_por = 'TU_USER_ID'
     where id = (select id from familias order by creado_en asc limit 1);
   ```
   Después de esto podés borrar (opcional) la familia vacía que se te había
   creado en el paso 4, si le sobró algún dato.

6. **Invitar al resto de la familia**: desde la pantalla "Familia" en la app,
   copiá el link de invitación y compartíselo. Cuando entren con ese link,
   quedan vinculados a tu misma biblioteca (no crean una nueva).

### Cómo funciona
- **Login**: magic link (sin contraseña) o email + contraseña, a elección de
  cada persona, en la pantalla de inicio.
- **Familias**: cada cuenta pertenece a una sola familia. La primera persona
  que entra sin código de invitación arranca una familia nueva y vacía (por
  eso el paso 5 es necesario para vos, la primera vez).
- **Perfiles vs. cuentas**: los `perfiles` (para marcar "¿quién lo leyó?")
  siguen siendo independientes de las cuentas reales — sirven para anotar
  lecturas de gente que no tiene login propio (por ejemplo, hijos chicos).
  Las cuentas reales (con login) sirven para poder editar la biblioteca.
- **Aislamiento de datos**: las políticas de RLS en Postgres filtran todo
  automáticamente por familia. No hace falta que el código de cada pantalla
  agregue el filtro a mano — ni siquiera para insertar (un trigger completa
  `familia_id` solo, según quién esté logueado).

### Límite conocido
El "solo por invitación" es una convención de la app, no un candado
absoluto: técnicamente alguien podría entrar a la pantalla de login sin
código y crearse su propia familia nueva y vacía (aislada de la tuya, sin
poder ver ni tocar tus datos). Para una app privada de uso familiar esto no
debería ser un problema, pero si en algún momento la publicás más ampliamente
y querés bloquear el registro libre del todo, se puede desactivar el alta
"sin invitación" agregando una validación extra (lo más prolijo sería con una
Edge Function de Supabase, que no agregamos en esta vuelta para no sumar más
infraestructura de la necesaria).

## Panel de administración (para vos, el dueño de la plataforma)

`migration_8.sql` agrega un rol de **super-admin** separado del "dueño" de
cada familia — es para vos, si en algún momento le "vendés"/prestás acceso
a la app a otra familia y querés poder cortarle el acceso sin borrarle nada.

### Activarlo
1. Corré `migration_8.sql` en el SQL Editor de Supabase.
2. Convertite en super-admin (una sola vez, con tu `User UID` de
   Authentication → Users):
   ```sql
   insert into super_admins (user_id) values ('TU_USER_ID');
   ```
3. Te va a aparecer un ítem **"Administración"** en el menú lateral, con una
   tabla de todas las familias registradas: dueño, cantidad de miembros,
   cantidad de libros, fecha de creación, y un botón para activar/desactivar
   cada una.

### Qué hace "Desactivar"
Corta el acceso de esa familia a su biblioteca (nadie de esa familia puede
ver ni editar nada mientras esté desactivada), pero no borra ningún dato —
si vuelven a pagar, la reactivás y está todo como lo dejaron.

### Notas de seguridad
- La tabla `super_admins` no tiene ninguna política de RLS que permita
  leerla/escribirla desde la API — solo se toca a mano por SQL. Así nadie
  puede auto-otorgarse el rol, ni siquiera explotando un bug del frontend.
- El panel no expone el contenido de las bibliotecas (títulos de libros,
  etc.), solo métricas agregadas (cantidades) y el mail del dueño de cada
  familia — pensado para administrar cuentas, no para curiosear datos ajenos.

## Funcionalidad
- **Multi-usuario**: cada familia tiene su propia cuenta y su propia biblioteca, completamente
  aislada de las demás. Login con magic link o contraseña, e invitación por link para sumar
  gente a tu misma biblioteca. Ver la sección "Multi-usuario" más arriba para la puesta en marcha.
- **Administración**: como super-admin, ver todas las familias registradas y activar/desactivar
  el acceso de cada una sin borrar sus datos. Ver la sección "Panel de administración" más arriba.
- **UX**: notificaciones toast en las acciones principales (agregar, editar, prestar, devolver, marcar leído, eliminar), skeleton loading mientras carga el catálogo, estados vacíos con acciones directas (agregar primer libro, limpiar búsqueda), bloqueo de eliminación si el libro está prestado, y sidebar en 3 niveles según el ancho de pantalla (completo en desktop, angosto en tablet, menú desplegable en mobile)
- **Familia / Perfiles**: cargá los integrantes que usan la biblioteca. Cada libro se puede marcar como "leído por" cada uno, con su propia puntuación y reseña — así una biblioteca compartida no depende de un único "leído: sí/no" que mezcla a todos
- **Catálogo**: búsqueda multi-campo (título, autor, ISBN, saga, género, idioma, notas), sin distinguir mayúsculas ni acentos; filtros combinables de género/autor/saga/idioma/estante/estado de lectura/estado de préstamo/favoritos/leído por integrante; chips de filtros activos con opción de sacarlos uno por uno o todos juntos; orden configurable (título, autor, año, puntuación, agregado) que se recuerda entre sesiones; vista en cuadrícula o en lista (también recordada); menú de acciones rápidas por libro (marcar leído general, prestar, editar, eliminar) sin entrar al detalle; botón flotante de agregar en mobile
- **Favoritos**: marcar/desmarcar con un clic desde la card del catálogo o desde el detalle, sin entrar a editar
- **Etiquetas**: agregar tags libres a cada libro desde su detalle (se crean al vuelo si no existen)
- **Detección de duplicados**: al agregar un libro, si ya existe uno con el mismo ISBN (en cualquier formato, 10 o 13 dígitos) o el mismo título+autor, avisa antes de guardar
- **Detalle de libro**: ver datos + sección "¿Quién lo leyó?" (marcar/desmarcar por integrante, con puntuación y reseña propia de cada uno) + sección de "más detalles" (saga, año, idioma, páginas, puntuación general, descripción, reseña general, notas), marcar favorito, prestar y registrar devolución, editar, eliminar
- **Editar / Agregar**: todos los campos, incluidos los extendidos, en una sección "Más detalles"; autocompletado por ISBN escaneando con la cámara o escribiendo el código a mano
- **Estantes**: vista de estantería con los libros como lomos de colores, agrupados por estante
- **Sagas**: libros agrupados por colección/saga, ordenados por N° de tomo (o año si no lo cargaste), con progreso de lectura
- **Estadísticas**: total de libros, % leídos, páginas leídas de la familia, puntuación promedio, préstamos activos, en wishlist, géneros y autores más frecuentes, y un desglose de libros/páginas leídas y puntuación promedio **por integrante**
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
    AuthContext.jsx     -> sesión, familia actual, rol, esAdmin
  lib/
    supabase.js       -> cliente de Supabase
    auth.js            -> login (magic link/contraseña), alta/unión de familia
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
    Perfiles.jsx                          -> perfiles de lectura + invitación a la familia
    Admin.jsx                               -> panel de super-admin (todas las familias)
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
  reseña de cada integrante vive en la tabla `lecturas`.
- Las políticas de RLS en `schema.sql` quedaron pensadas para instalaciones nuevas de un solo
  usuario (abiertas con `using (true)`). Si instalás desde cero y también querés multi-usuario,
  corré igual `migration_7.sql` después de `schema.sql` para pasar al esquema con familias.
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
