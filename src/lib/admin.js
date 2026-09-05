import { supabase } from './supabase'

export async function soyAdmin() {
  const { data, error } = await supabase.rpc('es_super_admin')
  if (error) throw error
  return !!data
}

export async function listarFamiliasAdmin() {
  const { data, error } = await supabase.rpc('admin_listar_familias')
  if (error) throw error
  return data
}

export async function activarFamilia(familiaId, activa) {
  const { error } = await supabase.rpc('admin_set_familia_activa', {
    familia_id_param: familiaId,
    nueva_activa: activa,
  })
  if (error) throw error
}
