export default function ForgotPassword() {
  return (
    <main>
      <h1>Recuperar contraseña</h1>
      <form onSubmit={e => e.preventDefault()}>
        <p><label>Email<br /><input type="email" placeholder="correo@ejemplo.com" /></label></p>
        <p><button type="submit">Enviar enlace (vista)</button></p>
      </form>
    </main>
  )
}