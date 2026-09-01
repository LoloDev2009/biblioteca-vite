import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { buscarPorIsbn } from '../lib/openLibrary'
import { crearLibro, listarValoresFiltro, buscarPosiblesDuplicados } from '../lib/libros'
import ScannerIsbn from '../components/ScannerIsbn.jsx'

const LIBRO_VACIO = {
  titulo: '',
  autor: '',
  portada_url: '',
  genero: '',
  isbn: '',
  estante: '',
  editorial: '',
  leido: false,
  favorito: false,
  saga: '',
  numero_saga: '',
  anio_publicacion: '',
  idioma: '',
  paginas: '',
  ejemplares_totales: '',
  puntuacion: '',
  descripcion: '',
  resena: '',
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
  const [sugerencias, setSugerencias] = useState({ generos: [], autores: [], sagas: [], idiomas: [] })

  useEffect(() => {
    listarValoresFiltro().then((data) => {
      setSugerencias({
        generos: [...new Set(data.map((l) => l.genero).filter(Boolean))].sort(),
        autores: [...new Set(data.map((l) => l.autor).filter(Boolean))].sort(),
        sagas: [...new Set(data.map((l) => l.saga).filter(Boolean))].sort(),
        idiomas: [...new Set(data.map((l) => l.idioma).filter(Boolean))].sort(),
      })
    })
  }, [])

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
    } catch (e) {
      setMensaje('Error consultando la API. Completá los datos a mano.')
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
    if (!form.titulo.trim()) {
      setMensaje('El título es obligatorio.')
      return
    }

    setVerificandoDup(true)
    const posibles = await buscarPosiblesDuplicados({ isbn: form.isbn, titulo: form.titulo, autor: form.autor })
    setVerificandoDup(false)

    if (posibles.length > 0) {
      setDuplicados(posibles)
      return // corta acá y espera que el usuario confirme si quiere seguir igual
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
        puntuacion: form.puntuacion === '' ? null : Number(form.puntuacion),
        numero_saga: form.numero_saga === '' ? null : Number(form.numero_saga),
      })
      navigate('/')
    } catch (e) {
      setMensaje('No se pudo guardar el libro.')
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
        <ScannerIsbn onDetectado={handleIsbnEscaneado} onCerrar={() => setMostrarScanner(false)} />
      )}

      {mensaje && <p className="mensaje">{mensaje}</p>}

      <form onSubmit={handleSubmit} className="form-libro">
        <label>
          Título *
          <input value={form.titulo} onChange={(e) => handleChange('titulo', e.target.value)} required />
        </label>
        <label>
          Autor
          <input
            list="lista-autores"
            value={form.autor}
            onChange={(e) => handleChange('autor', e.target.value)}
          />
        </label>
        <label>
          Portada (URL)
          <input value={form.portada_url} onChange={(e) => handleChange('portada_url', e.target.value)} />
        </label>
        <label>
          Género
          <input
            list="lista-generos"
            value={form.genero}
            onChange={(e) => handleChange('genero', e.target.value)}
          />
        </label>
        <label>
          Editorial
          <input value={form.editorial} onChange={(e) => handleChange('editorial', e.target.value)} />
        </label>
        <label>
          ISBN
          <input value={form.isbn} onChange={(e) => handleChange('isbn', e.target.value)} />
        </label>
        <label>
          Estante
          <input value={form.estante} onChange={(e) => handleChange('estante', e.target.value)} />
        </label>
        <label className="check-leido">
          <input
            type="checkbox"
            checked={form.leido}
            onChange={(e) => handleChange('leido', e.target.checked)}
          />
          Ya lo leí
        </label>
        <label className="check-leido">
          <input
            type="checkbox"
            checked={form.favorito}
            onChange={(e) => handleChange('favorito', e.target.checked)}
          />
          ★ Favorito
        </label>

        {form.portada_url && (
          <img className="preview-portada" src={form.portada_url} alt="preview" />
        )}

        <fieldset className="fieldset-extra">
          <legend>Más detalles (opcional)</legend>

          <div className="fila-2">
            <label>
              Saga
              <input
                list="lista-sagas"
                value={form.saga}
                onChange={(e) => handleChange('saga', e.target.value)}
              />
            </label>
            <label>
              N° en la saga
              <input
                type="number"
                step="0.5"
                value={form.numero_saga}
                onChange={(e) => handleChange('numero_saga', e.target.value)}
              />
            </label>
          </div>
          <div className="fila-2">
            <label>
              Año de publicación
              <input
                type="number"
                value={form.anio_publicacion}
                onChange={(e) => handleChange('anio_publicacion', e.target.value)}
              />
            </label>
            <label>
              Idioma
              <input
                list="lista-idiomas"
                value={form.idioma}
                onChange={(e) => handleChange('idioma', e.target.value)}
              />
            </label>
          </div>
          <div className="fila-2">
            <label>
              Páginas
              <input
                type="number"
                value={form.paginas}
                onChange={(e) => handleChange('paginas', e.target.value)}
              />
            </label>
            <label>
              Ejemplares
              <input
                type="number"
                value={form.ejemplares_totales}
                onChange={(e) => handleChange('ejemplares_totales', e.target.value)}
              />
            </label>
          </div>
          <label>
            Puntuación (0 a 5)
            <input
              type="number"
              min="0"
              max="5"
              step="0.5"
              value={form.puntuacion}
              onChange={(e) => handleChange('puntuacion', e.target.value)}
            />
          </label>
          <label>
            Descripción
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
            />
          </label>
          <label>
            Mi reseña
            <textarea
              rows={3}
              value={form.resena}
              onChange={(e) => handleChange('resena', e.target.value)}
            />
          </label>
          <label>
            Notas
            <textarea
              rows={2}
              value={form.notas}
              onChange={(e) => handleChange('notas', e.target.value)}
            />
          </label>
        </fieldset>

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

      <datalist id="lista-autores">
        {sugerencias.autores.map((a) => <option key={a} value={a} />)}
      </datalist>
      <datalist id="lista-generos">
        {sugerencias.generos.map((g) => <option key={g} value={g} />)}
      </datalist>
      <datalist id="lista-sagas">
        {sugerencias.sagas.map((s) => <option key={s} value={s} />)}
      </datalist>
      <datalist id="lista-idiomas">
        {sugerencias.idiomas.map((i) => <option key={i} value={i} />)}
      </datalist>
    </div>
  )
}
