import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarPorSaga } from '../lib/libros'

export default function Sagas() {
  const [grupos, setGrupos] = useState({})
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    listarPorSaga().then(setGrupos).finally(() => setCargando(false))
  }, [])

  const nombresSagas = Object.keys(grupos).sort((a, b) => a.localeCompare(b))

  if (cargando) return <p>Cargando...</p>

  if (nombresSagas.length === 0) {
    return (
      <div className="sagas">
        <h2>Sagas</h2>
        <p className="vacio">
          Todavía no tenés libros con una saga cargada. Agregala desde "Más detalles"
          al editar un libro y va a aparecer acá agrupado con el resto de la colección.
        </p>
      </div>
    )
  }

  return (
    <div className="sagas">
      <h2>Sagas</h2>
      {nombresSagas.map((nombre) => {
        const libros = grupos[nombre]
        const leidos = libros.filter((l) => l.leido).length
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
                  {!libro.leido && <span className="badge-sin-leer">Sin leer</span>}
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
