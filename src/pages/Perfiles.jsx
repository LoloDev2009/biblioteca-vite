import { useEffect, useState } from 'react'
import { listarPerfiles, crearPerfil, renombrarPerfil, eliminarPerfil } from '../lib/perfiles'
import { regenerarCodigoInvitacion } from '../lib/auth'
import { useAuth } from '../context/AuthContext.jsx'
import { toast } from '../lib/toast'

export default function Perfiles() {
  const { familia, rol, recargarMembresia } = useAuth()
  const [perfiles, setPerfiles] = useState([])
  const [nombre, setNombre] = useState('')
  const [cargando, setCargando] = useState(true)
  const [regenerando, setRegenerando] = useState(false)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setCargando(true)
    try {
      setPerfiles(await listarPerfiles())
    } finally {
      setCargando(false)
    }
  }

  const linkInvitacion = familia
    ? `${window.location.origin}/login?invite=${familia.codigo_invitacion}`
    : ''

  async function handleCopiarLink() {
    await navigator.clipboard.writeText(linkInvitacion)
    toast('Link copiado.')
  }

  async function handleRegenerar() {
    if (!window.confirm('El link de invitación anterior va a dejar de funcionar. ¿Continuar?')) return
    setRegenerando(true)
    try {
      await regenerarCodigoInvitacion(familia.id)
      await recargarMembresia()
      toast('Nuevo link generado.')
    } finally {
      setRegenerando(false)
    }
  }

  async function handleAgregar(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    await crearPerfil(nombre)
    setNombre('')
    cargar()
  }

  async function handleRenombrar(perfil) {
    const nuevo = window.prompt('Nuevo nombre', perfil.nombre)
    if (!nuevo?.trim() || nuevo.trim() === perfil.nombre) return
    await renombrarPerfil(perfil.id, nuevo)
    cargar()
  }

  async function handleEliminar(perfil) {
    if (
      !window.confirm(
        `¿Eliminar a "${perfil.nombre}"? Se van a borrar también las lecturas que tenga marcadas (con su puntuación y reseña propia).`
      )
    )
      return
    await eliminarPerfil(perfil.id)
    cargar()
  }

  return (
    <div className="perfiles">
      <h2>Familia</h2>

      <section className="seccion-invitacion">
        <h3>Invitar gente a tu cuenta</h3>
        <p className="ayuda-perfiles">
          Quien entre con este link va a acceder a la misma biblioteca que vos, con su propio login.
        </p>
        {familia && (
          <div className="caja-invitacion">
            <code>{linkInvitacion}</code>
            <div className="acciones-invitacion">
              <button type="button" onClick={handleCopiarLink}>Copiar link</button>
              {rol === 'dueño' && (
                <button type="button" className="btn-secundario" onClick={handleRegenerar} disabled={regenerando}>
                  {regenerando ? 'Generando...' : 'Generar otro código'}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <h3 className="titulo-seccion-perfiles">Perfiles de lectura</h3>
      <p className="ayuda-perfiles">
        Estos no necesitan cuenta propia — sirven para marcar quién leyó cada libro (útil para chicos u otros
        integrantes que no van a loguearse).
      </p>

      <form onSubmit={handleAgregar} className="form-perfil">
        <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <button type="submit">Agregar</button>
      </form>

      {cargando && <p>Cargando...</p>}
      {!cargando && perfiles.length === 0 && (
        <p className="vacio">Todavía no agregaste a nadie. Sumá el primer integrante arriba.</p>
      )}

      <div className="lista-perfiles">
        {perfiles.map((p) => (
          <div key={p.id} className="fila-perfil">
            <span>{p.nombre}</span>
            <div className="acciones-perfil">
              <button type="button" className="btn-secundario" onClick={() => handleRenombrar(p)}>
                Renombrar
              </button>
              <button type="button" className="btn-eliminar" onClick={() => handleEliminar(p)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
