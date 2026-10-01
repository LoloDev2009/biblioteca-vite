// Estado de error reutilizable para cuando falla una carga de datos.
// El error técnico real siempre debe loguearse con console.error() en el
// caller; acá solo mostramos un mensaje comprensible al usuario.
export default function ErrorState({
  titulo = 'No pudimos cargar los datos',
  descripcion = 'Ocurrió un problema al comunicarnos con la base de datos.',
  onRetry,
}) {
  return (
    <div className="error-state" role="alert">
      <h3>{titulo}</h3>
      {descripcion && <p>{descripcion}</p>}
      {onRetry && (
        <button type="button" className="btn-secundario" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}
