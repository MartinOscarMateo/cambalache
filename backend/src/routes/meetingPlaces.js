import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const router = Router()

// Necesitamos __dirname en ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let espaciosCache = null

function loadGeojson () {
  if (espaciosCache) return espaciosCache

  const filePath = path.join(__dirname, '../data/espacio_verde_publico.geojson')
  const raw = fs.readFileSync(filePath, 'utf8')
  espaciosCache = JSON.parse(raw)
  return espaciosCache
}

router.get('/', (req, res) => {
  try {
    const { barrio = '' } = req.query
    const geo = loadGeojson()
    let features = Array.isArray(geo.features) ? geo.features : []

    let items = features.map((f, idx) => {
      const props = f.properties || {}
      const geom = f.geometry || {}
      const coords = Array.isArray(geom.coordinates) ? geom.coordinates : []
      const lng = coords[0]
      const lat = coords[1]

      const barrioValue = props.barrio || props.BARRIO || ''
      const name = props.nombre || props.NOMBRE || props.nom_map || 'Espacio público'
      const id = props.id || props.ID || props.OGC_FID || idx
      const address = props.domicilio || props.DOMICILIO || ''

      return {
        id,
        name,
        barrio: barrioValue,
        address,
        lat,
        lng
      }
    })

    if (barrio) {
      const b = String(barrio).toLowerCase()
      items = items.filter(p => String(p.barrio || '').toLowerCase() === b)
    }

    res.json(items)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Error leyendo espacios públicos' })
  }
})

export default router