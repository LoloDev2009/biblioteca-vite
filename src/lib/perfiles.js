import { supabase } from './supabase'

export async function listarPerfiles() {
  const { data, error } = await supabase.from('perfiles').select('*').order('nombre')
  if (error) throw error
  return data
}

export async function crearPerfil(nombre) {
  const { data, error } = await supabase.from('perfiles').insert({ nombre: nombre.trim() }).select().single()
  if (error) throw error
  return data
}

export async function renombrarPerfil(id, nombre) {
  const { error } = await supabase.from('perfiles').update({ nombre: nombre.trim() }).eq('id', id)
  if (error) throw error
}

export async function eliminarPerfil(id) {
  const { error } = await supabase.from('perfiles').delete().eq('id', id)
  if (error) throw error
}
