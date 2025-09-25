export default function ResetPassword() {
  return (
    <main>
      <h1>Restablecer contraseña</h1>
      <form onSubmit={e => e.preventDefault()}>
        <p><label>Nueva contraseña<br /><input type="password" /></label></p>
        <p><label>Repetir contraseña<br /><input type="password" /></label></p>
        <p><button type="submit">Guardar (vista)</button></p>
      </form>
    </main>
  )
}