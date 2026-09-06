// Estados de carga reutilizables. Los skeletons específicos del catálogo
// (SkeletonCatalogo en Catalogo.jsx) se mantienen tal cual porque ya
// representan bien la forma real del contenido; estos componentes cubren
// el resto de los casos: carga global de página y carga de una sección.
export function LoadingPagina({ texto = 'Cargando...' }) {
  return (
    <div className="loading-pagina" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  )
}

export function LoadingSeccion({ texto = 'Cargando...' }) {
  return (
    <div className="loading-seccion" role="status" aria-live="polite">
      <span className="spinner spinner-chico" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  )
}

export default LoadingPagina
