// Estado vacío reutilizable para páginas/secciones sin datos todavía.
// `icono` acepta un emoji o cualquier nodo JSX (no dependemos de ninguna
// librería de íconos para mantener el bundle liviano).
export default function EmptyState({ icono, titulo, descripcion, accion }) {
  return (
    <div className="empty-state">
      {icono && <div className="empty-state-icono" aria-hidden="true">{icono}</div>}
      <h3>{titulo}</h3>
      {descripcion && <p>{descripcion}</p>}
      {accion && <div className="empty-state-accion">{accion}</div>}
    </div>
  )
}
