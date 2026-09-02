import { supabase } from './supabase'
import { actualizarLibro } from './libros'
import { listarPerfiles } from './perfiles'

export async function listarLecturasDeLibro(libroId) {
  const { data, error } = await supabase.from('lecturas').select('*').eq('libro_id', libroId)
  if (error) throw error
  return data
}

// Mapa libro_id -> [perfil_id, ...], para el filtro "leído por" del catálogo.
export async function listarLecturasPorLibro() {
  const { data, error } = await supabase.from('lecturas').select('libro_id, perfil_id')
  if (error) throw error
  const mapa = {}
  for (const l of data) {
    if (!mapa[l.libro_id]) mapa[l.libro_id] = []
    mapa[l.libro_id].push(l.perfil_id)
  }
  return mapa
}

export async function marcarLeidoPor(libroId, perfilId) {
  const { error } = await supabase.from('lecturas').insert({ libro_id: libroId, perfil_id: perfilId })
  if (error && error.code !== '23505') throw error // 23505 = ya estaba marcado, no es un error real
  await actualizarLibro(libroId, { leido: true })
}

export async function quitarLecturaDe(libroId, perfilId) {
  const { error } = await supabase.from('lecturas').delete().eq('libro_id', libroId).eq('perfil_id', perfilId)
  if (error) throw error

  const { count } = await supabase
    .from('lecturas')
    .select('id', { count: 'exact', head: true })
    .eq('libro_id', libroId)
  if (!count) await actualizarLibro(libroId, { leido: false })
}

export async function actualizarLectura(lecturaId, cambios) {
  const { error } = await supabase.from('lecturas').update(cambios).eq('id', lecturaId)
  if (error) throw error
}

// Libros leídos, páginas leídas y puntuación promedio, por cada integrante.
export async function obtenerEstadisticasPorPerfil() {
  const perfiles = await listarPerfiles()
  const { data: lecturas, error } = await supabase.from('lecturas').select('perfil_id, puntuacion, libros(paginas)')
  if (error) throw error

  return perfiles.map((perfil) => {
    const propias = lecturas.filter((l) => l.perfil_id === perfil.id)
    const paginasLeidas = propias.reduce((acc, l) => acc + (l.libros?.paginas || 0), 0)
    const puntuados = propias.filter((l) => l.puntuacion != null)
    const promedioPuntuacion = puntuados.length
      ? puntuados.reduce((acc, l) => acc + Number(l.puntuacion), 0) / puntuados.length
      : null
    return { perfil, librosLeidos: propias.length, paginasLeidas, promedioPuntuacion }
  })
}
