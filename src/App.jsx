import { useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Catalogo from './pages/Catalogo.jsx'
import DetalleLibro from './pages/DetalleLibro.jsx'
import EditarLibro from './pages/EditarLibro.jsx'
import AgregarLibro from './pages/AgregarLibro.jsx'
import Prestamos from './pages/Prestamos.jsx'
import Estantes from './pages/Estantes.jsx'
import Wishlist from './pages/Wishlist.jsx'
import Sagas from './pages/Sagas.jsx'
import Estadisticas from './pages/Estadisticas.jsx'
import Perfiles from './pages/Perfiles.jsx'
import Login from './pages/Login.jsx'
import Admin from './pages/Admin.jsx'
import ToastHost from './components/ToastHost.jsx'
import { useAuth } from './context/AuthContext.jsx'

const ENLACES_NAV = [
  { to: '/', label: 'Catálogo', end: true },
  { to: '/estantes', label: 'Estantes' },
  { to: '/sagas', label: 'Sagas' },
  { to: '/wishlist', label: 'Wishlist' },
  { to: '/prestamos', label: 'Préstamos' },
  { to: '/estadisticas', label: 'Estadísticas' },
  { to: '/perfiles', label: 'Familia' },
  { to: '/agregar', label: 'Agregar libro' },
]

export default function App() {
  // Estado puramente de presentación: controla si el menú lateral
  // está abierto en pantallas chicas. No afecta rutas ni datos.
  const [menuAbierto, setMenuAbierto] = useState(false)
  const { session, familia, cargando, cerrarSesion, esAdmin } = useAuth()

  if (session === undefined || (session && cargando)) {
    return <div className="pantalla-carga">Cargando...</div>
  }

  if (!session) {
    return <Login />
  }

  const enlaces = esAdmin ? [...ENLACES_NAV, { to: '/admin', label: 'Administración' }] : ENLACES_NAV

  return (
    <div className="app-shell">
      <header className="topbar-movil">
        <button
          className="boton-menu"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
        <span className="marca-movil">Mi Biblioteca</span>
      </header>

      {menuAbierto && (
        <div className="overlay-menu" onClick={() => setMenuAbierto(false)} />
      )}

      <aside className={`sidebar ${menuAbierto ? 'abierto' : ''}`}>
        <div className="marca-sidebar">
          <span className="marca-titulo">Mi Biblioteca</span>
          <span className="marca-subtitulo">{familia?.nombre || 'Catálogo personal'}</span>
        </div>

        <nav className="nav-sidebar" onClick={() => setMenuAbierto(false)}>
          {enlaces.map((enlace) => (
            <NavLink key={enlace.to} to={enlace.to} end={enlace.end}>
              {enlace.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="boton-cerrar-sesion" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
        <div className="pie-sidebar">Tu biblioteca, siempre a mano</div>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<Catalogo />} />
          <Route path="/libro/:id" element={<DetalleLibro />} />
          <Route path="/libro/:id/editar" element={<EditarLibro />} />
          <Route path="/agregar" element={<AgregarLibro />} />
          <Route path="/prestamos" element={<Prestamos />} />
          <Route path="/estantes" element={<Estantes />} />
          <Route path="/sagas" element={<Sagas />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
          <Route path="/perfiles" element={<Perfiles />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      <ToastHost />
    </div>
  )
}
