import { useState, lazy, Suspense } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { buscarPorIsbn } from '../lib/openLibrary'
import { crearLibro, buscarPosiblesDuplicados } from '../lib/libros'
import { toast } from '../lib/toast'
import { LoadingSeccion } from '../components/Loading.jsx'
import FormLibro from '../components/FormLibro.jsx'

// html5-qrcode pesa varios MB; se carga solo cuando el usuario abre el
// scanner (no en cada visita a "Agregar libro").
const ScannerIsbn = lazy(() => import('../components/ScannerIsbn.jsx'))

const LIBRO_VACIO = {
  titulo: '',
  autor: '',
  portada_url: '',
  genero: '',
  isbn: '',
  estante: '',
  editorial: '',
  favorito: false,
  saga: '',
  numero_saga: '',
  anio_publicacion: '',
  idioma: '',
  paginas: '',
  ejemplares_totales: '',
  descripcion: '',
  notas: '',
}

export default function AgregarLibro() {
  const navigate = useNavigate()
  const [isbn, setIsbn] = useState('')
  const [form, setForm] = useState(LIBRO_VACIO)
  const [buscando, setBuscando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mostrarScanner, setMostrarScanner] = useState(false)
  const [duplicados, setDuplicados] = useState([])
  const [verificandoDup, setVerificandoDup] = useState(false)

  async function handleBuscarIsbn(codigoManual) {
    const codigo = (codigoManual ?? isbn).trim()
    if (!codigo) return
    setBuscando(true)
    setMensaje(null)
    try {
      const datos = await buscarPorIsbn(codigo)
      if (datos) {
        setForm({ ...LIBRO_VACIO, ...datos })
        setIsbn(codigo)
        setMensaje('Datos encontrados. Revisá y completá lo que falte.')
      } else {
        setForm({ ...LIBRO_VACIO, isbn: codigo })
        setIsbn(codigo)
        setMensaje('No se encontró en Open Library. Completá los datos a mano.')
      }
    } catch (err) {
      console.error('handleBuscarIsbn:', err)
      setMensaje('No pudimos consultar Open Library. Completá los datos a mano.')
    } finally {
      setBuscando(false)
    }
  }

  function handleIsbnEscaneado(codigo) {
    setMostrarScanner(false)
    handleBuscarIsbn(codigo)
  }

  function handleChange(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (guardando || verificandoDup) return
    if (!form.titulo.trim()) {
      setMensaje('El título es obligatorio.')
      return
    }

    setVerificandoDup(true)
    try {
      const posibles = await buscarPosiblesDuplicados({ isbn: form.isbn, titulo: form.titulo, autor: form.autor })
      if (posibles.length > 0) {
        setDuplicados(posibles)
        return // corta acá y espera que el usuario confirme si quiere seguir igual
      }
    } catch (err) {
      console.error('buscarPosiblesDuplicados:', err)
      toast.error('No pudimos verificar duplicados. Intentá de nuevo.')
      return
    } finally {
      setVerificandoDup(false)
    }

    await guardarLibro()
  }

  async function guardarLibro() {
    setGuardando(true)
    try {
      await crearLibro({
        ...form,
        anio_publicacion: form.anio_publicacion === '' ? null : Number(form.anio_publicacion),
        paginas: form.paginas === '' ? null : Number(form.paginas),
        ejemplares_totales: form.ejemplares_totales === '' ? null : Number(form.ejemplares_totales),
        numero_saga: form.numero_saga === '' ? null : Number(form.numero_saga),
      })
      navigate('/')
      toast.success('Libro agregado.')
    } catch (err) {
      console.error('guardarLibro:', err)
      setMensaje('No pudimos guardar el libro.')
      toast.error('No pudimos guardar el libro.')
    } finally {
      setGuardando(false)
    }
  }

  function handleAgregarIgual() {
    setDuplicados([])
    guardarLibro()
  }

  return (
    <div className="agregar-libro">
      <h2>Agregar libro</h2>

      <div className="buscar-isbn">
        <input
          type="text"
          placeholder="Escaneá o escribí el ISBN"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
        />
        <button type="button" onClick={() => handleBuscarIsbn()} disabled={buscando}>
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
        <button
          type="button"
          className="btn-secundario btn-escanear"
          onClick={() => setMostrarScanner(true)}
        >
          📷 Escanear
        </button>
      </div>

      {mostrarScanner && (
        <Suspense fallback={<LoadingSeccion texto="Cargando escáner..." />}>
          <ScannerIsbn onDetectado={handleIsbnEscaneado} onCerrar={() => setMostrarScanner(false)} />
        </Suspense>
      )}

      {mensaje && <p className="mensaje">{mensaje}</p>}

      <form onSubmit={handleSubmit} className="form-libro">
        <FormLibro form={form} onChange={handleChange} legendMasDetalles="Más detalles (opcional)" />

        {duplicados.length > 0 && (
          <div className="aviso-duplicados">
            <p><strong>Este libro ya existe en tu biblioteca:</strong></p>
            <ul>
              {duplicados.map((d) => (
                <li key={d.id}>
                  <Link to={`/libro/${d.id}`} target="_blank">
                    {d.titulo}{d.autor ? ` — ${d.autor}` : ''}{d.isbn ? ` (ISBN ${d.isbn})` : ''}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="acciones-form">
              <button type="button" onClick={handleAgregarIgual}>Agregar de todas formas</button>
              <button type="button" className="btn-secundario" onClick={() => setDuplicados([])}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        <button type="submit" disabled={guardando || verificandoDup}>
          {verificandoDup ? 'Verificando...' : guardando ? 'Guardando...' : 'Guardar libro'}
        </button>
      </form>
    </div>
  )
}
