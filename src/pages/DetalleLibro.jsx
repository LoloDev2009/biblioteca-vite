import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { obtenerLibro, eliminarLibro, actualizarLibro } from '../lib/libros'
import { prestarLibro, marcarDevuelto } from '../lib/prestamos'

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
          <h2>{libro.titulo}</h2>
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
    </div>
  )
}
