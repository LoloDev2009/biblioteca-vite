// Sistema mínimo de notificaciones tipo toast. No depende de ninguna
// librería: cualquier parte de la app llama a toast('mensaje') y el
// <ToastHost /> montado una sola vez en App.jsx se encarga de mostrarlo.

const listeners = new Set()

export function toast(mensaje, tipo = 'exito') {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const evento = { id, mensaje, tipo }
  listeners.forEach((fn) => fn(evento))
}

export function suscribirseAToasts(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
