import { useEffect, useState } from 'react'
import { listarValoresFiltro } from '../lib/libros'

// Campos comunes entre AgregarLibro y EditarLibro. No es un <form> en sí
// mismo: cada página sigue teniendo su propio <form onSubmit=...>, sus
// propios botones y su propia lógica de guardado — esto solo evita
// duplicar los <label>/<input> y el fetch de sugerencias para los
// <datalist> de autocompletado, que eran idénticos en ambas páginas.
//
// mostrarFavorito/mostrarNotas existen para reproducir una diferencia real
// que ya tenía la app: EditarLibro nunca mostró el checkbox de favorito ni
// el campo de notas en su formulario (aunque sí los guarda si ya venían
// cargados). No es un descuido de este refactor, es el comportamiento de
// siempre.
export default function FormLibro({
  form,
  onChange,
  mostrarFavorito = true,
  mostrarNotas = true,
  legendMasDetalles = 'Más detalles',
}) {
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

  return (
    <>
      <label>
        Título *
        <input value={form.titulo ?? ''} onChange={(e) => onChange('titulo', e.target.value)} required />
      </label>
      <label>
        Autor
        <input
          list="lista-autores"
          value={form.autor ?? ''}
          onChange={(e) => onChange('autor', e.target.value)}
        />
      </label>
      <label>
        Portada (URL)
        <input value={form.portada_url ?? ''} onChange={(e) => onChange('portada_url', e.target.value)} />
      </label>
      <label>
        Género
        <input
          list="lista-generos"
          value={form.genero ?? ''}
          onChange={(e) => onChange('genero', e.target.value)}
        />
      </label>
      <label>
        Editorial
        <input value={form.editorial ?? ''} onChange={(e) => onChange('editorial', e.target.value)} />
      </label>
      <label>
        ISBN
        <input value={form.isbn ?? ''} onChange={(e) => onChange('isbn', e.target.value)} />
      </label>
      <label>
        Estante
        <input value={form.estante ?? ''} onChange={(e) => onChange('estante', e.target.value)} />
      </label>

      {mostrarFavorito && (
        <>
          <label className="check-leido">
            <input
              type="checkbox"
              checked={!!form.favorito}
              onChange={(e) => onChange('favorito', e.target.checked)}
            />
            ★ Favorito
          </label>
          <p className="ayuda-form">
            Después de guardar, marcá quién lo leyó (y su puntuación/reseña) desde la ficha del libro.
          </p>
        </>
      )}

      {form.portada_url && (
        <img className="preview-portada" src={form.portada_url} alt="preview" />
      )}

      <fieldset className="fieldset-extra">
        <legend>{legendMasDetalles}</legend>

        <div className="fila-2">
          <label>
            Saga
            <input
              list="lista-sagas"
              value={form.saga ?? ''}
              onChange={(e) => onChange('saga', e.target.value)}
            />
          </label>
          <label>
            N° en la saga
            <input
              type="number"
              step="0.5"
              value={form.numero_saga ?? ''}
              onChange={(e) => onChange('numero_saga', e.target.value)}
            />
          </label>
        </div>
        <div className="fila-2">
          <label>
            Año de publicación
            <input
              type="number"
              value={form.anio_publicacion ?? ''}
              onChange={(e) => onChange('anio_publicacion', e.target.value)}
            />
          </label>
          <label>
            Idioma
            <input
              list="lista-idiomas"
              value={form.idioma ?? ''}
              onChange={(e) => onChange('idioma', e.target.value)}
            />
          </label>
        </div>
        <div className="fila-2">
          <label>
            Páginas
            <input
              type="number"
              value={form.paginas ?? ''}
              onChange={(e) => onChange('paginas', e.target.value)}
            />
          </label>
          <label>
            Ejemplares
            <input
              type="number"
              value={form.ejemplares_totales ?? ''}
              onChange={(e) => onChange('ejemplares_totales', e.target.value)}
            />
          </label>
        </div>
        <label>
          Descripción
          <textarea
            rows={3}
            value={form.descripcion ?? ''}
            onChange={(e) => onChange('descripcion', e.target.value)}
          />
        </label>
        {mostrarNotas && (
          <label>
            Notas
            <textarea
              rows={2}
              value={form.notas ?? ''}
              onChange={(e) => onChange('notas', e.target.value)}
            />
          </label>
        )}
      </fieldset>

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
    </>
  )
}
