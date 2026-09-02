import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarPerfiles } from '../lib/perfiles'
import { listarLecturasDeLibro, marcarLeidoPor, quitarLecturaDe, actualizarLectura } from '../lib/lecturas'
import { toast } from '../lib/toast'

export default function LecturasLibro({ libroId }) {
  const [perfiles, setPerfiles] = useState([])
  const [lecturas, setLecturas] = useState([])
  const [expandidoId, setExpandidoId] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargar()
  }, [libroId])

  async function cargar() {
    setCargando(true)
    const [p, l] = await Promise.all([listarPerfiles(), listarLecturasDeLibro(libroId)])
    setPerfiles(p)
    setLecturas(l)
    setCargando(false)
  }

  async function handleMarcar(perfilId) {
    await marcarLeidoPor(libroId, perfilId)
    cargar()
    const perfil = perfiles.find((p) => p.id === perfilId)
    toast(`Marcado como leído por ${perfil?.nombre || 'ese integrante'}.`)
  }

  async function handleQuitar(perfilId) {
    if (!window.confirm('¿Quitar esta lectura? Si tenía puntuación o reseña propia, también se borran.')) return
    setExpandidoId(null)
    await quitarLecturaDe(libroId, perfilId)
    cargar()
    toast('Lectura quitada.')
  }

  if (cargando) return null

  if (perfiles.length === 0) {
    return (
      <div className="lecturas-libro">
        <h3>¿Quién lo leyó?</h3>
        <p className="vacio">
          Todavía no cargaste a los integrantes de tu familia.{' '}
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
                <FormLectura lectura={lectura} onGuardado={cargar} onQuitar={() => handleQuitar(perfil.id)} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FormLectura({ lectura, onGuardado, onQuitar }) {
  const [puntuacion, setPuntuacion] = useState(lectura.puntuacion ?? '')
  const [resena, setResena] = useState(lectura.resena ?? '')
  const [guardando, setGuardando] = useState(false)

  async function handleGuardar() {
    setGuardando(true)
    try {
      await actualizarLectura(lectura.id, {
        puntuacion: puntuacion === '' ? null : Number(puntuacion),
        resena: resena || null,
      })
      onGuardado()
      toast('Guardado.')
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
