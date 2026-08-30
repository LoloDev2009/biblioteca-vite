import { useEffect, useState } from 'react'
import { listarWishlist, agregarAWishlist, eliminarDeWishlist, moverACatalogo } from '../lib/wishlist'
import { buscarPorIsbn } from '../lib/openLibrary'

const ITEM_VACIO = { titulo: '', autor: '', portada_url: '', genero: '', isbn: '', editorial: '', notas: '' }

export default function Wishlist() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(ITEM_VACIO)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [isbn, setIsbn] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setCargando(true)
    try {
      setItems(await listarWishlist())
    } finally {
      setCargando(false)
    }
  }

  async function handleBuscarIsbn() {
    if (!isbn.trim()) return
    setBuscando(true)
    try {
      const datos = await buscarPorIsbn(isbn.trim())
      if (datos) setForm({ ...ITEM_VACIO, ...datos })
    } finally {
      setBuscando(false)
    }
  }

  async function handleAgregar(e) {
    e.preventDefault()
    if (!form.titulo.trim()) return
    await agregarAWishlist(form)
    setForm(ITEM_VACIO)
    setIsbn('')
    setMostrarForm(false)
    cargar()
  }

  async function handleConseguido(item) {
    const estante = prompt(`¿En qué estante vas a poner "${item.titulo}"? (podés dejarlo vacío)`)
    await moverACatalogo(item, { estante: estante || '' })
    cargar()
  }

  async function handleEliminar(id) {
    if (!confirm('¿Sacar este libro de la wishlist?')) return
    await eliminarDeWishlist(id)
    cargar()
  }

  return (
    <div className="wishlist">
      <div className="header-seccion">
        <h2>Wishlist</h2>
        <button onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? 'Cancelar' : '+ Agregar deseado'}
        </button>
      </div>

      {mostrarForm && (
        <div className="form-wishlist-wrap">
          <div className="buscar-isbn">
            <input
              type="text"
              placeholder="ISBN (opcional, autocompleta)"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
            />
            <button type="button" onClick={handleBuscarIsbn} disabled={buscando}>
              {buscando ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          <form onSubmit={handleAgregar} className="form-libro">
            <label>
              Título *
              <input
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                required
              />
            </label>
            <label>
              Autor
              <input
                value={form.autor}
                onChange={(e) => setForm((f) => ({ ...f, autor: e.target.value }))}
              />
            </label>
            <label>
              Portada (URL)
              <input
                value={form.portada_url}
                onChange={(e) => setForm((f) => ({ ...f, portada_url: e.target.value }))}
              />
            </label>
            <label>
              Notas
              <input
                placeholder="Por qué lo querés, dónde lo viste..."
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              />
            </label>
            <button type="submit">Agregar a la wishlist</button>
          </form>
        </div>
      )}

      {cargando && <p>Cargando...</p>}
      {!cargando && items.length === 0 && (
        <p className="vacio">Todavía no agregaste nada. La próxima vez que se te antoje un libro, anotalo acá.</p>
      )}

      <div className="grid-wishlist">
        {items.map((item) => (
          <div key={item.id} className="card-wishlist">
            {item.portada_url ? (
              <img src={item.portada_url} alt={item.titulo} />
            ) : (
              <div className="sin-portada">Sin portada</div>
            )}
            <div className="info">
              <strong>{item.titulo}</strong>
              <span>{item.autor}</span>
              {item.notas && <span className="notas">"{item.notas}"</span>}
            </div>
            <div className="acciones-wishlist">
              <button onClick={() => handleConseguido(item)}>Ya lo tengo</button>
              <button className="btn-secundario" onClick={() => handleEliminar(item.id)}>Quitar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
