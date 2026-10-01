// Convierte y valida ISBN-10 <-> ISBN-13 para poder detectar duplicados
// aunque el mismo libro esté cargado con el ISBN en formatos distintos.

export function limpiarIsbn(isbn) {
  return (isbn || '').replace(/[-\s]/g, '').toUpperCase()
}

export function isbn10a13(isbn10) {
  const limpio = limpiarIsbn(isbn10)
  if (limpio.length !== 10) return null
  const nucleo = '978' + limpio.slice(0, 9)
  let suma = 0
  for (let i = 0; i < 12; i++) {
    suma += Number(nucleo[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const digito = (10 - (suma % 10)) % 10
  return nucleo + digito
}

export function isbn13a10(isbn13) {
  const limpio = limpiarIsbn(isbn13)
  if (limpio.length !== 13 || !limpio.startsWith('978')) return null
  const nucleo = limpio.slice(3, 12)
  let suma = 0
  for (let i = 0; i < 9; i++) {
    suma += Number(nucleo[i]) * (10 - i)
  }
  const resto = (11 - (suma % 11)) % 11
  const digito = resto === 10 ? 'X' : String(resto)
  return nucleo + digito
}

// Devuelve todas las variantes (10 y 13 dígitos) de un ISBN, para poder
// buscar coincidencias sin importar en qué formato esté guardado el existente.
export function variantesIsbn(isbn) {
  const limpio = limpiarIsbn(isbn)
  if (!limpio) return []
  const variantes = new Set([limpio])
  if (limpio.length === 10) {
    const v13 = isbn10a13(limpio)
    if (v13) variantes.add(v13)
  } else if (limpio.length === 13) {
    const v10 = isbn13a10(limpio)
    if (v10) variantes.add(v10)
  }
  return [...variantes]
}
