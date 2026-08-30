// Importa los datos de tu base vieja (exportados a CSV) a la base nueva de Supabase.
// Ver scripts/README.md para las instrucciones completas paso a paso.
//
// Uso: node scripts/importar-datos-viejos.mjs

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en tu .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

function leerCsv(nombreArchivo) {
  const ruta = path.join(DATA_DIR, nombreArchivo)
  if (!fs.existsSync(ruta)) {
    console.error(`No encontré ${ruta}. Revisá el paso 2 de scripts/README.md`)
    process.exit(1)
  }
  const contenido = fs.readFileSync(ruta, 'utf-8')
  const { data, errors } = Papa.parse(contenido, { header: true, skipEmptyLines: true })
  if (errors.length) {
    console.warn(`Avisos parseando ${nombreArchivo}:`, errors.slice(0, 3))
  }
  return data
}

// Convierte '' (como viene un NULL en CSV) a null; deja el resto tal cual.
function limpio(valor) {
  return valor === '' || valor === undefined ? null : valor
}

function numero(valor) {
  const v = limpio(valor)
  return v === null ? null : Number(v)
}

async function main() {
  console.log('Leyendo CSVs...')
  const libros = leerCsv('libros.csv')
  const autores = leerCsv('autores.csv')
  const generos = leerCsv('generos.csv')
  const prestamos = leerCsv('prestamos.csv')

  const mapaAutores = new Map(autores.map((a) => [a.id, a.nombre]))
  const mapaGeneros = new Map(generos.map((g) => [g.id, g.nombre]))

  console.log(`Importando ${libros.length} libros...`)
  const mapaIds = {} // id viejo (de la base anterior) -> id nuevo (uuid en Supabase)
  let librosOk = 0
  let librosError = 0

  for (const fila of libros) {
    const tienePuntuacionOResena = limpio(fila.puntuacion) !== null || limpio(fila.resena) !== null

    const libroNuevo = {
      titulo: fila.titulo,
      autor: mapaAutores.get(fila.autor_id) || null,
      genero: mapaGeneros.get(fila.genero_id) || null,
      isbn: limpio(fila.isbn),
      editorial: limpio(fila.editorial),
      portada_url: limpio(fila.portada_url),
      estante: limpio(fila.ubicacion),
      leido: tienePuntuacionOResena,
      anio_publicacion: numero(fila.anio_publicacion),
      ejemplares_totales: numero(fila.ejemplares_totales),
      notas: limpio(fila.notas),
      descripcion: limpio(fila.descripcion),
      paginas: numero(fila.paginas),
      idioma: limpio(fila.idioma),
      saga: limpio(fila.saga),
      resena: limpio(fila.resena),
      puntuacion: numero(fila.puntuacion),
    }

    const { data, error } = await supabase.from('libros').insert(libroNuevo).select('id').single()

    if (error) {
      librosError++
      console.warn(`  ✗ No se pudo importar "${fila.titulo}": ${error.message}`)
      continue
    }

    mapaIds[fila.id] = data.id
    librosOk++
  }

  fs.writeFileSync(path.join(DATA_DIR, 'mapa_libros.json'), JSON.stringify(mapaIds, null, 2))
  console.log(`Libros importados: ${librosOk} (errores: ${librosError})`)

  /console.log(`Importando ${prestamos.length} préstamos...`)
  let prestamosOk = 0
  let prestamosSinLibro = 0
  let prestamosError = 0

  for (const fila of prestamos) {
    const libroIdNuevo = mapaIds[fila.libro_id]
    if (!libroIdNuevo) {
      prestamosSinLibro++
      console.warn(`  ✗ Préstamo de "${fila.prestado_a}" no tiene libro asociado (libro_id viejo: ${fila.libro_id})`)
      continue
    }

    const prestamoNuevo = {
      libro_id: libroIdNuevo,
      nombre_persona: fila.prestado_a,
      contacto: limpio(fila.contacto),
      fecha_prestamo: limpio(fila.fecha_prestamo),
      fecha_limite: limpio(fila.fecha_limite),
      fecha_devolucion: limpio(fila.fecha_devolucion),
      notas: limpio(fila.notas),
    }

    const { error } = await supabase.from('prestamos').insert(prestamoNuevo)
    if (error) {
      prestamosError++
      console.warn(`  ✗ No se pudo importar préstamo de "${fila.prestado_a}": ${error.message}`)
      continue
    }
    prestamosOk++
  }

  console.log(`Préstamos importados: ${prestamosOk} (sin libro: ${prestamosSinLibro}, errores: ${prestamosError})`)
  console.log('Listo. Mapeo de ids guardado en scripts/data/mapa_libros.json')
}

main()
