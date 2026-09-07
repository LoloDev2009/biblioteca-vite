import { useState } from 'react'
import { enviarMagicLink, registrarseConPassword, iniciarSesionConPassword } from '../lib/auth'

// Estados de la pantalla: 'elegir' es la decisión inicial (¿ya tenés cuenta
// o querés crear una?). El resto son las tres formas de autenticarse.
// El link mágico existe como alternativa secundaria dentro de "entrar", no
// como opción principal, para no competir visualmente con usuario/contraseña.
export default function Login() {
  const [vista, setVista] = useState('elegir') // 'elegir' | 'entrar' | 'crear' | 'magic'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [error, setError] = useState(null)

  function irA(nuevaVista) {
    setVista(nuevaVista)
    setMensaje(null)
    setError(null)
    setPassword('')
    setConfirmarPassword('')
  }

  async function handleEntrar(e) {
    e.preventDefault()
    if (!email.trim() || !password || cargando) return
    setCargando(true)
    setError(null)
    try {
      await iniciarSesionConPassword(email, password)
      // Si sale bien, el cambio de sesión lo detecta AuthContext y App deja
      // de mostrar el login solo: no hace falta redirigir a mano acá.
    } catch (err) {
      console.error('handleEntrar (Login):', err)
      if (err.code === 'email_not_confirmed') {
        setError('Todavía no confirmaste tu mail. Revisá tu bandeja de entrada y tocá el enlace que te mandamos.')
      } else {
        setError('Mail o contraseña incorrectos.')
      }
    } finally {
      setCargando(false)
    }
  }

  async function handleCrear(e) {
    e.preventDefault()
    if (!email.trim() || !password || cargando) return
    if (password !== confirmarPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setCargando(true)
    setError(null)
    try {
      await registrarseConPassword(email, password)
      setMensaje('Cuenta creada. Si te pedimos confirmar el mail, revisalo antes de entrar.')
    } catch (err) {
      console.error('handleCrear (Login):', err)
      setError('No pudimos crear la cuenta. Probá con otro mail o una contraseña de al menos 6 caracteres.')
    } finally {
      setCargando(false)
    }
  }

  async function handleMagicLink(e) {
    e.preventDefault()
    if (!email.trim() || cargando) return
    setCargando(true)
    setError(null)
    try {
      await enviarMagicLink(email)
      setMensaje('Te mandamos un enlace a tu mail. Abrilo desde este mismo dispositivo para entrar.')
    } catch (err) {
      console.error('handleMagicLink (Login):', err)
      setError('No pudimos enviar el enlace. Revisá el mail e intentá de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="pantalla-login">
      <div className="card-login">
        <h1>Mi Biblioteca</h1>

        {vista === 'elegir' && (
          <>
            <p className="subtitulo-login">Tu biblioteca personal de libros.</p>
            <div className="opciones-elegir-login">
              <button type="button" onClick={() => irA('entrar')}>Iniciar sesión</button>
              <button type="button" className="btn-secundario" onClick={() => irA('crear')}>
                Crear una cuenta
              </button>
            </div>
          </>
        )}

        {vista !== 'elegir' && (
          <button type="button" className="link-inline volver-login" onClick={() => irA('elegir')}>
            ← Volver
          </button>
        )}

        {mensaje && <p className="mensaje-login exito">{mensaje}</p>}
        {error && <p className="mensaje-login error">{error}</p>}

        {vista === 'entrar' && (
          <form onSubmit={handleEntrar} className="form-login">
            <label>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vos@ejemplo.com"
                disabled={cargando}
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                disabled={cargando}
              />
            </label>
            <button type="submit" disabled={cargando}>
              {cargando ? 'Entrando...' : 'Iniciar sesión'}
            </button>
            <p className="opcion-secundaria-login">
              ¿Preferís no usar contraseña?{' '}
              <button type="button" className="link-inline" onClick={() => irA('magic')} disabled={cargando}>
                Recibir un enlace por email
              </button>
            </p>
            <p className="opcion-secundaria-login">
              ¿No tenés una cuenta?{' '}
              <button type="button" className="link-inline" onClick={() => irA('crear')} disabled={cargando}>
                Crear una
              </button>
            </p>
          </form>
        )}

        {vista === 'crear' && (
          <form onSubmit={handleCrear} className="form-login">
            <label>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vos@ejemplo.com"
                disabled={cargando}
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
                disabled={cargando}
              />
            </label>
            <label>
              Confirmar contraseña
              <input
                type="password"
                required
                minLength={6}
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Repetila"
                disabled={cargando}
              />
            </label>
            <button type="submit" disabled={cargando}>
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
            <p className="opcion-secundaria-login">
              ¿Ya tenés una cuenta?{' '}
              <button type="button" className="link-inline" onClick={() => irA('entrar')} disabled={cargando}>
                Iniciar sesión
              </button>
            </p>
          </form>
        )}

        {vista === 'magic' && (
          <form onSubmit={handleMagicLink} className="form-login">
            <p className="subtitulo-login subtitulo-chico">
              Te mandamos un enlace a tu email para entrar sin necesidad de contraseña.
            </p>
            <label>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vos@ejemplo.com"
                disabled={cargando}
              />
            </label>
            <button type="submit" disabled={cargando}>
              {cargando ? 'Enviando...' : 'Enviarme el enlace'}
            </button>
            <p className="opcion-secundaria-login">
              ¿Preferís usar contraseña?{' '}
              <button type="button" className="link-inline" onClick={() => irA('entrar')} disabled={cargando}>
                Iniciar sesión
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
