import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buscarPorIsbn } from '../lib/openLibrary'
import { crearLibro } from '../lib/libros'

const LIBRO_VACIO = {
  titulo: '',
  autor: '',
  portada_url: '',
  genero: '',
  isbn: '',
  estante: '',
  editorial: '',
  leido: false,
}

export default function AgregarLibro() {
  const navigate = useNavigate()
  const [isbn, setIsbn] = useState('')
  const [form, setForm] = useState(LIBRO_VACIO)
  const [buscando, setBuscando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function handleBuscarIsbn() {
    if (!isbn.trim()) return
    setBuscando(true)
    setMensaje(null)
    try {
      const datos = await buscarPorIsbn(isbn.trim())
      if (datos) {
        setForm({ ...LIBRO_VACIO, ...datos })
        setMensaje('Datos encontrados. Revisá y completá lo que falte.')
      } else {
        setForm({ ...LIBRO_VACIO, isbn: isbn.trim() })
        setMensaje('No se encontró en Open Library. Completá los datos a mano.')
      }
    } catch (e) {
      setMensaje('Error consultando la API. Completá los datos a mano.')
    } finally {
      setBuscando(false)
    }
  }

  function handleChange(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleGuardar(e) {
    e.preventDefault()
    if (!form.titulo.trim()) {
      setMensaje('El título es obligatorio.')
      return
    }
    setGuardando(true)
    try {
      await crearLibro(form)
      navigate('/')
    } catch (e) {
      setMensaje('No se pudo guardar el libro.')
    } finally {
      setGuardando(false)
    }
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
        <button type="button" onClick={handleBuscarIsbn} disabled={buscando}>
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {mensaje && <p className="mensaje">{mensaje}</p>}

      <form onSubmit={handleGuardar} className="form-libro">
        <label>
          Título *
          <input value={form.titulo} onChange={(e) => handleChange('titulo', e.target.value)} required />
        </label>
        <label>
          Autor
          <input value={form.autor} onChange={(e) => handleChange('autor', e.target.value)} />
        </label>
        <label>
          Portada (URL)
          <input value={form.portada_url} onChange={(e) => handleChange('portada_url', e.target.value)} />
        </label>
        <label>
          Género
          <input value={form.genero} onChange={(e) => handleChange('genero', e.target.value)} />
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

        {form.portada_url && (
          <img className="preview-portada" src={form.portada_url} alt="preview" />
        )}

        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar libro'}
        </button>
      </form>
    </div>
  )
}
