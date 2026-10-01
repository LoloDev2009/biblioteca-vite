import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarPrestamosActivos, marcarDevuelto } from '../lib/prestamos'
import { toast } from '../lib/toast'
import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { LoadingPagina } from '../components/Loading.jsx'

export default function Prestamos() {
  const [prestamos, setPrestamos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [devolviendoId, setDevolviendoId] = useState(null)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const data = await listarPrestamosActivos()
      setPrestamos(data)
    } catch (err) {
      console.error('cargar (Prestamos):', err)
      setError('No pudimos cargar los préstamos.')
    } finally {
      setCargando(false)
    }
  }

  async function handleDevolver(prestamoId) {
    if (devolviendoId) return
    setDevolviendoId(prestamoId)
    try {
      await marcarDevuelto(prestamoId)
      await cargar()
      toast.success('Devolución registrada.')
    } catch (err) {
      console.error('handleDevolver (Prestamos):', err)
      toast.error('No pudimos registrar la devolución.')
    } finally {
      setDevolviendoId(null)
    }
  }

  if (cargando) return <LoadingPagina texto="Cargando préstamos..." />
  if (error) return <ErrorState descripcion={error} onRetry={cargar} />

  return (
    <div className="prestamos">
      <h2>Préstamos activos</h2>
      {prestamos.length === 0 && (
        <EmptyState icono="📗" titulo="No tenés libros prestados" />
      )}

      <ul className="lista-prestamos">
        {prestamos.map((p) => (
          <li key={p.id}>
            <Link to={`/libro/${p.libro_id}`}>
              {p.libros?.portada_url && <img src={p.libros.portada_url} alt="" />}
              <div>
                <strong>{p.libros?.titulo}</strong>
                <span>{p.libros?.autor}</span>
              </div>
            </Link>
            <div className="prestamo-info">
              <span>Prestado a <strong>{p.nombre_persona}</strong></span>
              <span>desde {p.fecha_prestamo}</span>
              <button onClick={() => handleDevolver(p.id)} disabled={devolviendoId === p.id}>
                {devolviendoId === p.id ? 'Marcando...' : 'Marcar devuelto'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
