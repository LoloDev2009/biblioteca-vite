import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarPorSaga } from '../lib/libros'
import { listarLecturasPorLibro } from '../lib/lecturas'
import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { LoadingPagina } from '../components/Loading.jsx'

export default function Sagas() {
  const [grupos, setGrupos] = useState({})
  const [mapaLecturas, setMapaLecturas] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    cargar()
  }, [])

  function cargar() {
    setCargando(true)
    setError(null)
    Promise.all([listarPorSaga(), listarLecturasPorLibro()])
      .then(([gruposData, mapa]) => {
        setGrupos(gruposData)
        setMapaLecturas(mapa)
      })
      .catch((err) => {
        console.error('cargar (Sagas):', err)
        setError('No pudimos cargar las sagas.')
      })
      .finally(() => setCargando(false))
  }

  const nombresSagas = Object.keys(grupos).sort((a, b) => a.localeCompare(b))

  if (cargando) return <LoadingPagina texto="Cargando sagas..." />

  if (error) return <ErrorState descripcion={error} onRetry={cargar} />

  if (nombresSagas.length === 0) {
    return (
      <div className="sagas">
        <h2>Sagas</h2>
        <EmptyState
          icono="📖"
          titulo="Todavía no tenés sagas cargadas"
          descripcion='Agregala desde "Más detalles" al editar un libro y va a aparecer acá agrupada con el resto de la colección.'
        />
      </div>
    )
  }

  return (
    <div className="sagas">
      <h2>Sagas</h2>
      {nombresSagas.map((nombre) => {
        const libros = grupos[nombre]
        const leidos = libros.filter((l) => mapaLecturas[l.id]?.length > 0).length
        return (
          <div key={nombre} className="saga-bloque">
            <div className="saga-encabezado">
              <h3>{nombre}</h3>
              <span className="saga-progreso">{leidos} / {libros.length} leídos</span>
            </div>
            <div className="fila-saga">
              {libros.map((libro, i) => (
                <Link to={`/libro/${libro.id}`} key={libro.id} className="mini-card-libro">
                  <span className="numero-saga">{libro.numero_saga ?? i + 1}</span>
                  {libro.portada_url ? (
                    <img src={libro.portada_url} alt={libro.titulo} />
                  ) : (
                    <div className="sin-portada">Sin portada</div>
                  )}
                  {!(mapaLecturas[libro.id]?.length > 0) && <span className="badge-sin-leer">Sin leer</span>}
                  <div className="mini-info">
                    <strong>{libro.titulo}</strong>
                    {libro.anio_publicacion && <span>{libro.anio_publicacion}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
