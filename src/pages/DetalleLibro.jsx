import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { obtenerLibro, eliminarLibro, actualizarLibro } from '../lib/libros'
import { prestarLibro, marcarDevuelto } from '../lib/prestamos'
import TagsLibro from '../components/TagsLibro.jsx'

export default function DetalleLibro() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [libro, setLibro] = useState(null)
  const [nombrePersona, setNombrePersona] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    cargar()
  }, [id])

  async function cargar() {
    try {
      const data = await obtenerLibro(id)
      setLibro(data)
    } catch (e) {
      setError('No se pudo cargar el libro.')
    }
  }

  const prestamoActivo = libro?.prestamos?.find((p) => !p.fecha_devolucion)

  async function handlePrestar(e) {
    e.preventDefault()
    if (!nombrePersona.trim()) return
    await prestarLibro(id, nombrePersona.trim())
    setNombrePersona('')
    cargar()
  }

  async function handleDevolver() {
    await marcarDevuelto(prestamoActivo.id)
    cargar()
  }

  async function handleToggleLeido() {
    await actualizarLibro(id, { leido: !libro.leido })
    cargar()
  }

  async function handleToggleFavorito() {
    await actualizarLibro(id, { favorito: !libro.favorito })
    cargar()
  }

  async function handleEliminar() {
    if (!confirm('¿Seguro que querés borrar este libro?')) return
    await eliminarLibro(id)
    navigate('/')
  }

  if (error) return <p className="error">{error}</p>
  if (!libro) return <p>Cargando...</p>

  return (
    <div className="detalle-libro">
      <div className="detalle-header">
        {libro.portada_url ? (
          <img src={libro.portada_url} alt={libro.titulo} />
        ) : (
          <div className="sin-portada grande">Sin portada</div>
        )}
        <div>
          <div className="titulo-con-favorito">
            <h2>{libro.titulo}</h2>
            <button
              type="button"
              className={`boton-favorito ${libro.favorito ? 'activo' : ''}`}
              onClick={handleToggleFavorito}
              aria-label={libro.favorito ? 'Quitar de favoritos' : 'Marcar como favorito'}
            >
              {libro.favorito ? '★' : '☆'}
            </button>
          </div>
          <p><strong>Autor:</strong> {libro.autor || '—'}</p>
          <p><strong>Género:</strong> {libro.genero || '—'}</p>
          <p><strong>Editorial:</strong> {libro.editorial || '—'}</p>
          <p><strong>ISBN:</strong> {libro.isbn || '—'}</p>
          <p><strong>Estante:</strong> {libro.estante || '—'}</p>
          <button
            className={`boton-leido ${libro.leido ? 'leido' : ''}`}
            onClick={handleToggleLeido}
            type="button"
          >
            {libro.leido ? '✓ Leído' : 'Marcar como leído'}
          </button>
        </div>
      </div>

      <section className="prestamo-section">
        <h3>Préstamo</h3>
        {prestamoActivo ? (
          <div className="prestamo-activo">
            <p>
              Prestado a <strong>{prestamoActivo.nombre_persona}</strong> desde{' '}
              {prestamoActivo.fecha_prestamo}
            </p>
            <button onClick={handleDevolver}>Marcar como devuelto</button>
          </div>
        ) : (
          <form onSubmit={handlePrestar} className="form-prestar">
            <input
              type="text"
              placeholder="Nombre de quien se lo lleva"
              value={nombrePersona}
              onChange={(e) => setNombrePersona(e.target.value)}
            />
            <button type="submit">Prestar</button>
          </form>
        )}
      </section>

      <div className="acciones-detalle">
        <Link to={`/libro/${id}/editar`} className="btn-link">Editar datos</Link>
        <button className="btn-eliminar" onClick={handleEliminar}>Eliminar libro</button>
      </div>

      <SeccionDetalles libro={libro} />

      <TagsLibro libroId={id} />
    </div>
  )
}

// Muestra los campos "extra" del libro (saga, año, idioma, páginas, puntuación,
// reseña, descripción, notas, ejemplares) solo cuando tienen algún valor cargado,
// para no llenar la pantalla de guiones cuando no se completaron.
function SeccionDetalles({ libro }) {
  const datos = [
    { etiqueta: 'Saga', valor: libro.saga },
    { etiqueta: 'N° en la saga', valor: libro.numero_saga },
    { etiqueta: 'Año de publicación', valor: libro.anio_publicacion },
    { etiqueta: 'Idioma', valor: libro.idioma },
    { etiqueta: 'Páginas', valor: libro.paginas },
    { etiqueta: 'Ejemplares', valor: libro.ejemplares_totales },
    { etiqueta: 'Puntuación', valor: libro.puntuacion != null ? `${libro.puntuacion} / 5` : null },
  ].filter((d) => d.valor !== null && d.valor !== undefined && d.valor !== '')

  const tieneTextoLargo = libro.descripcion || libro.resena || libro.notas

  if (datos.length === 0 && !tieneTextoLargo) return null

  return (
    <section className="detalles-extra">
      <h3>Más detalles</h3>

      {datos.length > 0 && (
        <div className="grilla-detalles">
          {datos.map((d) => (
            <div key={d.etiqueta} className="dato-extra">
              <span className="dato-etiqueta">{d.etiqueta}</span>
              <span className="dato-valor">{d.valor}</span>
            </div>
          ))}
        </div>
      )}

      {libro.descripcion && (
        <div className="bloque-texto">
          <h4>Descripción</h4>
          <p>{libro.descripcion}</p>
        </div>
      )}

      {libro.resena && (
        <div className="bloque-texto">
          <h4>Mi reseña</h4>
          <p>{libro.resena}</p>
        </div>
      )}

      {libro.notas && (
        <div className="bloque-texto">
          <h4>Notas</h4>
          <p>{libro.notas}</p>
        </div>
      )}
    </section>
  )
}
