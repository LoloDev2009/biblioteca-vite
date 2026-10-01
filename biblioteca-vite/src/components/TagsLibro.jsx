import { useEffect, useState } from 'react'
import { listarTags, listarTagsDeLibro, crearTag, agregarTagALibro, quitarTagDeLibro } from '../lib/tags'
import { toast } from '../lib/toast'

export default function TagsLibro({ libroId }) {
  const [tags, setTags] = useState([])
  const [todasLasTags, setTodasLasTags] = useState([])
  const [mostrarInput, setMostrarInput] = useState(false)
  const [nuevaTag, setNuevaTag] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargar()
    listarTags().then(setTodasLasTags).catch((err) => console.error('listarTags:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libroId])

  async function cargar() {
    try {
      setTags(await listarTagsDeLibro(libroId))
    } catch (err) {
      console.error('cargar (TagsLibro):', err)
      toast.error('No pudimos cargar las etiquetas.')
    }
  }

  async function handleAgregar(e) {
    e.preventDefault()
    if (!nuevaTag.trim() || guardando) return
    setGuardando(true)
    try {
      const tag = await crearTag(nuevaTag)
      if (tag) {
        await agregarTagALibro(libroId, tag.id)
        setNuevaTag('')
        setMostrarInput(false)
        await cargar()
        listarTags().then(setTodasLasTags).catch((err) => console.error('listarTags:', err))
      }
    } catch (err) {
      console.error('handleAgregar (TagsLibro):', err)
      toast.error('No pudimos agregar la etiqueta.')
    } finally {
      setGuardando(false)
    }
  }

  async function handleQuitar(tagId) {
    try {
      await quitarTagDeLibro(libroId, tagId)
      await cargar()
    } catch (err) {
      console.error('handleQuitar (TagsLibro):', err)
      toast.error('No pudimos quitar la etiqueta.')
    }
  }

  return (
    <div className="tags-libro">
      <h3>Etiquetas</h3>
      <div className="lista-tags">
        {tags.map((t) => (
          <span key={t.id} className="tag-pill">
            {t.nombre}
            <button type="button" onClick={() => handleQuitar(t.id)} aria-label={`Quitar etiqueta ${t.nombre}`}>
              ×
            </button>
          </span>
        ))}
        {!mostrarInput && (
          <button type="button" className="tag-agregar" onClick={() => setMostrarInput(true)}>
            + Agregar etiqueta
          </button>
        )}
      </div>
      {mostrarInput && (
        <form onSubmit={handleAgregar} className="form-tag">
          <input
            list="lista-todas-tags"
            autoFocus
            placeholder="favorito, para-leer..."
            value={nuevaTag}
            onChange={(e) => setNuevaTag(e.target.value)}
            disabled={guardando}
            onBlur={() => {
              if (!nuevaTag.trim()) setMostrarInput(false)
            }}
          />
          <datalist id="lista-todas-tags">
            {todasLasTags.map((t) => (
              <option key={t.id} value={t.nombre} />
            ))}
          </datalist>
          <button type="submit" disabled={guardando}>{guardando ? 'Agregando...' : 'Agregar'}</button>
        </form>
      )}
    </div>
  )
}
