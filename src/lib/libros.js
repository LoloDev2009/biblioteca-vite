import { supabase } from './supabase'

export async function listarLibros({ busqueda, genero, autor, estante, leido } = {}) {
  let query = supabase.from('libros').select('*').order('titulo')

  if (busqueda) {
    query = query.ilike('titulo', `%${busqueda}%`)
  }
  if (genero) query = query.eq('genero', genero)
  if (autor) query = query.eq('autor', autor)
  if (estante) query = query.eq('estante', estante)
  if (typeof leido === 'boolean') query = query.eq('leido', leido)

  const { data, error } = await query
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
