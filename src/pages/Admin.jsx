import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { listarFamiliasAdmin, activarFamilia } from '../lib/admin'
import { toast } from '../lib/toast'

export default function Admin() {
  const { esAdmin } = useAuth()
  const [familias, setFamilias] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (esAdmin) cargar()
  }, [esAdmin])

  async function cargar() {
    setCargando(true)
    try {
      setFamilias(await listarFamiliasAdmin())
    } finally {
      setCargando(false)
    }
  }

  async function handleToggleActiva(familia) {
    const accion = familia.activa ? 'desactivar' : 'activar'
    if (!window.confirm(`¿Seguro que querés ${accion} el acceso de "${familia.nombre}"?`)) return
    await activarFamilia(familia.id, !familia.activa)
    setFamilias((prev) =>
      prev.map((f) => (f.id === familia.id ? { ...f, activa: !f.activa } : f))
    )
    toast(familia.activa ? 'Familia desactivada.' : 'Familia activada.')
  }

  if (!esAdmin) {
    return <p className="error">No tenés permisos para ver esta pantalla.</p>
  }

  return (
    <div className="admin">
      <h2>Panel de administración</h2>
      <p className="ayuda-perfiles">
        Todas las familias registradas en la plataforma. Desactivar corta el acceso a esa
        biblioteca sin borrar ningún dato.
      </p>

      {cargando && <p>Cargando...</p>}
      {!cargando && familias.length === 0 && <p className="vacio">Todavía no hay familias registradas.</p>}

      <div className="tabla-admin-wrap">
        <table className="tabla-admin">
          <thead>
            <tr>
              <th>Familia</th>
              <th>Dueño</th>
              <th>Miembros</th>
              <th>Libros</th>
              <th>Creada</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {familias.map((f) => (
              <tr key={f.id} className={!f.activa ? 'fila-inactiva' : ''}>
                <td>{f.nombre}</td>
                <td>{f.email_dueño || '—'}</td>
                <td>{f.cantidad_miembros}</td>
                <td>{f.cantidad_libros}</td>
                <td>{new Date(f.creado_en).toLocaleDateString('es-AR')}</td>
                <td>
                  <span className={`estado-pill ${f.activa ? 'leido' : ''}`}>
                    {f.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className={f.activa ? 'btn-eliminar' : ''}
                    onClick={() => handleToggleActiva(f)}
                  >
                    {f.activa ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
