import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { listarUsuariosAdmin, activarUsuario } from '../lib/admin'
import { toast } from '../lib/toast'
import ModalConfirmacion from '../components/ModalConfirmacion.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { LoadingPagina } from '../components/Loading.jsx'

export default function Admin() {
  const { esAdmin } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [usuarioAConfirmar, setUsuarioAConfirmar] = useState(null)
  const [actualizando, setActualizando] = useState(false)

  useEffect(() => {
    if (esAdmin) cargar()
  }, [esAdmin])

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      setUsuarios(await listarUsuariosAdmin())
    } catch (err) {
      console.error('cargar (Admin):', err)
      setError('No pudimos cargar la lista de usuarios.')
    } finally {
      setCargando(false)
    }
  }

  function handleToggleActiva(usuario) {
    setUsuarioAConfirmar(usuario)
  }

  async function confirmarToggleActiva() {
    const usuario = usuarioAConfirmar
    setActualizando(true)
    try {
      await activarUsuario(usuario.user_id, !usuario.activa)
      setUsuarios((prev) =>
        prev.map((u) => (u.user_id === usuario.user_id ? { ...u, activa: !u.activa } : u))
      )
      setUsuarioAConfirmar(null)
      toast.success(usuario.activa ? 'Usuario desactivado.' : 'Usuario activado.')
    } catch (err) {
      console.error('confirmarToggleActiva:', err)
      toast.error('No pudimos actualizar el acceso de este usuario.')
    } finally {
      setActualizando(false)
    }
  }

  if (!esAdmin) {
    return <ErrorState titulo="Sin permisos" descripcion="No tenés permisos para ver esta pantalla." />
  }

  return (
    <div className="admin">
      <h2>Panel de administración</h2>
      <p className="ayuda-perfiles">
        Todos los usuarios registrados en la plataforma. Desactivar corta el acceso a su
        biblioteca sin borrar ningún dato.
      </p>

      {error && !cargando && <ErrorState descripcion={error} onRetry={cargar} />}

      {cargando && <LoadingPagina texto="Cargando usuarios..." />}

      {!cargando && !error && usuarios.length === 0 && (
        <EmptyState titulo="Todavía no hay usuarios registrados" />
      )}

      {!cargando && !error && usuarios.length > 0 && (
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
      )}

      <ModalConfirmacion
        abierto={!!usuarioAConfirmar}
        titulo={usuarioAConfirmar?.activa ? 'Desactivar usuario' : 'Activar usuario'}
        descripcion={
          usuarioAConfirmar
            ? `¿Seguro que querés ${usuarioAConfirmar.activa ? 'desactivar' : 'activar'} el acceso de "${usuarioAConfirmar.email}"?`
            : ''
        }
        textoConfirmar={usuarioAConfirmar?.activa ? 'Desactivar' : 'Activar'}
        variante={usuarioAConfirmar?.activa ? 'danger' : 'normal'}
        loading={actualizando}
        onCancelar={() => setUsuarioAConfirmar(null)}
        onConfirmar={confirmarToggleActiva}
      />
    </div>
  )
}
