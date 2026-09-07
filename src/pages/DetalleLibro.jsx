import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { obtenerLibro, eliminarLibro, actualizarLibro } from '../lib/libros'
import { prestarLibro, marcarDevuelto } from '../lib/prestamos'
import TagsLibro from '../components/TagsLibro.jsx'
import LecturasLibro from '../components/LecturasLibro.jsx'
import { toast } from '../lib/toast'
import ModalConfirmacion from '../components/ModalConfirmacion.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { LoadingPagina } from '../components/Loading.jsx'

export default function DetalleLibro() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [libro, setLibro] = useState(null)
  const [nombrePersona, setNombrePersona] = useState('')
  const [error, setError] = useState(null)
  const [prestando, setPrestando] = useState(false)
  const [devolviendo, setDevolviendo] = useState(false)
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function cargar() {
    setError(null)
    try {
      const data = await obtenerLibro(id)
      setLibro(data)
    } catch (err) {
      console.error('cargar (DetalleLibro):', err)
      setError('No pudimos cargar este libro.')
    }
  }

  const prestamoActivo = libro?.prestamos?.find((p) => !p.fecha_devolucion)

  async function handlePrestar(e) {
    e.preventDefault()
    if (!nombrePersona.trim() || prestando) return
    setPrestando(true)
    try {
      await prestarLibro(id, nombrePersona.trim())
      setNombrePersona('')
      await cargar()
      toast.success('Libro prestado.')
    } catch (err) {
      console.error('handlePrestar:', err)
      toast.error('No pudimos registrar el préstamo.')
    } finally {
      setPrestando(false)
    }
  }

  async function handleDevolver() {
    if (devolviendo) return
    setDevolviendo(true)
    try {
      await marcarDevuelto(prestamoActivo.id)
      await cargar()
      toast.success('Devolución registrada.')
    } catch (err) {
      console.error('handleDevolver:', err)
      toast.error('No pudimos registrar la devolución.')
    } finally {
      setDevolviendo(false)
    }
  }

  async function handleToggleFavorito() {
    try {
      await actualizarLibro(id, { favorito: !libro.favorito })
      await cargar()
    } catch (err) {
      console.error('handleToggleFavorito:', err)
      toast.error('No pudimos actualizar el favorito.')
    }
  }

  function handleEliminar() {
    if (prestamoActivo) {
      toast.error(
        `No podés eliminar este libro: está prestado a ${prestamoActivo.nombre_persona}. Registrá la devolución primero.`
      )
      return
    }
    setMostrarModalEliminar(true)
  }

  async function confirmarEliminacion() {
    setEliminando(true)
    try {
      await eliminarLibro(id)
      navigate('/')
      toast.success('Libro eliminado.')
    } catch (err) {
      console.error('confirmarEliminacion:', err)
      toast.error('No pudimos eliminar el libro.')
      setEliminando(false)
      setMostrarModalEliminar(false)
    }
  }

  if (error) return <ErrorState descripcion={error} onRetry={cargar} />
  if (!libro) return <LoadingPagina texto="Cargando libro..." />

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
        </div>
      </div>

      <LecturasLibro libroId={id} />

      <section className="prestamo-section">
        <h3>Préstamo</h3>
        {prestamoActivo ? (
          <div className="prestamo-activo">
            <p>
              Prestado a <strong>{prestamoActivo.nombre_persona}</strong> desde{' '}
              {prestamoActivo.fecha_prestamo}
            </p>
            <button onClick={handleDevolver} disabled={devolviendo}>
              {devolviendo ? 'Marcando...' : 'Marcar como devuelto'}
            </button>
          </div>
        ) : (
          <form onSubmit={handlePrestar} className="form-prestar">
            <input
              type="text"
              placeholder="Nombre de quien se lo lleva"
              value={nombrePersona}
              onChange={(e) => setNombrePersona(e.target.value)}
              disabled={prestando}
            />
            <button type="submit" disabled={prestando}>{prestando ? 'Prestando...' : 'Prestar'}</button>
          </form>
        )}
      </section>

      <div className="acciones-detalle">
        <Link to={`/libro/${id}/editar`} className="btn-link">Editar datos</Link>
        <button className="btn-eliminar" onClick={handleEliminar}>Eliminar libro</button>
      </div>

      <SeccionDetalles libro={libro} />

      <TagsLibro libroId={id} />

      <ModalConfirmacion
        abierto={mostrarModalEliminar}
        titulo="Eliminar libro"
        descripcion={`¿Seguro que querés eliminar "${libro.titulo}" de tu biblioteca? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        variante="danger"
        loading={eliminando}
        onCancelar={() => setMostrarModalEliminar(false)}
        onConfirmar={confirmarEliminacion}
      />
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
  ].filter((d) => d.valor !== null && d.valor !== undefined && d.valor !== '')

  const tieneTextoLargo = libro.descripcion || libro.notas

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

      {libro.notas && (
        <div className="bloque-texto">
          <h4>Notas</h4>
          <p>{libro.notas}</p>
        </div>
      )}
    </section>
  )
}
