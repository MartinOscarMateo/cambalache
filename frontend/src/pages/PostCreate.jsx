export default function PostCreate() {
  return (
    <main>
      <h1>Crear publicación</h1>
      <form onSubmit={e => e.preventDefault()}>
        <p><label>Título<br /><input placeholder="Lorem ipsum" /></label></p>
        <p><label>Descripción<br /><textarea rows="4" placeholder="Texto de ejemplo" /></label></p>
        <p><label>Categoría<br /><input placeholder="Servicios u Objetos" /></label></p>
        <p><button type="submit">Guardar (vista, sin acción)</button></p>
      </form>
    </main>
  )
}