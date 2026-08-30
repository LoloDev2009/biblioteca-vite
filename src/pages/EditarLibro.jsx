import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obtenerLibro, actualizarLibro } from '../lib/libros'

export default function EditarLibro() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    obtenerLibro(id).then(setForm).catch(() => setMensaje('No se pudo cargar el libro.'))
  }, [id])

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
      await actualizarLibro(id, {
        titulo: form.titulo,
        autor: form.autor,
        portada_url: form.portada_url,
        genero: form.genero,
        editorial: form.editorial,
        isbn: form.isbn,
        estante: form.estante,
        leido: form.leido,
        saga: form.saga || null,
        anio_publicacion: form.anio_publicacion === '' ? null : Number(form.anio_publicacion),
        idioma: form.idioma || null,
        paginas: form.paginas === '' ? null : Number(form.paginas),
        ejemplares_totales: form.ejemplares_totales === '' ? null : Number(form.ejemplares_totales),
        puntuacion: form.puntuacion === '' ? null : Number(form.puntuacion),
        descripcion: form.descripcion || null,
        resena: form.resena || null,
        notas: form.notas || null,
      })
      navigate(`/libro/${id}`)
    } catch (e) {
      setMensaje('No se pudo guardar el cambio.')
    } finally {
      setGuardando(false)
    }
  }

  if (!form) return <p>Cargando...</p>

  return (
    <div className="pagina-formulario">
      <h2>Editar libro</h2>
      {mensaje && <p className="mensaje">{mensaje}</p>}

      <form onSubmit={handleGuardar} className="form-libro">
        <label>
          Título *
          <input value={form.titulo} onChange={(e) => handleChange('titulo', e.target.value)} required />
        </label>
        <label>
          Autor
          <input value={form.autor || ''} onChange={(e) => handleChange('autor', e.target.value)} />
        </label>
        <label>
          Portada (URL)
          <input value={form.portada_url || ''} onChange={(e) => handleChange('portada_url', e.target.value)} />
        </label>
        <label>
          Género
          <input value={form.genero || ''} onChange={(e) => handleChange('genero', e.target.value)} />
        </label>
        <label>
          Editorial
          <input value={form.editorial || ''} onChange={(e) => handleChange('editorial', e.target.value)} />
        </label>
        <label>
          ISBN
          <input value={form.isbn || ''} onChange={(e) => handleChange('isbn', e.target.value)} />
        </label>
        <label>
          Estante
          <input value={form.estante || ''} onChange={(e) => handleChange('estante', e.target.value)} />
        </label>
        <label className="check-leido">
          <input
            type="checkbox"
            checked={!!form.leido}
            onChange={(e) => handleChange('leido', e.target.checked)}
          />
          Ya lo leí
        </label>

        {form.portada_url && <img className="preview-portada" src={form.portada_url} alt="preview" />}

        <fieldset className="fieldset-extra">
          <legend>Más detalles</legend>

          <label>
            Saga
            <input value={form.saga || ''} onChange={(e) => handleChange('saga', e.target.value)} />
          </label>
          <div className="fila-2">
            <label>
              Año de publicación
              <input
                type="number"
                value={form.anio_publicacion ?? ''}
                onChange={(e) => handleChange('anio_publicacion', e.target.value)}
              />
            </label>
            <label>
              Idioma
              <input value={form.idioma || ''} onChange={(e) => handleChange('idioma', e.target.value)} />
            </label>
          </div>
          <div className="fila-2">
            <label>
              Páginas
              <input
                type="number"
                value={form.paginas ?? ''}
                onChange={(e) => handleChange('paginas', e.target.value)}
              />
            </label>
            <label>
              Ejemplares
              <input
                type="number"
                value={form.ejemplares_totales ?? ''}
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
              value={form.puntuacion ?? ''}
              onChange={(e) => handleChange('puntuacion', e.target.value)}
            />
          </label>
          <label>
            Descripción
            <textarea
              rows={3}
              value={form.descripcion || ''}
              onChange={(e) => handleChange('descripcion', e.target.value)}
            />
          </label>
          <label>
            Mi reseña
            <textarea
              rows={3}
              value={form.resena || ''}
              onChange={(e) => handleChange('resena', e.target.value)}
            />
          </label>
          <label>
            Notas
            <textarea
              rows={2}
              value={form.notas || ''}
              onChange={(e) => handleChange('notas', e.target.value)}
            />
          </label>
        </fieldset>

        <div className="acciones-form">
          <button type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button type="button" className="btn-secundario" onClick={() => navigate(`/libro/${id}`)}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
