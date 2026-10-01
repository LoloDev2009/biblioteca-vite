// Página estática de ayuda: guía rápida de cómo usar la app, pensada para
// quien no la usa técnicamente (familia). No depende de ningún dato de
// Supabase, así que no necesita loading/error states.
const TEMAS = [
  {
    icono: '🧑‍🤝‍🧑',
    titulo: '¿Qué son los perfiles de lectura?',
    texto:
      'Los perfiles (por ejemplo "Mamá", "Papá" o el tuyo) no son cuentas separadas: son simples ' +
      'etiquetas dentro de tu cuenta para saber quién leyó cada libro. No tienen contraseña ni se ' +
      'loguean por su cuenta. Los creás y administrás vos desde "Perfiles" en el menú.',
  },
  {
    icono: '➕',
    titulo: 'Cómo agregar un libro',
    texto:
      'Desde "Agregar libro" podés escribir el ISBN a mano o tocar "📷 Escanear" para usar la cámara. ' +
      'Si lo encuentra en Open Library, completa título, autor, portada y otros datos solo — revisás y ' +
      'completás lo que falte antes de guardar. Si no lo encuentra, se carga todo a mano.',
  },
  {
    icono: '✓',
    titulo: 'Cómo marcar que leíste un libro',
    texto:
      'Entrá a la ficha del libro y mirá la sección "¿Quién lo leyó?". Ahí tocás el nombre de cada ' +
      'perfil para marcar que esa persona lo leyó, con su propia puntuación y reseña. No existe un ' +
      '"leído" general del libro: cada perfil lleva su propio registro, por separado.',
  },
  {
    icono: '★',
    titulo: 'Favoritos',
    texto:
      'Desde el catálogo o la ficha del libro podés marcarlo como favorito (la estrella), para ' +
      'encontrarlo rápido después con el filtro de favoritos.',
  },
  {
    icono: '📗',
    titulo: 'Préstamos',
    texto:
      'Cuando le prestás un libro a alguien, anotá su nombre desde el catálogo o la ficha del libro. ' +
      'Mientras esté prestado no se puede eliminar. Cuando te lo devuelvan, tocá "Marcar devuelto" y ' +
      'vuelve a estar disponible.',
  },
  {
    icono: '💫',
    titulo: 'Wishlist',
    texto:
      'Es la lista de libros que todavía no tenés pero querés conseguir. Cuando por fin lo conseguís, ' +
      'tocá "Ya lo tengo" y pasa automáticamente a tu catálogo, sin tener que cargarlo de nuevo.',
  },
  {
    icono: '🗄️',
    titulo: 'Estantes y sagas',
    texto:
      '"Estantes" agrupa tus libros según el estante donde los guardás en casa. "Sagas" agrupa los ' +
      'libros que forman parte de una misma colección, en orden, y muestra cuántos de cada una ya leíste.',
  },
  {
    icono: '📊',
    titulo: 'Estadísticas',
    texto:
      'Mostrás cuántos libros tenés en total, cuántos leyó cada perfil, puntuación promedio, páginas ' +
      'leídas, y los géneros/autores más frecuentes en tu biblioteca.',
  },
  {
    icono: '🔍',
    titulo: 'Buscar y filtrar',
    texto:
      'Desde el catálogo podés buscar por título, autor, ISBN, saga, género, idioma o notas, sin ' +
      'importar mayúsculas ni acentos, y combinarlo con filtros de estante, lectura, préstamo o favoritos.',
  },
]

export default function Ayuda() {
  return (
    <div className="pagina-ayuda">
      <h2>Ayuda</h2>
      <p className="ayuda-intro">Guía rápida de cómo usar Mi Biblioteca.</p>

      <div className="tarjeta-ayuda">
        {TEMAS.map((tema) => (
          <section key={tema.titulo} className="tema-ayuda">
            <h3><span aria-hidden="true">{tema.icono}</span> {tema.titulo}</h3>
            <p>{tema.texto}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
