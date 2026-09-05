import { createContext, useContext, useEffect, useState } from 'react'
import {
  obtenerSesion,
  suscribirseAAuth,
  obtenerMiMembresia,
  unirseOCrearFamilia,
  cerrarSesion as cerrarSesionApi,
} from '../lib/auth'
import { soyAdmin } from '../lib/admin'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = todavía no se sabe, null = sin sesión
  const [membresia, setMembresia] = useState(null)
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
      setMembresia(null)
      setEsAdmin(false)
      setCargando(false)
      return
    }
    asegurarMembresia()
    soyAdmin().then(setEsAdmin).catch(() => setEsAdmin(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  async function asegurarMembresia() {
    setCargando(true)
    try {
      let m = await obtenerMiMembresia()
      if (!m) {
        const params = new URLSearchParams(window.location.search)
        const codigoInvitacion = params.get('invite')
        await unirseOCrearFamilia(codigoInvitacion)
        m = await obtenerMiMembresia()
      }
      setMembresia(m)
    } finally {
      setCargando(false)
    }
  }

  async function cerrarSesion() {
    await cerrarSesionApi()
    setMembresia(null)
  }

  const value = {
    session,
    usuario: session?.user ?? null,
    familia: membresia?.familias ?? null,
    rol: membresia?.rol ?? null,
    esAdmin,
    cargando,
    cerrarSesion,
    recargarMembresia: asegurarMembresia,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
