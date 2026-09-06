import { supabase } from './supabase'

export async function soyAdmin() {
  const { data, error } = await supabase.rpc('es_super_admin')
  if (error) throw error
  return !!data
}

export async function listarUsuariosAdmin() {
  const { data, error } = await supabase.rpc('admin_listar_usuarios')
  if (error) throw error
  return data
}

export async function activarUsuario(userId, activa) {
  const { error } = await supabase.rpc('admin_set_usuario_activo', {
    user_id_param: userId,
    nueva_activa: activa,
  })
  if (error) throw error
}
