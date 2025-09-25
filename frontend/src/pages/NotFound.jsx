import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main>
      <h1>404</h1>
      <p>Página no encontrada.</p>
      <p><Link to="/">Ir al inicio</Link></p>
    </main>
  )
}