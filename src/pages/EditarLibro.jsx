import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obtenerLibro, actualizarLibro, normalizarFormLibro } from '../lib/libros'
import { toast } from '../lib/toast'
import ErrorState from '../components/ErrorState.jsx'
import { LoadingPagina } from '../components/Loading.jsx'
import FormLibro from '../components/FormLibro.jsx'

export default function EditarLibro() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [errorCarga, setErrorCarga] = useState(null)

  useEffect(() => {
    cargarLibro()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function cargarLibro() {
    setErrorCarga(null)
    try {
      setForm(await obtenerLibro(id))
    } catch (err) {
      console.error('cargarLibro (EditarLibro):', err)
      setErrorCarga('No pudimos cargar este libro.')
    }
  }

  function handleChange(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleGuardar(e) {
    e.preventDefault()
    if (guardando) return
    if (!form.titulo.trim()) {
      setMensaje('El título es obligatorio.')
      return
    }
    setGuardando(true)
    try {
      const datos = normalizarFormLibro(form)
      await actualizarLibro(id, {
        titulo: datos.titulo,
        autor: datos.autor,
        portada_url: datos.portada_url,
        genero: datos.genero,
        editorial: datos.editorial,
        isbn: datos.isbn,
        estante: datos.estante,
        favorito: datos.favorito,
        saga: datos.saga,
        numero_saga: datos.numero_saga,
        anio_publicacion: datos.anio_publicacion,
        idioma: datos.idioma,
        paginas: datos.paginas,
        ejemplares_totales: datos.ejemplares_totales,
        descripcion: datos.descripcion,
        notas: datos.notas,
      })
      navigate(`/libro/${id}`)
      toast.success('Libro actualizado.')
    } catch (err) {
      console.error('handleGuardar (EditarLibro):', err)
      setMensaje('No pudimos guardar el cambio.')
      toast.error('No pudimos guardar el cambio.')
    } finally {
      setGuardando(false)
    }
  }

  if (errorCarga) return <ErrorState descripcion={errorCarga} onRetry={cargarLibro} />
  if (!form) return <LoadingPagina texto="Cargando libro..." />

  return (
    <div className="pagina-formulario">
      <h2>Editar libro</h2>
      {mensaje && <p className="mensaje">{mensaje}</p>}

      <form onSubmit={handleGuardar} className="form-libro">
        <FormLibro form={form} onChange={handleChange} mostrarFavorito={false} mostrarNotas={false} />

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
