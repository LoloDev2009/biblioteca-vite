import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarPorEstante } from '../lib/libros'

// Paleta de colores de lomo, asignada de forma estable según el género
// (mismo género -> mismo color siempre), para que la estantería se
// sienta organizada visualmente aunque no lo esté literalmente.
const COLORES_LOMO = ['#2F5D62', '#6B7A4F', '#8A6D4B', '#5C4630', '#7A4A42', '#3D5A73']

function colorPara(genero) {
  if (!genero) return '#5A5245'
  let hash = 0
  for (let i = 0; i < genero.length; i++) hash = genero.charCodeAt(i) + ((hash << 5) - hash)
  return COLORES_LOMO[Math.abs(hash) % COLORES_LOMO.length]
}

export default function Estantes() {
  const [grupos, setGrupos] = useState({})
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    listarPorEstante().then(setGrupos).finally(() => setCargando(false))
  }, [])

  const nombresEstantes = Object.keys(grupos).sort((a, b) => {
    if (a === 'Sin estante') return 1
    if (b === 'Sin estante') return -1
    return a.localeCompare(b)
  })

  if (cargando) return <p>Cargando...</p>
  if (nombresEstantes.length === 0) {
    return <p className="vacio">Todavía no hay libros cargados.</p>
  }

  return (
    <div className="estantes">
      <h2>Estantería</h2>
      {nombresEstantes.map((nombre) => (
        <div key={nombre} className="estante-bloque">
          <h3 className="etiqueta-estante">{nombre}</h3>
          <div className="repisa">
            {grupos[nombre].map((libro) => (
              <Link
                to={`/libro/${libro.id}`}
                key={libro.id}
                className="lomo"
                style={{ background: colorPara(libro.genero) }}
                title={`${libro.titulo} — ${libro.autor || 'autor desconocido'}`}
              >
                <span>{libro.titulo}</span>
                {libro.leido && <span className="marca-leido" title="Leído">●</span>}
              </Link>
            ))}
          </div>
          <div className="tabla-estante" />
        </div>
      ))}
    </div>
  )
}
