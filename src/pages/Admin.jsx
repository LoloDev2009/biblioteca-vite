import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { listarUsuariosAdmin, activarUsuario } from '../lib/admin'
import { toast } from '../lib/toast'

export default function Admin() {
  const { esAdmin } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (esAdmin) cargar()
  }, [esAdmin])

  async function cargar() {
    setCargando(true)
    try {
      setUsuarios(await listarUsuariosAdmin())
    } finally {
      setCargando(false)
    }
  }

  async function handleToggleActiva(usuario) {
    const accion = usuario.activa ? 'desactivar' : 'activar'
    if (!window.confirm(`¿Seguro que querés ${accion} el acceso de "${usuario.email}"?`)) return
    await activarUsuario(usuario.user_id, !usuario.activa)
    setUsuarios((prev) =>
      prev.map((u) => (u.user_id === usuario.user_id ? { ...u, activa: !u.activa } : u))
    )
    toast(usuario.activa ? 'Usuario desactivado.' : 'Usuario activado.')
  }

  if (!esAdmin) {
    return <p className="error">No tenés permisos para ver esta pantalla.</p>
  }

  return (
    <div className="admin">
      <h2>Panel de administración</h2>
      <p className="ayuda-perfiles">
        Todos los usuarios registrados en la plataforma. Desactivar corta el acceso a su
        biblioteca sin borrar ningún dato.
      </p>

      {cargando && <p>Cargando...</p>}
      {!cargando && usuarios.length === 0 && <p className="vacio">Todavía no hay usuarios registrados.</p>}

      <div className="tabla-admin-wrap">
        <table className="tabla-admin">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Libros</th>
              <th>Registrado</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.user_id} className={!u.activa ? 'fila-inactiva' : ''}>
                <td>{u.email}</td>
                <td>{u.cantidad_libros}</td>
                <td>{new Date(u.creado_en).toLocaleDateString('es-AR')}</td>
                <td>
                  <span className={`estado-pill ${u.activa ? 'leido' : ''}`}>
                    {u.activa ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className={u.activa ? 'btn-eliminar' : ''}
                    onClick={() => handleToggleActiva(u)}
                  >
                    {u.activa ? 'Desactivar' : 'Activar'}
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
