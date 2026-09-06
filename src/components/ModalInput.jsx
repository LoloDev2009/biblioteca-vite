import { useEffect, useRef } from 'react'

// Modal para pedir un dato de texto: reemplaza progresivamente los usos
// de window.prompt() en toda la app (renombrar perfil, estante al mover
// de wishlist al catálogo, nombre de quien se lleva un libro prestado, etc).
export default function ModalInput({
  abierto,
  titulo,
  descripcion,
  label,
  valor,
  placeholder,
  onChange,
  onCancelar,
  onConfirmar,
  textoCancelar = 'Cancelar',
  textoConfirmar = 'Confirmar',
  loading = false,
  error = null,
  requerido = true,
}) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (!abierto) return
    const id = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(id)
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !loading) onCancelar?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [abierto, loading, onCancelar])

  if (!abierto) return null

  function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    if (requerido && !valor?.trim()) return
    onConfirmar?.()
  }

  return (
    <div className="modal-overlay" onClick={() => !loading && onCancelar?.()}>
      <form
        className="modal-caja"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-input-titulo"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h3 id="modal-input-titulo">{titulo}</h3>
        {descripcion && <p>{descripcion}</p>}
        <label className="modal-input-label">
          {label}
          <input
            ref={inputRef}
            type="text"
            value={valor ?? ''}
            placeholder={placeholder}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={loading}
          />
        </label>
        {error && <p className="error modal-input-error">{error}</p>}
        <div className="modal-acciones">
          <button type="button" className="btn-secundario" onClick={onCancelar} disabled={loading}>
            {textoCancelar}
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Un momento...' : textoConfirmar}
          </button>
        </div>
      </form>
    </div>
  )
}
