import { supabase } from './supabase'

export async function obtenerSesion() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export function suscribirseAAuth(callback) {
  const { data } = supabase.auth.onAuthStateChange((_evento, session) => callback(session))
  return () => data.subscription.unsubscribe()
}

export async function enviarMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function registrarseConPassword(email, password) {
  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function iniciarSesionConPassword(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// --- Familia / membresía ---

export async function obtenerMiMembresia() {
  const { data, error } = await supabase.from('miembros_familia').select('*, familias(*)').maybeSingle()
  if (error) throw error
  return data
}

export async function buscarFamiliaPorCodigo(codigo) {
  const { data, error } = await supabase
    .from('familias')
    .select('id, nombre, codigo_invitacion')
    .eq('codigo_invitacion', codigo.trim())
    .maybeSingle()
  if (error) throw error
  return data
}

// Se llama una sola vez, apenas hay sesión y todavía no hay membresía:
// si vino con un código de invitación válido, se une a esa familia; si no,
// crea una familia nueva y queda como dueño.
export async function unirseOCrearFamilia(codigoInvitacion) {
  if (codigoInvitacion) {
    const familia = await buscarFamiliaPorCodigo(codigoInvitacion)
    if (familia) {
      const { error } = await supabase
        .from('miembros_familia')
        .insert({ familia_id: familia.id, rol: 'miembro' })
      if (error) throw error
      return familia
    }
  }

  const nuevoCodigo = Math.random().toString(36).slice(2, 10)
  const { data: nuevaFamilia, error: errorFamilia } = await supabase
    .from('familias')
    .insert({ nombre: 'Mi biblioteca', codigo_invitacion: nuevoCodigo })
    .select()
    .single()
  if (errorFamilia) throw errorFamilia

  const { error: errorMiembro } = await supabase
    .from('miembros_familia')
    .insert({ familia_id: nuevaFamilia.id, rol: 'dueño' })
  if (errorMiembro) throw errorMiembro

  return nuevaFamilia
}

export async function regenerarCodigoInvitacion(familiaId) {
  const nuevoCodigo = Math.random().toString(36).slice(2, 10)
  const { data, error } = await supabase
    .from('familias')
    .update({ codigo_invitacion: nuevoCodigo })
    .eq('id', familiaId)
    .select()
    .single()
  if (error) throw error
  return data
}
