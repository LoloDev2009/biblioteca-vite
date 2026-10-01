// Consulta Open Library por ISBN y devuelve los datos normalizados
// al formato de nuestra tabla `libros`. Los campos que la API no
// devuelva quedan como null para completar a mano.
// Open Library no requiere API key y no tiene cuota compartida global
// (a diferencia de Google Books sin key, que comparte límite con todo internet).
export async function buscarPorIsbn(isbn) {
  const isbnLimpio = isbn.replace(/[-\s]/g, '')
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbnLimpio}&format=json&jscmd=data`

  const res = await fetch(url)
  if (!res.ok) throw new Error('Error consultando Open Library')

  const data = await res.json()
  const info = data[`ISBN:${isbnLimpio}`]

  if (!info) {
    return null // No se encontró nada, se completa todo a mano
  }

  return {
    titulo: info.title || '',
    autor: info.authors ? info.authors.map((a) => a.name).join(', ') : '',
    portada_url: info.cover?.medium || info.cover?.large || '',
    genero: info.subjects ? info.subjects[0].name : '',
    isbn: isbnLimpio,
    editorial: info.publishers ? info.publishers[0].name : '',
    estante: '', // Open Library no tiene esto, siempre se completa a mano
  }
}
