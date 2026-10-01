import { createContext, useContext, useEffect, useState } from 'react'
import { obtenerSesion, suscribirseAAuth, cerrarSesion as cerrarSesionApi } from '../lib/auth'
import { soyAdmin } from '../lib/admin'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = todavía no se sabe, null = sin sesión
  const [esAdmin, setEsAdmin] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    obtenerSesion().then((s) => setSession(s ?? null))
    const desuscribir = suscribirseAAuth((s) => setSession(s ?? null))
    return desuscribir
  }, [])

  useEffect(() => {
    if (session === undefined) return // todavía no sabemos
    if (session === null) {
      setEsAdmin(false)
      setCargando(false)
      return
    }
    setCargando(true)
    soyAdmin()
      .then(setEsAdmin)
      .catch(() => setEsAdmin(false))
      .finally(() => setCargando(false))
  }, [session])

  async function cerrarSesion() {
    await cerrarSesionApi()
  }

  const value = {
    session,
    usuario: session?.user ?? null,
    esAdmin,
    cargando,
    cerrarSesion,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
