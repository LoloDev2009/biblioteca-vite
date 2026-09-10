import { supabase } from './supabase'
import { variantesIsbn } from './isbn'

const COLUMNAS_ORDEN = ['titulo', 'autor', 'anio_publicacion', 'creado_en']

function ordenarEnJs(lista, ordenPor, ordenAsc) {
  const columna = COLUMNAS_ORDEN.includes(ordenPor) ? ordenPor : 'titulo'
  return [...lista].sort((a, b) => {
    const va = a[columna]
    const vb = b[columna]
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    if (va < vb) return ordenAsc ? -1 : 1
    if (va > vb) return ordenAsc ? 1 : -1
    return 0
  })
}

export async function listarLibros({
  busqueda,
  genero,
  autor,
  saga,
  idioma,
  estante,
  favorito,
  ordenPor = 'titulo',
  ordenAsc = true,
} = {}) {
  const terminoLimpio = busqueda?.trim().replace(/\s+/g, ' ')

  // Con texto de búsqueda: usamos la función de Postgres que busca en varios
  // campos a la vez, sin distinguir mayúsculas ni acentos (ver migration_5.sql),
  // y aplicamos el resto de los filtros sobre ese resultado.
  if (terminoLimpio) {
    const { data, error } = await supabase.rpc('buscar_libros', { termino: terminoLimpio })
    if (error) throw error

    let resultado = data
    if (genero) resultado = resultado.filter((l) => l.genero === genero)
    if (autor) resultado = resultado.filter((l) => l.autor === autor)
    if (saga) resultado = resultado.filter((l) => l.saga === saga)
    if (idioma) resultado = resultado.filter((l) => l.idioma === idioma)
    if (estante) resultado = resultado.filter((l) => l.estante === estante)
    if (typeof favorito === 'boolean') resultado = resultado.filter((l) => l.favorito === favorito)

    return ordenarEnJs(resultado, ordenPor, ordenAsc)
  }

  let query = supabase.from('libros').select('*')
  if (genero) query = query.eq('genero', genero)
  if (autor) query = query.eq('autor', autor)
  if (saga) query = query.eq('saga', saga)
  if (idioma) query = query.eq('idioma', idioma)
  if (estante) query = query.eq('estante', estante)
  if (typeof favorito === 'boolean') query = query.eq('favorito', favorito)

  const columna = COLUMNAS_ORDEN.includes(ordenPor) ? ordenPor : 'titulo'
  query = query.order(columna, { ascending: ordenAsc, nullsFirst: false })

  const { data, error } = await query
  if (error) throw error
  return data
}

// Busca posibles duplicados antes de agregar un libro: primero por ISBN
// (contemplando que esté guardado en formato ISBN-10 o ISBN-13), y si no hay
// ISBN, por coincidencia exacta de título + autor.
export async function buscarPosiblesDuplicados({ isbn, titulo, autor }) {
  const variantes = variantesIsbn(isbn)
  if (variantes.length > 0) {
    const { data, error } = await supabase
      .from('libros')
      .select('id, titulo, autor, isbn')
      .in('isbn', variantes)
    if (error) throw error
    if (data.length > 0) return data
  }

  if (titulo?.trim() && autor?.trim()) {
    const { data, error } = await supabase
      .from('libros')
      .select('id, titulo, autor, isbn')
      .ilike('titulo', titulo.trim())
      .ilike('autor', autor.trim())
    if (error) throw error
    return data
  }

  return []
}

// Trae los valores existentes de género/autor/saga/idioma para armar los
// selects de filtro, sin que se achiquen a medida que el usuario filtra.
export async function listarValoresFiltro() {
  const { data, error } = await supabase.from('libros').select('genero, autor, saga, idioma, estante')
  if (error) throw error
  return data
}

// Agrupa todos los libros por estante para la vista de estantería.
// Los libros sin estante asignado quedan en el grupo "Sin estante".
export async function listarPorEstante() {
  const { data, error } = await supabase.from('libros').select('*').order('titulo')
  if (error) throw error

  const grupos = {}
  for (const libro of data) {
    const clave = libro.estante?.trim() || 'Sin estante'
    if (!grupos[clave]) grupos[clave] = []
    grupos[clave].push(libro)
  }
  return grupos
}

// Agrupa los libros que tienen saga cargada. Dentro de cada saga, ordena
// por año de publicación (los que no tienen año quedan al final, por título).
export async function listarPorSaga() {
  const { data, error } = await supabase.from('libros').select('*')
  if (error) throw error

  const grupos = {}
  for (const libro of data) {
    const clave = libro.saga?.trim()
    if (!clave) continue
    if (!grupos[clave]) grupos[clave] = []
    grupos[clave].push(libro)
  }

  for (const clave in grupos) {
    grupos[clave].sort((a, b) => {
      if (a.numero_saga != null && b.numero_saga != null) {
        return a.numero_saga - b.numero_saga
      }
      if (a.numero_saga != null) return -1
      if (b.numero_saga != null) return 1
      if (a.anio_publicacion != null && b.anio_publicacion != null) {
        return a.anio_publicacion - b.anio_publicacion
      }
      if (a.anio_publicacion != null) return -1
      if (b.anio_publicacion != null) return 1
      return a.titulo.localeCompare(b.titulo)
    })
  }
  return grupos
}

// Calcula las métricas para el dashboard de estadísticas.
// "Leídos" = libros con al menos una lectura registrada (de cualquier
// perfil). La puntuación promedio se calcula sobre todas las lecturas
// puntuadas (cada perfil cuenta su propia puntuación por separado).
export async function obtenerEstadisticas() {
  const { data: libros, error } = await supabase.from('libros').select('*')
  if (error) throw error

  const { data: lecturas, error: errorLecturas } = await supabase
    .from('lecturas')
    .select('libro_id, puntuacion')
  if (errorLecturas) throw errorLecturas

  const { count: enWishlist } = await supabase
    .from('wishlist')
    .select('id', { count: 'exact', head: true })

  const { count: prestamosActivos } = await supabase
    .from('prestamos')
    .select('id', { count: 'exact', head: true })
    .is('fecha_devolucion', null)

  const librosLeidosIds = new Set(lecturas.map((l) => l.libro_id))

  const total = libros.length
  const leidos = libros.filter((l) => librosLeidosIds.has(l.id)).length

  const porGenero = {}
  const porAutor = {}
  let paginasLeidas = 0

  for (const l of libros) {
    if (l.genero) porGenero[l.genero] = (porGenero[l.genero] || 0) + 1
    if (l.autor) porAutor[l.autor] = (porAutor[l.autor] || 0) + 1
    if (librosLeidosIds.has(l.id) && l.paginas) paginasLeidas += Number(l.paginas)
  }

  const puntuados = lecturas.filter((l) => l.puntuacion != null)
  const promedioPuntuacion = puntuados.length
    ? puntuados.reduce((acc, l) => acc + Number(l.puntuacion), 0) / puntuados.length
    : null

  const topGeneros = Object.entries(porGenero).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topAutores = Object.entries(porAutor).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return {
    total,
    leidos,
    sinLeer: total - leidos,
    cantidadLecturas: lecturas.length,
    promedioPuntuacion,
    paginasLeidas,
    topGeneros,
    topAutores,
    enWishlist: enWishlist || 0,
    prestamosActivos: prestamosActivos || 0,
  }
}

export async function obtenerLibro(id) {
  const { data, error } = await supabase
    .from('libros')
    .select('*, prestamos(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Convierte los valores "vacíos" del formulario (que en los <input> siempre
// son '') al tipo real que espera la columna en Supabase, de forma idéntica
// sin importar si el libro se está creando o editando: los campos numéricos
// pasan a null (no a '', que rompería una columna numeric), y estos 4 campos
// de texto opcionales también pasan a null en vez de quedar como ''.
export function normalizarFormLibro(form) {
  return {
    ...form,
    saga: form.saga || null,
    idioma: form.idioma || null,
    descripcion: form.descripcion || null,
    notas: form.notas || null,
    numero_saga: form.numero_saga === '' ? null : Number(form.numero_saga),
    anio_publicacion: form.anio_publicacion === '' ? null : Number(form.anio_publicacion),
    paginas: form.paginas === '' ? null : Number(form.paginas),
    ejemplares_totales: form.ejemplares_totales === '' ? null : Number(form.ejemplares_totales),
  }
}

export async function crearLibro(libro) {
  const { data, error } = await supabase.from('libros').insert(libro).select().single()
  if (error) throw error
  return data
}

export async function actualizarLibro(id, cambios) {
  const { data, error } = await supabase
    .from('libros')
    .update(cambios)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function eliminarLibro(id) {
  const { error } = await supabase.from('libros').delete().eq('id', id)
  if (error) throw error
}
