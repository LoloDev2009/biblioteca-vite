import { supabase } from './supabase'

export async function listarTags() {
  const { data, error } = await supabase.from('tags').select('*').order('nombre')
  if (error) throw error
  return data
}

export async function listarTagsDeLibro(libroId) {
  const { data, error } = await supabase
    .from('libro_tags')
    .select('tags(id, nombre)')
    .eq('libro_id', libroId)
  if (error) throw error
  return data.map((fila) => fila.tags).filter(Boolean)
}

// Crea la etiqueta si no existe, o devuelve la existente (por el unique en "nombre").
export async function crearTag(nombre) {
  const limpio = nombre.trim().toLowerCase()
  if (!limpio) return null

  const { data: existente } = await supabase.from('tags').select('*').eq('nombre', limpio).maybeSingle()
  if (existente) return existente

  const { data, error } = await supabase.from('tags').insert({ nombre: limpio }).select().single()
  if (error) throw error
  return data
}

export async function agregarTagALibro(libroId, tagId) {
  const { error } = await supabase.from('libro_tags').insert({ libro_id: libroId, tag_id: tagId })
  // 23505 = ya estaba asignada esa etiqueta a ese libro, no es un error real
  if (error && error.code !== '23505') throw error
}

export async function quitarTagDeLibro(libroId, tagId) {
  const { error } = await supabase.from('libro_tags').delete().eq('libro_id', libroId).eq('tag_id', tagId)
  if (error) throw error
}
