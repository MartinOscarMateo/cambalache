import { useParams } from 'react-router-dom'

export default function PostEdit() {
  const { id } = useParams()
  return (
    <main>
      <h1>Editar publicación #{id}</h1>
      <form onSubmit={e => e.preventDefault()}>
        <p><label>Título<br /><input defaultValue="Lorem ipsum" /></label></p>
        <p><label>Descripción<br /><textarea rows="4" defaultValue="Texto de ejemplo" /></label></p>
        <p><button type="submit">Actualizar (vista)</button></p>
      </form>
    </main>
  )
}