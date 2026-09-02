import { useEffect, useState } from 'react'
import { listarPerfiles, crearPerfil, renombrarPerfil, eliminarPerfil } from '../lib/perfiles'

export default function Perfiles() {
  const [perfiles, setPerfiles] = useState([])
  const [nombre, setNombre] = useState('')
  const [cargando, setCargando] = useState(true)

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
      <h2>Integrantes de la familia</h2>
      <p className="ayuda-perfiles">Cargá quiénes usan la biblioteca para poder marcar quién leyó cada libro.</p>

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
