import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarPrestamosActivos, marcarDevuelto } from '../lib/prestamos'

export default function Prestamos() {
  const [prestamos, setPrestamos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setCargando(true)
    try {
      const data = await listarPrestamosActivos()
      setPrestamos(data)
    } finally {
      setCargando(false)
    }
  }

  async function handleDevolver(prestamoId) {
    await marcarDevuelto(prestamoId)
    cargar()
  }

  if (cargando) return <p>Cargando...</p>

  return (
    <div className="prestamos">
      <h2>Préstamos activos</h2>
      {prestamos.length === 0 && <p className="vacio">No tenés libros prestados.</p>}

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
              <button onClick={() => handleDevolver(p.id)}>Marcar devuelto</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
