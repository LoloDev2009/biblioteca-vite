import { useEffect, useState } from 'react'
import { suscribirseAToasts } from '../lib/toast'

const DURACION_MS = 3000

export default function ToastHost() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    return suscribirseAToasts((evento) => {
      setToasts((prev) => [...prev, evento])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== evento.id))
      }, DURACION_MS)
    })
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tipo}`}>
          {t.mensaje}
        </div>
      ))}
    </div>
  )
}
