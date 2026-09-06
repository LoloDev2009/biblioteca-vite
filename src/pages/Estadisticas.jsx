import { useEffect, useState } from 'react'
import { obtenerEstadisticas } from '../lib/libros'
import { obtenerEstadisticasPorPerfil } from '../lib/lecturas'

export default function Estadisticas() {
  const [stats, setStats] = useState(null)
  const [statsPorPerfil, setStatsPorPerfil] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    Promise.all([obtenerEstadisticas(), obtenerEstadisticasPorPerfil()])
      .then(([generales, porPerfil]) => {
        setStats(generales)
        setStatsPorPerfil(porPerfil)
      })
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return <p>Cargando...</p>
  if (!stats) return <p className="error">No se pudieron cargar las estadísticas.</p>

  const porcentajeLeidos = stats.total > 0 ? Math.round((stats.leidos / stats.total) * 100) : 0
  const maxGenero = Math.max(1, ...stats.topGeneros.map(([, n]) => n))
  const maxAutor = Math.max(1, ...stats.topAutores.map(([, n]) => n))

  return (
    <div className="estadisticas">
      <h2>Estadísticas</h2>

      <div className="grid-metricas">
        <MetricaCard valor={stats.total} etiqueta="Libros en total" />
        <MetricaCard valor={`${porcentajeLeidos}%`} etiqueta={`Leídos (${stats.leidos} de ${stats.total})`} />
        <MetricaCard valor={stats.sinLeer} etiqueta="Pendientes de leer" />
        <MetricaCard
          valor={stats.promedioPuntuacion != null ? stats.promedioPuntuacion.toFixed(1) : '—'}
          etiqueta="Puntuación promedio"
        />
        <MetricaCard valor={stats.paginasLeidas.toLocaleString('es-AR')} etiqueta="Páginas leídas (total)" />
        <MetricaCard valor={stats.enWishlist} etiqueta="En la wishlist" />
        <MetricaCard valor={stats.prestamosActivos} etiqueta="Préstamos activos" />
      </div>

      {statsPorPerfil.length > 0 && (
        <div className="grid-perfiles-stats">
          {statsPorPerfil.map(({ perfil, librosLeidos, paginasLeidas, promedioPuntuacion }) => (
            <div key={perfil.id} className="perfil-stats-card">
              <h3>{perfil.nombre}</h3>
              <div className="perfil-stats-datos">
                <div>
                  <span className="metrica-valor chico">{librosLeidos}</span>
                  <span className="metrica-etiqueta">Libros leídos</span>
                </div>
                <div>
                  <span className="metrica-valor chico">{paginasLeidas.toLocaleString('es-AR')}</span>
                  <span className="metrica-etiqueta">Páginas leídas</span>
                </div>
                <div>
                  <span className="metrica-valor chico">
                    {promedioPuntuacion != null ? promedioPuntuacion.toFixed(1) : '—'}
                  </span>
                  <span className="metrica-etiqueta">Puntuación prom.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {statsPorPerfil.length === 0 && (
        <p className="vacio">
          Cargá tus perfiles de lectura en "Perfiles" para ver estadísticas por persona.
        </p>
      )}

      <div className="grid-rankings">
        <div className="ranking-bloque">
          <h3>Géneros más frecuentes</h3>
          {stats.topGeneros.length === 0 && <p className="vacio">Todavía no hay géneros cargados.</p>}
          {stats.topGeneros.map(([nombre, cantidad]) => (
            <BarraRanking key={nombre} nombre={nombre} cantidad={cantidad} max={maxGenero} />
          ))}
        </div>

        <div className="ranking-bloque">
          <h3>Autores con más libros</h3>
          {stats.topAutores.length === 0 && <p className="vacio">Todavía no hay autores cargados.</p>}
          {stats.topAutores.map(([nombre, cantidad]) => (
            <BarraRanking key={nombre} nombre={nombre} cantidad={cantidad} max={maxAutor} />
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricaCard({ valor, etiqueta }) {
  return (
    <div className="metrica-card">
      <span className="metrica-valor">{valor}</span>
      <span className="metrica-etiqueta">{etiqueta}</span>
    </div>
  )
}

function BarraRanking({ nombre, cantidad, max }) {
  const porcentaje = Math.max(6, Math.round((cantidad / max) * 100))
  return (
    <div className="barra-ranking">
      <div className="barra-ranking-cabecera">
        <span>{nombre}</span>
        <span>{cantidad}</span>
      </div>
      <div className="barra-fondo">
        <div className="barra-relleno" style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  )
}
