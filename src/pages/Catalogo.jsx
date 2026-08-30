import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarLibros } from '../lib/libros'

export default function Catalogo() {
  const [libros, setLibros] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [genero, setGenero] = useState('')
  const [soloSinLeer, setSoloSinLeer] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      cargar()
    }, 300) // debounce simple para no consultar en cada tecla
    return () => clearTimeout(timeout)
  }, [busqueda, genero, soloSinLeer])

  async function cargar() {
    setCargando(true)
    try {
      const data = await listarLibros({
        busqueda,
        genero,
        leido: soloSinLeer ? false : undefined,
      })
      setLibros(data)
      setError(null)
    } catch (e) {
      setError('No se pudo cargar el catálogo. Revisá la conexión con Supabase.')
    } finally {
      setCargando(false)
    }
  }

  const generos = [...new Set(libros.map((l) => l.genero).filter(Boolean))]

  return (
    <div className="catalogo">
      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar por título..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select value={genero} onChange={(e) => setGenero(e.target.value)}>
          <option value="">Todos los géneros</option>
          {generos.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <button
          className={`chip-filtro ${soloSinLeer ? 'activo' : ''}`}
          onClick={() => setSoloSinLeer((v) => !v)}
          type="button"
        >
          Sin leer
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {cargando && <p>Cargando...</p>}

      {!cargando && libros.length === 0 && (
        <p className="vacio">No hay libros que coincidan. ¿Agregaste alguno todavía?</p>
      )}

      <div className="grid-libros">
        {libros.map((libro) => (
          <Link to={`/libro/${libro.id}`} key={libro.id} className="card-libro">
            {libro.portada_url ? (
              <img src={libro.portada_url} alt={libro.titulo} />
            ) : (
              <div className="sin-portada">Sin portada</div>
            )}
            {!libro.leido && <span className="badge-sin-leer">Sin leer</span>}
            <div className="info">
              <strong>{libro.titulo}</strong>
              <span>{libro.autor}</span>
              {libro.estante && <span className="estante">📍 {libro.estante}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
