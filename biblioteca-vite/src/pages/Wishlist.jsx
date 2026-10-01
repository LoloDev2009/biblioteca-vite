import { useEffect, useState } from 'react'
import { listarWishlist, agregarAWishlist, eliminarDeWishlist, moverACatalogo } from '../lib/wishlist'
import { buscarPorIsbn } from '../lib/openLibrary'
import { toast } from '../lib/toast'
import ModalConfirmacion from '../components/ModalConfirmacion.jsx'
import ModalInput from '../components/ModalInput.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { LoadingPagina } from '../components/Loading.jsx'

const ITEM_VACIO = { titulo: '', autor: '', portada_url: '', genero: '', isbn: '', editorial: '', notas: '' }

export default function Wishlist() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(ITEM_VACIO)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [isbn, setIsbn] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [itemAConseguir, setItemAConseguir] = useState(null)
  const [estanteDestino, setEstanteDestino] = useState('')
  const [moviendo, setMoviendo] = useState(false)
  const [itemAEliminar, setItemAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      setItems(await listarWishlist())
    } catch (err) {
      console.error('cargar (Wishlist):', err)
      setError('No pudimos cargar tu wishlist.')
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
    } catch (err) {
      console.error('handleBuscarIsbn (Wishlist):', err)
      toast.error('No pudimos consultar Open Library.')
    } finally {
      setBuscando(false)
    }
  }

  async function handleAgregar(e) {
    e.preventDefault()
    if (!form.titulo.trim() || guardando) return
    setGuardando(true)
    try {
      await agregarAWishlist(form)
      setForm(ITEM_VACIO)
      setIsbn('')
      setMostrarForm(false)
      await cargar()
      toast.success('Agregado a la wishlist.')
    } catch (err) {
      console.error('handleAgregar (Wishlist):', err)
      toast.error('No pudimos agregarlo a la wishlist.')
    } finally {
      setGuardando(false)
    }
  }

  function handleConseguido(item) {
    setEstanteDestino('')
    setItemAConseguir(item)
  }

  async function confirmarConseguido() {
    setMoviendo(true)
    try {
      await moverACatalogo(itemAConseguir, { estante: estanteDestino || '' })
      setItemAConseguir(null)
      await cargar()
      toast.success('Libro movido al catálogo.')
    } catch (err) {
      console.error('confirmarConseguido:', err)
      toast.error('No pudimos mover el libro al catálogo.')
    } finally {
      setMoviendo(false)
    }
  }

  function handleEliminar(item) {
    setItemAEliminar(item)
  }

  async function confirmarEliminacion() {
    setEliminando(true)
    try {
      await eliminarDeWishlist(itemAEliminar.id)
      setItemAEliminar(null)
      await cargar()
      toast.success('Quitado de la wishlist.')
    } catch (err) {
      console.error('confirmarEliminacion (Wishlist):', err)
      toast.error('No pudimos quitarlo de la wishlist.')
    } finally {
      setEliminando(false)
    }
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
            <button type="submit" disabled={guardando}>{guardando ? 'Agregando...' : 'Agregar a la wishlist'}</button>
          </form>
        </div>
      )}

      {error && !cargando && <ErrorState descripcion={error} onRetry={cargar} />}

      {cargando && <LoadingPagina texto="Cargando wishlist..." />}

      {!cargando && !error && items.length === 0 && (
        <EmptyState
          icono="💫"
          titulo="Tu wishlist está vacía"
          descripcion="Agregá los libros que querés conseguir para no perderlos de vista."
          accion={
            !mostrarForm && (
              <button type="button" onClick={() => setMostrarForm(true)}>Agregá el primero</button>
            )
          }
        />
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
              <button className="btn-secundario" onClick={() => handleEliminar(item)}>Quitar</button>
            </div>
          </div>
        ))}
      </div>

      <ModalInput
        abierto={!!itemAConseguir}
        titulo="Mover al catálogo"
        descripcion={itemAConseguir ? `¿En qué estante vas a poner "${itemAConseguir.titulo}"? (podés dejarlo vacío)` : ''}
        label="Estante"
        valor={estanteDestino}
        placeholder="Ej: Biblioteca principal"
        onChange={setEstanteDestino}
        onCancelar={() => setItemAConseguir(null)}
        onConfirmar={confirmarConseguido}
        textoConfirmar="Agregar al catálogo"
        loading={moviendo}
        requerido={false}
      />

      <ModalConfirmacion
        abierto={!!itemAEliminar}
        titulo="Quitar de la wishlist"
        descripcion={itemAEliminar ? `¿Sacar "${itemAEliminar.titulo}" de la wishlist?` : ''}
        textoConfirmar="Quitar"
        variante="danger"
        loading={eliminando}
        onCancelar={() => setItemAEliminar(null)}
        onConfirmar={confirmarEliminacion}
      />
    </div>
  )
}
