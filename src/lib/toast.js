// Sistema mínimo de notificaciones tipo toast. No depende de ninguna
// librería: cualquier parte de la app llama a toast('mensaje') y el
// <ToastHost /> montado una sola vez en App.jsx se encarga de mostrarlo.

const listeners = new Set()

export function toast(mensaje, tipo = 'exito') {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const evento = { id, mensaje, tipo }
  listeners.forEach((fn) => fn(evento))
}

// Helpers para no repetir el segundo argumento en cada llamado. La firma
// original toast(mensaje, tipo) sigue funcionando igual que antes.
toast.success = (mensaje) => toast(mensaje, 'exito')
toast.error = (mensaje) => toast(mensaje, 'error')
toast.info = (mensaje) => toast(mensaje, 'info')

export function suscribirseAToasts(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
