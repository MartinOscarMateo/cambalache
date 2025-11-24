import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const router = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const geojsonPath = path.join(__dirname, '../data/barrios.geojson')

let barriosGeojson = null
let barriosLista = null

function cargarBarrios() {
  if (!barriosGeojson) {
    const raw = fs.readFileSync(geojsonPath, 'utf8')
    barriosGeojson = JSON.parse(raw)
    barriosLista = barriosGeojson.features
      .map(f => f?.properties?.BARRIO)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort()
  }
}

router.get('/', (req, res) => {
  try {
    cargarBarrios()
    res.json(barriosLista)
  } catch (err) {
    console.error('Error cargando barrios', err)
    res.status(500).json({ message: 'Error cargando barrios' })
  }
})

router.get('/geojson', (req, res) => {
  try {
    cargarBarrios()
    res.json(barriosGeojson)
  } catch (err) {
    console.error('Error cargando barrios', err)
    res.status(500).json({ message: 'Error cargando barrios' })
  }
})

export default router