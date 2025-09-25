import { Link, useParams } from 'react-router-dom'

export default function PostDetail() {
  const { id } = useParams()
  return (
    <main>
      <h1>Detalle de publicación #{id}</h1>
      <p>
        Lorem ipsum dolor sit amet, sed do eiusmod tempor incididunt ut labore
        et dolore magna aliqua. Ut enim ad minim veniam.
      </p>
      <p>
        <Link to={`/posts/${id}/edit`}>Editar</Link> · <Link to="/posts">Volver</Link>
      </p>
    </main>
  )
}