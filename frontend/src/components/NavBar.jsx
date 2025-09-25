import { Link } from 'react-router-dom'

export default function NavBar() {
  return (
    <header className="app-header">
      <nav style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link to="/">Inicio</Link>
        <Link to="/posts">Publicaciones</Link>
        <Link to="/posts/create">Crear</Link>
        <Link to="/login">Ingresar</Link>
        <Link to="/register">Registrarse</Link>
        <Link to="/profile">Perfil</Link>
      </nav>
    </header>
  )
}