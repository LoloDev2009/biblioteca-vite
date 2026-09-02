import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listarLibros, listarValoresFiltro, actualizarLibro, eliminarLibro } from '../lib/libros'
import { listarPrestamosActivosPorLibro, prestarLibro } from '../lib/prestamos'
import { listarPerfiles } from '../lib/perfiles'
import { listarLecturasPorLibro } from '../lib/lecturas'
import { toast } from '../lib/toast'

const OPCIONES_ORDEN = [
  { valor: 'titulo-asc', etiqueta: 'Título (A-Z)', ordenPor: 'titulo', ordenAsc: true },
  { valor: 'titulo-desc', etiqueta: 'Título (Z-A)', ordenPor: 'titulo', ordenAsc: false },
  { valor: 'autor-asc', etiqueta: 'Autor (A-Z)', ordenPor: 'autor', ordenAsc: true },
  { valor: 'autor-desc', etiqueta: 'Autor (Z-A)', ordenPor: 'autor', ordenAsc: false },
  { valor: 'anio-asc', etiqueta: 'Año ascendente', ordenPor: 'anio_publicacion', ordenAsc: true },
  { valor: 'anio-desc', etiqueta: 'Año descendente', ordenPor: 'anio_publicacion', ordenAsc: false },
  { valor: 'puntuacion-desc', etiqueta: 'Puntuación mayor a menor', ordenPor: 'puntuacion', ordenAsc: false },
  { valor: 'puntuacion-asc', etiqueta: 'Puntuación menor a mayor', ordenPor: 'puntuacion', ordenAsc: true },
  { valor: 'creado_en-desc', etiqueta: 'Agregado recientemente', ordenPor: 'creado_en', ordenAsc: false },
  { valor: 'creado_en-asc', etiqueta: 'Agregado más antiguo', ordenPor: 'creado_en', ordenAsc: true },
]

const CLAVE_ORDEN = 'biblioteca:orden'
const CLAVE_VISTA = 'biblioteca:vista'

function vistaInicial() {
  const guardada = localStorage.getItem(CLAVE_VISTA)
  if (guardada) return guardada
  // En mobile, arrancar en lista es más cómodo que la cuadrícula.
  return window.innerWidth < 640 ? 'lista' : 'cuadricula'
}

export default function Catalogo() {
  const navigate = useNavigate()
  const [libros, setLibros] = useState([])
  const [prestamosPorLibro, setPrestamosPorLibro] = useState({})
  const [perfiles, setPerfiles] = useState([])
  const [leidoPor, setLeidoPor] = useState('')
  const [opciones, setOpciones] = useState({ generos: [], autores: [], sagas: [], idiomas: [], estantes: [] })
  const [busqueda, setBusqueda] = useState('')
  const [genero, setGenero] = useState('')
  const [autor, setAutor] = useState('')
  const [saga, setSaga] = useState('')
  const [idioma, setIdioma] = useState('')
  const [estante, setEstante] = useState('')
  const [estadoLectura, setEstadoLectura] = useState('todos') // todos | leidos | sinLeer
  const [estadoPrestamo, setEstadoPrestamo] = useState('todos') // todos | disponibles | prestados
  const [soloFavoritos, setSoloFavoritos] = useState(false)
  const [orden, setOrden] = useState(() => localStorage.getItem(CLAVE_ORDEN) || 'titulo-asc')
  const [vista, setVista] = useState(vistaInicial)
  const [mostrarMasFiltros, setMostrarMasFiltros] = useState(false)
  const [menuAbiertoId, setMenuAbiertoId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    listarValoresFiltro().then((data) => {
      setOpciones({
        generos: [...new Set(data.map((l) => l.genero).filter(Boolean))].sort(),
        autores: [...new Set(data.map((l) => l.autor).filter(Boolean))].sort(),
        sagas: [...new Set(data.map((l) => l.saga).filter(Boolean))].sort(),
        idiomas: [...new Set(data.map((l) => l.idioma).filter(Boolean))].sort(),
        estantes: [...new Set(data.map((l) => l.estante).filter(Boolean))].sort(),
      })
    })
    listarPerfiles().then(setPerfiles)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      cargar()
    }, 250)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, genero, autor, saga, idioma, estante, estadoLectura, estadoPrestamo, soloFavoritos, leidoPor, orden])

  useEffect(() => {
    localStorage.setItem(CLAVE_ORDEN, orden)
  }, [orden])

  useEffect(() => {
    localStorage.setItem(CLAVE_VISTA, vista)
  }, [vista])

  // Cierra el menú de acciones rápidas al hacer clic en cualquier otro lado.
  useEffect(() => {
    function cerrar() {
      setMenuAbiertoId(null)
    }
    document.addEventListener('click', cerrar)
    return () => document.removeEventListener('click', cerrar)
  }, [])

  async function cargar() {
    setCargando(true)
    try {
      const opcionOrden = OPCIONES_ORDEN.find((o) => o.valor === orden) || OPCIONES_ORDEN[0]
      const [data, mapaPrestamos, mapaLecturas] = await Promise.all([
        listarLibros({
          busqueda,
          genero,
          autor,
          saga,
          idioma,
          estante,
          leido: estadoLectura === 'todos' ? undefined : estadoLectura === 'leidos',
          favorito: soloFavoritos ? true : undefined,
          ordenPor: opcionOrden.ordenPor,
          ordenAsc: opcionOrden.ordenAsc,
        }),
        listarPrestamosActivosPorLibro(),
        listarLecturasPorLibro(),
      ])

      let resultado = data
      if (estadoPrestamo === 'prestados') resultado = resultado.filter((l) => mapaPrestamos[l.id])
      if (estadoPrestamo === 'disponibles') resultado = resultado.filter((l) => !mapaPrestamos[l.id])
      if (leidoPor) resultado = resultado.filter((l) => (mapaLecturas[l.id] || []).includes(leidoPor))

      setLibros(resultado)
      setPrestamosPorLibro(mapaPrestamos)
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
    setEstante('')
    setLeidoPor('')
  }

  function limpiarTodo() {
    setBusqueda('')
    setGenero('')
    limpiarFiltrosExtra()
    setEstadoLectura('todos')
    setEstadoPrestamo('todos')
    setSoloFavoritos(false)
  }

  const hayFiltrosExtra = autor || saga || idioma || estante || leidoPor

  // Chips de filtros activos, cada uno con su función para sacarlo individualmente.
  const chips = [
    busqueda && { etiqueta: `Buscar: ${busqueda}`, quitar: () => setBusqueda('') },
    genero && { etiqueta: `Género: ${genero}`, quitar: () => setGenero('') },
    autor && { etiqueta: `Autor: ${autor}`, quitar: () => setAutor('') },
    saga && { etiqueta: `Saga: ${saga}`, quitar: () => setSaga('') },
    idioma && { etiqueta: `Idioma: ${idioma}`, quitar: () => setIdioma('') },
    estante && { etiqueta: `Estante: ${estante}`, quitar: () => setEstante('') },
    leidoPor && {
      etiqueta: `Leído por: ${perfiles.find((p) => p.id === leidoPor)?.nombre || ''}`,
      quitar: () => setLeidoPor(''),
    },
    estadoLectura !== 'todos' && {
      etiqueta: estadoLectura === 'leidos' ? 'Leídos' : 'Sin leer',
      quitar: () => setEstadoLectura('todos'),
    },
    estadoPrestamo !== 'todos' && {
      etiqueta: estadoPrestamo === 'prestados' ? 'Prestados' : 'Disponibles',
      quitar: () => setEstadoPrestamo('todos'),
    },
    soloFavoritos && { etiqueta: 'Favoritos', quitar: () => setSoloFavoritos(false) },
  ].filter(Boolean)

  async function handleToggleFavorito(e, libro) {
    e.preventDefault()
    e.stopPropagation()
    setLibros((prev) => prev.map((l) => (l.id === libro.id ? { ...l, favorito: !l.favorito } : l)))
    try {
      await actualizarLibro(libro.id, { favorito: !libro.favorito })
    } catch (e) {
      setLibros((prev) => prev.map((l) => (l.id === libro.id ? { ...l, favorito: libro.favorito } : l)))
    }
  }

  function handleAbrirMenu(e, libroId) {
    e.preventDefault()
    e.stopPropagation()
    setMenuAbiertoId((actual) => (actual === libroId ? null : libroId))
  }

  async function handleMarcarLeido(e, libro) {
    e.preventDefault()
    e.stopPropagation()
    setMenuAbiertoId(null)
    await actualizarLibro(libro.id, { leido: !libro.leido })
    setLibros((prev) => prev.map((l) => (l.id === libro.id ? { ...l, leido: !l.leido } : l)))
    toast(libro.leido ? 'Marcado como no leído.' : 'Marcado como leído.')
  }

  async function handlePrestarRapido(e, libro) {
    e.preventDefault()
    e.stopPropagation()
    setMenuAbiertoId(null)
    const nombre = window.prompt(`¿A quién le prestás "${libro.titulo}"?`)
    if (!nombre?.trim()) return
    await prestarLibro(libro.id, nombre.trim())
    cargar()
    toast('Libro prestado.')
  }

  function handleEditarRapido(e, libro) {
    e.preventDefault()
    e.stopPropagation()
    setMenuAbiertoId(null)
    navigate(`/libro/${libro.id}/editar`)
  }

  async function handleEliminarRapido(e, libro) {
    e.preventDefault()
    e.stopPropagation()
    setMenuAbiertoId(null)
    const prestamo = prestamosPorLibro[libro.id]
    if (prestamo) {
      window.alert(
        `No podés eliminar "${libro.titulo}": está prestado a ${prestamo.nombre_persona}. Registrá la devolución primero.`
      )
      return
    }
    if (!window.confirm(`¿Eliminar "${libro.titulo}" de tu biblioteca? Esta acción no se puede deshacer.`)) return
    await eliminarLibro(libro.id)
    setLibros((prev) => prev.filter((l) => l.id !== libro.id))
    toast('Libro eliminado.')
  }

  return (
    <div className="catalogo">
      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar por título, autor, ISBN, saga..."
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
          className={`chip-filtro ${soloFavoritos ? 'activo' : ''}`}
          onClick={() => setSoloFavoritos((v) => !v)}
          type="button"
        >
          ★ Favoritos
        </button>
        <button
          className={`chip-filtro ${mostrarMasFiltros || hayFiltrosExtra ? 'activo' : ''}`}
          onClick={() => setMostrarMasFiltros((v) => !v)}
          type="button"
        >
          Más filtros
        </button>
        <div className="selector-vista">
          <button
            type="button"
            className={vista === 'cuadricula' ? 'activo' : ''}
            onClick={() => setVista('cuadricula')}
            aria-label="Ver en cuadrícula"
          >
            ▦
          </button>
          <button
            type="button"
            className={vista === 'lista' ? 'activo' : ''}
            onClick={() => setVista('lista')}
            aria-label="Ver en lista"
          >
            ☰
          </button>
        </div>
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
          <select value={estante} onChange={(e) => setEstante(e.target.value)}>
            <option value="">Todos los estantes</option>
            {opciones.estantes.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <select value={estadoLectura} onChange={(e) => setEstadoLectura(e.target.value)}>
            <option value="todos">Lectura: todos</option>
            <option value="leidos">Solo leídos</option>
            <option value="sinLeer">Solo sin leer</option>
          </select>
          <select value={estadoPrestamo} onChange={(e) => setEstadoPrestamo(e.target.value)}>
            <option value="todos">Préstamo: todos</option>
            <option value="disponibles">Solo disponibles</option>
            <option value="prestados">Solo prestados</option>
          </select>
          {perfiles.length > 0 && (
            <select value={leidoPor} onChange={(e) => setLeidoPor(e.target.value)}>
              <option value="">Leído por: cualquiera</option>
              {perfiles.map((p) => (
                <option key={p.id} value={p.id}>Leído por: {p.nombre}</option>
              ))}
            </select>
          )}
          {hayFiltrosExtra && (
            <button type="button" className="btn-secundario" onClick={limpiarFiltrosExtra}>
              Limpiar estos
            </button>
          )}
        </div>
      )}

      {chips.length > 0 && (
        <div className="chips-activos">
          {chips.map((c) => (
            <button key={c.etiqueta} className="chip-activo" onClick={c.quitar} type="button">
              {c.etiqueta} <span>×</span>
            </button>
          ))}
          <button className="chip-limpiar-todo" onClick={limpiarTodo} type="button">
            Limpiar filtros
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {cargando && <SkeletonCatalogo vista={vista} />}

      {!cargando && libros.length === 0 && chips.length === 0 && (
        <p className="vacio">
          Todavía no tenés libros. <Link to="/agregar" className="link-inline">Agregá tu primer libro.</Link>
        </p>
      )}
      {!cargando && libros.length === 0 && chips.length > 0 && (
        <p className="vacio">
          {busqueda ? `No encontramos libros para "${busqueda}".` : 'No encontramos libros con estos filtros.'}{' '}
          <button type="button" className="link-inline" onClick={limpiarTodo}>Limpiar búsqueda</button>
        </p>
      )}

      {!cargando && (vista === 'cuadricula' ? (
        <div className="grid-libros">
          {libros.map((libro) => (
            <Link to={`/libro/${libro.id}`} key={libro.id} className="card-libro">
              <div className="card-libro-imagen">
                {libro.portada_url ? (
                  <img src={libro.portada_url} alt={libro.titulo} />
                ) : (
                  <div className="sin-portada">Sin portada</div>
                )}
                {!libro.leido && <span className="badge-sin-leer">Sin leer</span>}
                {prestamosPorLibro[libro.id] && <span className="badge-prestado">Prestado</span>}
                <button
                  type="button"
                  className={`estrella-card ${libro.favorito ? 'activa' : ''}`}
                  onClick={(e) => handleToggleFavorito(e, libro)}
                  aria-label={libro.favorito ? 'Quitar de favoritos' : 'Marcar como favorito'}
                >
                  {libro.favorito ? '★' : '☆'}
                </button>
                <MenuAccionesRapidas
                  libro={libro}
                  abierto={menuAbiertoId === libro.id}
                  prestado={!!prestamosPorLibro[libro.id]}
                  onAbrir={(e) => handleAbrirMenu(e, libro.id)}
                  onMarcarLeido={(e) => handleMarcarLeido(e, libro)}
                  onPrestar={(e) => handlePrestarRapido(e, libro)}
                  onEditar={(e) => handleEditarRapido(e, libro)}
                  onEliminar={(e) => handleEliminarRapido(e, libro)}
                />
              </div>
              <div className="info">
                <strong>{libro.titulo}</strong>
                <span>{libro.autor}</span>
                {libro.estante && <span className="estante">📍 {libro.estante}</span>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="lista-catalogo">
          {libros.map((libro) => (
            <Link to={`/libro/${libro.id}`} key={libro.id} className="fila-libro">
              {libro.portada_url ? (
                <img src={libro.portada_url} alt={libro.titulo} />
              ) : (
                <div className="sin-portada mini">Sin portada</div>
              )}
              <div className="fila-libro-info">
                <strong>{libro.titulo}</strong>
                <span>{libro.autor}{libro.anio_publicacion ? ` · ${libro.anio_publicacion}` : ''}</span>
                <div className="fila-libro-badges">
                  <span className={`estado-pill ${libro.leido ? 'leido' : ''}`}>
                    {libro.leido ? 'Leído' : 'Sin leer'}
                  </span>
                  {prestamosPorLibro[libro.id] && <span className="estado-pill prestado">Prestado</span>}
                  {libro.favorito && <span className="estado-pill favorito">★ Favorito</span>}
                </div>
              </div>
              <MenuAccionesRapidas
                libro={libro}
                abierto={menuAbiertoId === libro.id}
                prestado={!!prestamosPorLibro[libro.id]}
                onAbrir={(e) => handleAbrirMenu(e, libro.id)}
                onMarcarLeido={(e) => handleMarcarLeido(e, libro)}
                onPrestar={(e) => handlePrestarRapido(e, libro)}
                onEditar={(e) => handleEditarRapido(e, libro)}
                onEliminar={(e) => handleEliminarRapido(e, libro)}
              />
            </Link>
          ))}
        </div>
      ))}

      <Link to="/agregar" className="boton-flotante" aria-label="Agregar libro">+</Link>
    </div>
  )
}

function MenuAccionesRapidas({ libro, abierto, prestado, onAbrir, onMarcarLeido, onPrestar, onEditar, onEliminar }) {
  return (
    <div className="menu-acciones-rapidas" onClick={(e) => e.stopPropagation()}>
      <button type="button" className="boton-kebab" onClick={onAbrir} aria-label="Más acciones">⋯</button>
      {abierto && (
        <div className="menu-desplegable">
          <button type="button" onClick={onMarcarLeido}>
            {libro.leido ? 'Marcar como no leído' : 'Marcar como leído'}
          </button>
          {!prestado && <button type="button" onClick={onPrestar}>Prestar</button>}
          <button type="button" onClick={onEditar}>Editar</button>
          <button type="button" className="opcion-eliminar" onClick={onEliminar}>Eliminar</button>
        </div>
      )}
    </div>
  )
}

// Placeholders animados mientras se consulta Supabase, para que la app
// no se sienta "trabada" mientras carga el catálogo.
function SkeletonCatalogo({ vista }) {
  const cantidad = 8
  if (vista === 'lista') {
    return (
      <div className="lista-catalogo">
        {Array.from({ length: cantidad }).map((_, i) => (
          <div key={i} className="fila-libro skeleton-fila">
            <div className="skeleton-bloque skeleton-mini-portada" />
            <div className="skeleton-fila-textos">
              <div className="skeleton-bloque skeleton-linea corta" />
              <div className="skeleton-bloque skeleton-linea" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="grid-libros">
      {Array.from({ length: cantidad }).map((_, i) => (
        <div key={i} className="card-libro skeleton-card">
          <div className="skeleton-bloque skeleton-imagen" />
          <div className="info">
            <div className="skeleton-bloque skeleton-linea corta" />
            <div className="skeleton-bloque skeleton-linea" />
          </div>
        </div>
      ))}
    </div>
  )
}
