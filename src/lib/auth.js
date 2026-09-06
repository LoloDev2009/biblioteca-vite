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
