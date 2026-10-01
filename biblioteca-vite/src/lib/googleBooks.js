// Consulta Google Books API por ISBN y devuelve los datos normalizados
// al formato de nuestra tabla `libros`. Los campos que la API no
// devuelva quedan como null para completar a mano.
export async function buscarPorIsbn(isbn) {
  const isbnLimpio = isbn.replace(/[-\s]/g, '')
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbnLimpio}`

  const res = await fetch(url)
  if (!res.ok) throw new Error('Error consultando Google Books')

  const data = await res.json()
  if (!data.items || data.items.length === 0) {
    return null // No se encontró nada, se completa todo a mano
  }

  const info = data.items[0].volumeInfo

  return {
    titulo: info.title || '',
    autor: info.authors ? info.authors.join(', ') : '',
    portada_url: info.imageLinks?.thumbnail?.replace('http://', 'https://') || '',
    genero: info.categories ? info.categories[0] : '',
    isbn: isbnLimpio,
    editorial: info.publisher || '',
    estante: '', // Google Books no tiene esto, siempre se completa a mano
  }
}
