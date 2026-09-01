import { useEffect, useState } from 'react'
import { listarTags, listarTagsDeLibro, crearTag, agregarTagALibro, quitarTagDeLibro } from '../lib/tags'

export default function TagsLibro({ libroId }) {
  const [tags, setTags] = useState([])
  const [todasLasTags, setTodasLasTags] = useState([])
  const [mostrarInput, setMostrarInput] = useState(false)
  const [nuevaTag, setNuevaTag] = useState('')

  useEffect(() => {
    cargar()
    listarTags().then(setTodasLasTags)
  }, [libroId])

  async function cargar() {
    setTags(await listarTagsDeLibro(libroId))
  }

  async function handleAgregar(e) {
    e.preventDefault()
    if (!nuevaTag.trim()) return
    const tag = await crearTag(nuevaTag)
    if (tag) {
      await agregarTagALibro(libroId, tag.id)
      setNuevaTag('')
      setMostrarInput(false)
      cargar()
      listarTags().then(setTodasLasTags)
    }
  }

  async function handleQuitar(tagId) {
    await quitarTagDeLibro(libroId, tagId)
    cargar()
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
            onBlur={() => {
              if (!nuevaTag.trim()) setMostrarInput(false)
            }}
          />
          <datalist id="lista-todas-tags">
            {todasLasTags.map((t) => (
              <option key={t.id} value={t.nombre} />
            ))}
          </datalist>
          <button type="submit">Agregar</button>
        </form>
      )}
    </div>
  )
}
