import { useEffect, useRef } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'

// Modal de confirmación genérico: reemplaza progresivamente los usos de
// window.confirm() en toda la app. Bloquea la interacción mientras
// `loading` es true, se cierra con Escape (salvo mientras carga), enfoca
// el botón de confirmar al abrirse y atrapa el Tab adentro del modal.
export default function ModalConfirmacion({
  abierto,
  titulo,
  descripcion,
  textoCancelar = 'Cancelar',
  textoConfirmar = 'Confirmar',
  variante = 'normal', // 'normal' | 'danger'
  loading = false,
  onCancelar,
  onConfirmar,
}) {
  const botonConfirmarRef = useRef(null)
  const contenedorRef = useFocusTrap(abierto)

  useEffect(() => {
    if (!abierto) return
    // Pequeño delay para que el elemento ya esté montado antes de enfocarlo.
    const id = setTimeout(() => botonConfirmarRef.current?.focus(), 0)
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

  return (
    <div className="modal-overlay" onClick={() => !loading && onCancelar?.()}>
      <div
        className="modal-caja"
        ref={contenedorRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-confirmacion-titulo"
        aria-describedby={descripcion ? 'modal-confirmacion-descripcion' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="modal-confirmacion-titulo">{titulo}</h3>
        {descripcion && <p id="modal-confirmacion-descripcion">{descripcion}</p>}
        <div className="modal-acciones">
          <button type="button" className="btn-secundario" onClick={onCancelar} disabled={loading}>
            {textoCancelar}
          </button>
          <button
            type="button"
            ref={botonConfirmarRef}
            className={variante === 'danger' ? 'btn-danger' : ''}
            onClick={onConfirmar}
            disabled={loading}
          >
            {loading ? 'Un momento...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
