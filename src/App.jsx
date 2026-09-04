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
import ToastHost from './components/ToastHost.jsx'

const ENLACES_NAV = [
  { to: '/', label: 'Catálogo', icon: '📚', end: true },
  { to: '/estantes', label: 'Estantes', icon: '🗄️' },
  { to: '/sagas', label: 'Sagas', icon: '📖' },
  { to: '/wishlist', label: 'Wishlist', icon: '⭐' },
  { to: '/prestamos', label: 'Préstamos', icon: '🤝' },
  { to: '/estadisticas', label: 'Estadísticas', icon: '📊' },
  { to: '/perfiles', label: 'Familia', icon: '👪' },
  { to: '/agregar', label: 'Agregar libro', icon: '➕' },
]

export default function App() {
  // Estado puramente de presentación: controla si el menú lateral
  // está abierto en pantallas chicas. No afecta rutas ni datos.
  const [menuAbierto, setMenuAbierto] = useState(false)

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
          <span className="marca-icono" aria-hidden="true">📚</span>
          <span className="marca-titulo">Mi Biblioteca</span>
          <span className="marca-subtitulo">Catálogo personal</span>
        </div>

        <nav className="nav-sidebar" onClick={() => setMenuAbierto(false)}>
          {ENLACES_NAV.map((enlace) => (
            <NavLink key={enlace.to} to={enlace.to} end={enlace.end} title={enlace.label}>
              <span className="nav-icono" aria-hidden="true">{enlace.icon}</span>
              <span className="nav-etiqueta">{enlace.label}</span>
            </NavLink>
          ))}
        </nav>

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
        </Routes>
      </main>

      <ToastHost />
    </div>
  )
}
