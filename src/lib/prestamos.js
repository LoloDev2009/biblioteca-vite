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

// Devuelve un mapa libro_id -> préstamo activo, para saber qué libros están
// prestados ahora mismo (filtro de estado de préstamo y badges del catálogo).
export async function listarPrestamosActivosPorLibro() {
  const { data, error } = await supabase
    .from('prestamos')
    .select('id, libro_id, nombre_persona')
    .is('fecha_devolucion', null)
  if (error) throw error
  const mapa = {}
  for (const p of data) mapa[p.libro_id] = p
  return mapa
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
