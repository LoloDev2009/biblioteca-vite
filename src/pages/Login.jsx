import { useState } from 'react'
import { enviarMagicLink, registrarseConPassword, iniciarSesionConPassword } from '../lib/auth'

export default function Login() {
  const [modo, setModo] = useState('magic') // 'magic' | 'password'
  const [modoPassword, setModoPassword] = useState('entrar') // 'entrar' | 'crear'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [error, setError] = useState(null)

  async function handleMagicLink(e) {
    e.preventDefault()
    if (!email.trim()) return
    setCargando(true)
    setError(null)
    try {
      await enviarMagicLink(email)
      setMensaje('Te mandamos un link a tu mail. Abrilo desde este mismo dispositivo para entrar.')
    } catch (e) {
      setError('No se pudo enviar el link. Revisá el mail e intentá de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  async function handlePassword(e) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setCargando(true)
    setError(null)
    try {
      if (modoPassword === 'crear') {
        await registrarseConPassword(email, password)
        setMensaje('Cuenta creada. Si te pedimos confirmar el mail, revisalo antes de entrar.')
      } else {
        await iniciarSesionConPassword(email, password)
      }
    } catch (e) {
      setError(
        modoPassword === 'crear'
          ? 'No se pudo crear la cuenta. Probá con otro mail o una contraseña de al menos 6 caracteres.'
          : 'Mail o contraseña incorrectos.'
      )
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="pantalla-login">
      <div className="card-login">
        <h1>Mi Biblioteca</h1>

        <div className="tabs-login">
          <button type="button" className={modo === 'magic' ? 'activo' : ''} onClick={() => setModo('magic')}>
            Link mágico
          </button>
          <button type="button" className={modo === 'password' ? 'activo' : ''} onClick={() => setModo('password')}>
            Contraseña
          </button>
        </div>

        {mensaje && <p className="mensaje-login exito">{mensaje}</p>}
        {error && <p className="mensaje-login error">{error}</p>}

        {modo === 'magic' ? (
          <form onSubmit={handleMagicLink} className="form-login">
            <label>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vos@ejemplo.com"
              />
            </label>
            <button type="submit" disabled={cargando}>
              {cargando ? 'Enviando...' : 'Enviarme el link'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePassword} className="form-login">
            <label>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vos@ejemplo.com"
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mínimo 6 caracteres"
              />
            </label>
            <button type="submit" disabled={cargando}>
              {cargando ? 'Un momento...' : modoPassword === 'crear' ? 'Crear cuenta' : 'Entrar'}
            </button>
            <button
              type="button"
              className="btn-secundario"
              onClick={() => setModoPassword(modoPassword === 'crear' ? 'entrar' : 'crear')}
            >
              {modoPassword === 'crear' ? '¿Ya tenés cuenta? Entrar' : '¿No tenés cuenta? Crear una'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
