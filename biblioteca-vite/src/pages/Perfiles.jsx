import { useEffect, useState } from 'react'
import { listarPerfiles, crearPerfil, renombrarPerfil, eliminarPerfil } from '../lib/perfiles'
import { toast } from '../lib/toast'
import ModalConfirmacion from '../components/ModalConfirmacion.jsx'
import ModalInput from '../components/ModalInput.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { LoadingPagina } from '../components/Loading.jsx'

export default function Perfiles() {
  const [perfiles, setPerfiles] = useState([])
  const [nombre, setNombre] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [creando, setCreando] = useState(false)
  const [perfilARenombrar, setPerfilARenombrar] = useState(null)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [renombrando, setRenombrando] = useState(false)
  const [errorRenombrar, setErrorRenombrar] = useState(null)
  const [perfilAEliminar, setPerfilAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      setPerfiles(await listarPerfiles())
    } catch (err) {
      console.error('cargar (Perfiles):', err)
      setError('No pudimos cargar los perfiles.')
    } finally {
      setCargando(false)
    }
  }

  async function handleAgregar(e) {
    e.preventDefault()
    if (!nombre.trim() || creando) return
    setCreando(true)
    try {
      await crearPerfil(nombre)
      setNombre('')
      await cargar()
      toast.success('Perfil agregado.')
    } catch (err) {
      console.error('handleAgregar (Perfiles):', err)
      toast.error(err.code === '23505' ? 'Ya tenés un perfil con ese nombre.' : 'No pudimos agregar el perfil.')
    } finally {
      setCreando(false)
    }
  }

  function handleRenombrar(perfil) {
    setNuevoNombre(perfil.nombre)
    setErrorRenombrar(null)
    setPerfilARenombrar(perfil)
  }

  async function confirmarRenombrar() {
    if (nuevoNombre.trim() === perfilARenombrar.nombre) {
      setPerfilARenombrar(null)
      return
    }
    setRenombrando(true)
    setErrorRenombrar(null)
    try {
      await renombrarPerfil(perfilARenombrar.id, nuevoNombre)
      setPerfilARenombrar(null)
      await cargar()
      toast.success('Perfil renombrado.')
    } catch (err) {
      console.error('confirmarRenombrar:', err)
      if (err.code === '23505') {
        setErrorRenombrar('Ya tenés un perfil con ese nombre.')
      } else {
        setPerfilARenombrar(null)
        toast.error('No pudimos renombrar el perfil.')
      }
    } finally {
      setRenombrando(false)
    }
  }

  function handleEliminar(perfil) {
    setPerfilAEliminar(perfil)
  }

  async function confirmarEliminacion() {
    setEliminando(true)
    try {
      await eliminarPerfil(perfilAEliminar.id)
      setPerfilAEliminar(null)
      await cargar()
      toast.success('Perfil eliminado.')
    } catch (err) {
      console.error('confirmarEliminacion (Perfiles):', err)
      toast.error('No pudimos eliminar el perfil.')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="perfiles">
      <h2>Perfiles de lectura</h2>
      <p className="ayuda-perfiles">
        Cargá acá a las personas de tu casa (por ejemplo "Yo", "Mamá", "Papá") para poder marcar
        quién leyó cada libro. No necesitan cuenta propia ni loguearse — son solo etiquetas dentro
        de tu biblioteca.
      </p>

      <form onSubmit={handleAgregar} className="form-perfil">
        <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={creando} />
        <button type="submit" disabled={creando}>{creando ? 'Agregando...' : 'Agregar'}</button>
      </form>

      {error && !cargando && <ErrorState descripcion={error} onRetry={cargar} />}

      {cargando && <LoadingPagina texto="Cargando perfiles..." />}

      {!cargando && !error && perfiles.length === 0 && (
        <EmptyState
          icono="🧑‍🤝‍🧑"
          titulo="Todavía no agregaste a nadie"
          descripcion="Sumá el primer perfil de lectura arriba para poder marcar quién leyó cada libro."
        />
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

      <ModalInput
        abierto={!!perfilARenombrar}
        titulo="Renombrar perfil"
        label="Nombre"
        valor={nuevoNombre}
        onChange={setNuevoNombre}
        onCancelar={() => setPerfilARenombrar(null)}
        onConfirmar={confirmarRenombrar}
        textoConfirmar="Guardar"
        loading={renombrando}
        error={errorRenombrar}
      />

      <ModalConfirmacion
        abierto={!!perfilAEliminar}
        titulo="Eliminar perfil"
        descripcion={
          perfilAEliminar
            ? `¿Eliminar a "${perfilAEliminar.nombre}"? Se van a borrar también las lecturas que tenga marcadas (con su puntuación y reseña propia).`
            : ''
        }
        textoConfirmar="Eliminar"
        variante="danger"
        loading={eliminando}
        onCancelar={() => setPerfilAEliminar(null)}
        onConfirmar={confirmarEliminacion}
      />
    </div>
  )
}
