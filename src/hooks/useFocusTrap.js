import { useEffect, useRef } from 'react'

// Atrapa la navegación por teclado (Tab / Shift+Tab) dentro del elemento
// referenciado mientras `activo` es true, para que no se pueda tabular
// hacia el contenido de fondo mientras un modal está abierto. Devuelve el
// ref que hay que poner en el contenedor del modal (la "caja", no el overlay).
export function useFocusTrap(activo) {
  const contenedorRef = useRef(null)

  useEffect(() => {
    if (!activo) return

    function handleKeyDown(e) {
      if (e.key !== 'Tab' || !contenedorRef.current) return

      const focusables = contenedorRef.current.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
      )
      if (focusables.length === 0) return

      const primero = focusables[0]
      const ultimo = focusables[focusables.length - 1]

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activo])

  return contenedorRef
}
