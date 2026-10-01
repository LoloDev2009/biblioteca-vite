import { supabase } from './supabase'

export async function listarWishlist() {
  const { data, error } = await supabase
    .from('wishlist')
    .select('*')
    .order('creado_en', { ascending: false })
  if (error) throw error
  return data
}

export async function agregarAWishlist(item) {
  const { data, error } = await supabase.from('wishlist').insert(item).select().single()
  if (error) throw error
  return data
}

export async function eliminarDeWishlist(id) {
  const { error } = await supabase.from('wishlist').delete().eq('id', id)
  if (error) throw error
}

// Pasa un item de la wishlist al catálogo real (ya lo conseguiste) y lo saca de la wishlist.
export async function moverACatalogo(item, datosExtra = {}) {
  const { data, error } = await supabase
    .from('libros')
    .insert({
      titulo: item.titulo,
      autor: item.autor,
      portada_url: item.portada_url,
      genero: item.genero,
      isbn: item.isbn,
      editorial: item.editorial,
      estante: datosExtra.estante || '',
    })
    .select()
    .single()
  if (error) throw error

  await eliminarDeWishlist(item.id)
  return data
}
