export default function Register() {
  return (
    <main>
      <h1>Crear cuenta</h1>
      <form onSubmit={e => e.preventDefault()}>
        <p><label>Nombre<br /><input placeholder="Tu nombre" /></label></p>
        <p><label>Email<br /><input type="email" placeholder="correo@ejemplo.com" /></label></p>
        <p><label>Contraseña<br /><input type="password" /></label></p>
        <p><label>Repetir contraseña<br /><input type="password" /></label></p>
        <p><button type="submit">Registrarme (vista)</button></p>
      </form>
    </main>
  )
}