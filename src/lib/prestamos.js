import { supabase } from './supabase'

export async function listarPrestamosActivos() {
  const { data, error } = await supabase
    .from('prestamos')
    .select('*, libros(titulo, autor, portada_url)')
    .is('fecha_devolucion', null)
    .order('fecha_prestamo', { ascending: false })
  if (error) throw error
  return data
}

export async function prestarLibro(libroId, nombrePersona) {
  const { data, error } = await supabase
    .from('prestamos')
    .insert({ libro_id: libroId, nombre_persona: nombrePersona })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function marcarDevuelto(prestamoId) {
  const { data, error } = await supabase
    .from('prestamos')
    .update({ fecha_devolucion: new Date().toISOString().slice(0, 10) })
    .eq('id', prestamoId)
    .select()
    .single()
  if (error) throw error
  return data
}
