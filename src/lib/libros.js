import { supabase } from './supabase'

const COLUMNAS_ORDEN = ['titulo', 'autor', 'anio_publicacion', 'puntuacion', 'creado_en']

export async function listarLibros({
  busqueda,
  genero,
  autor,
  saga,
  idioma,
  estante,
  leido,
  ordenPor = 'titulo',
  ordenAsc = true,
} = {}) {
  let query = supabase.from('libros').select('*')

  if (busqueda) {
    query = query.ilike('titulo', `%${busqueda}%`)
  }
  if (genero) query = query.eq('genero', genero)
  if (autor) query = query.eq('autor', autor)
  if (saga) query = query.eq('saga', saga)
  if (idioma) query = query.eq('idioma', idioma)
  if (estante) query = query.eq('estante', estante)
  if (typeof leido === 'boolean') query = query.eq('leido', leido)

  const columna = COLUMNAS_ORDEN.includes(ordenPor) ? ordenPor : 'titulo'
  query = query.order(columna, { ascending: ordenAsc, nullsFirst: false })

  const { data, error } = await query
  if (error) throw error
  return data
}

// Trae los valores existentes de género/autor/saga/idioma para armar los
// selects de filtro, sin que se achiquen a medida que el usuario filtra.
export async function listarValoresFiltro() {
  const { data, error } = await supabase.from('libros').select('genero, autor, saga, idioma')
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
export async function obtenerEstadisticas() {
  const { data: libros, error } = await supabase.from('libros').select('*')
  if (error) throw error

  const { count: enWishlist } = await supabase
    .from('wishlist')
    .select('id', { count: 'exact', head: true })

  const { count: prestamosActivos } = await supabase
    .from('prestamos')
    .select('id', { count: 'exact', head: true })
    .is('fecha_devolucion', null)

  const total = libros.length
  const leidos = libros.filter((l) => l.leido).length

  const porGenero = {}
  const porAutor = {}
  let sumaPuntuacion = 0
  let cantidadPuntuados = 0
  let paginasLeidas = 0

  for (const l of libros) {
    if (l.genero) porGenero[l.genero] = (porGenero[l.genero] || 0) + 1
    if (l.autor) porAutor[l.autor] = (porAutor[l.autor] || 0) + 1
    if (l.puntuacion != null) {
      sumaPuntuacion += Number(l.puntuacion)
      cantidadPuntuados++
    }
    if (l.leido && l.paginas) paginasLeidas += Number(l.paginas)
  }

  const topGeneros = Object.entries(porGenero).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topAutores = Object.entries(porAutor).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return {
    total,
    leidos,
    sinLeer: total - leidos,
    promedioPuntuacion: cantidadPuntuados ? sumaPuntuacion / cantidadPuntuados : null,
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
