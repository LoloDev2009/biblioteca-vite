import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarPerfiles } from '../lib/perfiles'
import { listarLecturasDeLibro, marcarLeidoPor, quitarLecturaDe, actualizarLectura } from '../lib/lecturas'
import { toast } from '../lib/toast'
import ModalConfirmacion from './ModalConfirmacion.jsx'
import ErrorState from './ErrorState.jsx'
import { LoadingSeccion } from './Loading.jsx'

export default function LecturasLibro({ libroId }) {
  const [perfiles, setPerfiles] = useState([])
  const [lecturas, setLecturas] = useState([])
  const [expandidoId, setExpandidoId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [perfilAQuitar, setPerfilAQuitar] = useState(null)
  const [quitando, setQuitando] = useState(false)

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libroId])

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const [p, l] = await Promise.all([listarPerfiles(), listarLecturasDeLibro(libroId)])
      setPerfiles(p)
      setLecturas(l)
    } catch (err) {
      console.error('cargar (LecturasLibro):', err)
      setError('No pudimos cargar quién leyó este libro.')
    } finally {
      setCargando(false)
    }
  }

  async function handleMarcar(perfilId) {
    try {
      await marcarLeidoPor(libroId, perfilId)
      await cargar()
      const perfil = perfiles.find((p) => p.id === perfilId)
      toast.success(`Marcado como leído por ${perfil?.nombre || 'ese integrante'}.`)
    } catch (err) {
      console.error('handleMarcar (LecturasLibro):', err)
      toast.error('No pudimos marcar la lectura.')
    }
  }

  function handleQuitar(perfil) {
    setExpandidoId(null)
    setPerfilAQuitar(perfil)
  }

  async function confirmarQuitar() {
    setQuitando(true)
    try {
      await quitarLecturaDe(libroId, perfilAQuitar.id)
      setPerfilAQuitar(null)
      await cargar()
      toast.success('Lectura quitada.')
    } catch (err) {
      console.error('confirmarQuitar (LecturasLibro):', err)
      toast.error('No pudimos quitar la lectura.')
    } finally {
      setQuitando(false)
    }
  }

  if (cargando) return <LoadingSeccion texto="Cargando lecturas..." />

  if (error) return <ErrorState descripcion={error} onRetry={cargar} />

  if (perfiles.length === 0) {
    return (
      <div className="lecturas-libro">
        <h3>¿Quién lo leyó?</h3>
        <p className="vacio">
          Todavía no cargaste perfiles de lectura.{' '}
          <Link to="/perfiles">Agregalos acá</Link> para poder marcar quién leyó cada libro.
        </p>
      </div>
    )
  }

  return (
    <div className="lecturas-libro">
      <h3>¿Quién lo leyó?</h3>
      <div className="chips-lecturas">
        {perfiles.map((perfil) => {
          const lectura = lecturas.find((l) => l.perfil_id === perfil.id)
          return (
            <div key={perfil.id} className="chip-lectura-wrap">
              <button
                type="button"
                className={`chip-lectura ${lectura ? 'activa' : ''}`}
                onClick={() =>
                  lectura ? setExpandidoId(expandidoId === perfil.id ? null : perfil.id) : handleMarcar(perfil.id)
                }
              >
                {lectura ? '✓ ' : '+ '}{perfil.nombre}
              </button>
              {lectura && expandidoId === perfil.id && (
                <FormLectura lectura={lectura} onGuardado={cargar} onQuitar={() => handleQuitar(perfil)} />
              )}
            </div>
          )
        })}
      </div>

      <ModalConfirmacion
        abierto={!!perfilAQuitar}
        titulo="Quitar lectura"
        descripcion="¿Quitar esta lectura? Si tenía puntuación o reseña propia, también se borran."
        textoConfirmar="Quitar"
        variante="danger"
        loading={quitando}
        onCancelar={() => setPerfilAQuitar(null)}
        onConfirmar={confirmarQuitar}
      />
    </div>
  )
}

function FormLectura({ lectura, onGuardado, onQuitar }) {
  const [puntuacion, setPuntuacion] = useState(lectura.puntuacion ?? '')
  const [resena, setResena] = useState(lectura.resena ?? '')
  const [guardando, setGuardando] = useState(false)

  async function handleGuardar() {
    if (guardando) return
    setGuardando(true)
    try {
      await actualizarLectura(lectura.id, {
        puntuacion: puntuacion === '' ? null : Number(puntuacion),
        resena: resena || null,
      })
      onGuardado()
      toast.success('Guardado.')
    } catch (err) {
      console.error('handleGuardar (FormLectura):', err)
      toast.error('No pudimos guardar los cambios.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="form-lectura">
      <label>
        Puntuación (0 a 5)
        <input
          type="number"
          min="0"
          max="5"
          step="0.5"
          value={puntuacion}
          onChange={(e) => setPuntuacion(e.target.value)}
        />
      </label>
      <label>
        Reseña
        <textarea rows={2} value={resena} onChange={(e) => setResena(e.target.value)} />
      </label>
      <div className="acciones-form">
        <button type="button" onClick={handleGuardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" className="btn-secundario" onClick={onQuitar}>
          Quitar lectura
        </button>
      </div>
    </div>
  )
}
