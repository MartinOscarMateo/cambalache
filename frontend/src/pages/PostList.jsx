import { Link } from 'react-router-dom'

const dummy = Array.from({ length: 8 }).map((_, i) => ({
  id: String(i + 1).padStart(3, '0'),
  title: `Lorem ipsum ${i + 1}`,
  excerpt:
    'Consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus.',
}))

export default function PostsList() {
  return (
    <main>
      <h1>Publicaciones</h1>
      {dummy.map(p => (
        <article key={p.id} style={{ margin: '16px 0' }}>
          <h2>{p.title}</h2>
          <p>{p.excerpt}</p>
          <Link to={`/posts/${p.id}`}>Ver detalle</Link>
        </article>
      ))}
    </main>
  )
}