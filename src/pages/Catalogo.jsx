import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarLibros, listarValoresFiltro } from '../lib/libros'

const OPCIONES_ORDEN = [
  { valor: 'titulo-asc', etiqueta: 'Título (A-Z)', ordenPor: 'titulo', ordenAsc: true },
  { valor: 'titulo-desc', etiqueta: 'Título (Z-A)', ordenPor: 'titulo', ordenAsc: false },
  { valor: 'autor-asc', etiqueta: 'Autor (A-Z)', ordenPor: 'autor', ordenAsc: true },
  { valor: 'anio-desc', etiqueta: 'Año (más nuevo primero)', ordenPor: 'anio_publicacion', ordenAsc: false },
  { valor: 'anio-asc', etiqueta: 'Año (más viejo primero)', ordenPor: 'anio_publicacion', ordenAsc: true },
  { valor: 'puntuacion-desc', etiqueta: 'Puntuación (mejor primero)', ordenPor: 'puntuacion', ordenAsc: false },
  { valor: 'creado_en-desc', etiqueta: 'Agregado recientemente', ordenPor: 'creado_en', ordenAsc: false },
]

export default function Catalogo() {
  const [libros, setLibros] = useState([])
  const [opciones, setOpciones] = useState({ generos: [], autores: [], sagas: [], idiomas: [] })
  const [busqueda, setBusqueda] = useState('')
  const [genero, setGenero] = useState('')
  const [autor, setAutor] = useState('')
  const [saga, setSaga] = useState('')
  const [idioma, setIdioma] = useState('')
  const [orden, setOrden] = useState('titulo-asc')
  const [soloSinLeer, setSoloSinLeer] = useState(false)
  const [mostrarMasFiltros, setMostrarMasFiltros] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Las opciones de los selects se cargan una sola vez, sobre el catálogo
  // completo, para que no se vayan achicando a medida que el usuario filtra.
  useEffect(() => {
    listarValoresFiltro().then((data) => {
      setOpciones({
        generos: [...new Set(data.map((l) => l.genero).filter(Boolean))].sort(),
        autores: [...new Set(data.map((l) => l.autor).filter(Boolean))].sort(),
        sagas: [...new Set(data.map((l) => l.saga).filter(Boolean))].sort(),
        idiomas: [...new Set(data.map((l) => l.idioma).filter(Boolean))].sort(),
      })
    })
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      cargar()
    }, 300) // debounce simple para no consultar en cada tecla
    return () => clearTimeout(timeout)
  }, [busqueda, genero, autor, saga, idioma, orden, soloSinLeer])

  async function cargar() {
    setCargando(true)
    try {
      const opcionOrden = OPCIONES_ORDEN.find((o) => o.valor === orden) || OPCIONES_ORDEN[0]
      const data = await listarLibros({
        busqueda,
        genero,
        autor,
        saga,
        idioma,
        leido: soloSinLeer ? false : undefined,
        ordenPor: opcionOrden.ordenPor,
        ordenAsc: opcionOrden.ordenAsc,
      })
      setLibros(data)
      setError(null)
    } catch (e) {
      setError('No se pudo cargar el catálogo. Revisá la conexión con Supabase.')
    } finally {
      setCargando(false)
    }
  }

  function limpiarFiltrosExtra() {
    setAutor('')
    setSaga('')
    setIdioma('')
  }

  const hayFiltrosExtra = autor || saga || idioma

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
          {opciones.generos.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select value={orden} onChange={(e) => setOrden(e.target.value)}>
          {OPCIONES_ORDEN.map((o) => (
            <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
          ))}
        </select>
        <button
          className={`chip-filtro ${soloSinLeer ? 'activo' : ''}`}
          onClick={() => setSoloSinLeer((v) => !v)}
          type="button"
        >
          Sin leer
        </button>
        <button
          className={`chip-filtro ${mostrarMasFiltros || hayFiltrosExtra ? 'activo' : ''}`}
          onClick={() => setMostrarMasFiltros((v) => !v)}
          type="button"
        >
          Más filtros
        </button>
      </div>

      {mostrarMasFiltros && (
        <div className="filtros filtros-extra">
          <select value={autor} onChange={(e) => setAutor(e.target.value)}>
            <option value="">Todos los autores</option>
            {opciones.autores.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select value={saga} onChange={(e) => setSaga(e.target.value)}>
            <option value="">Todas las sagas</option>
            {opciones.sagas.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={idioma} onChange={(e) => setIdioma(e.target.value)}>
            <option value="">Todos los idiomas</option>
            {opciones.idiomas.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          {hayFiltrosExtra && (
            <button type="button" className="btn-secundario" onClick={limpiarFiltrosExtra}>
              Limpiar
            </button>
          )}
        </div>
      )}

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
