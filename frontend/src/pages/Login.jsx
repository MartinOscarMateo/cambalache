import { Link } from 'react-router-dom'

export default function Login() {
  return (
    <main>
      <h1>Iniciar sesión</h1>
      <form onSubmit={e => e.preventDefault()}>
        <p><label>Email<br /><input type="email" placeholder="correo@ejemplo.com" /></label></p>
        <p><label>Contraseña<br /><input type="password" placeholder="••••••••" /></label></p>
        <p><button type="submit">Ingresar (vista)</button></p>
      </form>
      <p><Link to="/forgot-password">¿Olvidaste tu contraseña?</Link></p>
    </main>
  )
}