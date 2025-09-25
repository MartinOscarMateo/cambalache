// frontend/src/pages/Home.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const placeholders = [
    {
      _id: 'lrm-001',
      title: 'Lorem ipsum dolor sit amet',
      description:
        'Consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.'
    },
    {
      _id: 'lrm-002',
      title: 'Sed do eiusmod tempor',
      description:
        'Incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi.'
    },
    {
      _id: 'lrm-003',
      title: 'Ut wisi enim ad minim',
      description:
        'Quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat.'
    },
    {
      _id: 'lrm-004',
      title: 'Duis autem vel eum iriure',
      description:
        'Dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis.'
    },
    {
      _id: 'lrm-005',
      title: 'Nam liber tempor cum soluta',
      description:
        'Nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum.'
    },
    {
      _id: 'lrm-006',
      title: 'Claritas est etiam processus',
      description:
        'Dynamis qui sequitur mutationem consuetudium lectorum. Mirum est notare quam littera gothica nunc putamus.'
    },
    {
      _id: 'lrm-007',
      title: 'Investigatones demonstraverunt',
      description:
        'Lectores legere me lius quod ii legunt saepius. Claritatem insitam est usus legentis in iis qui facit eorum claritatem.'
    },
    {
      _id: 'lrm-008',
      title: 'Eodem modo typi',
      description:
        'Qui nunc nobis videntur parum clari, fiant sollemnes in futurum. Qui sequitur mutationem consuetudium.'
    }
  ]

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    fetch(`${API}/api/posts`)
      .then(r => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then(data => {
        setPosts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return null
  if (error) return <div>{error}</div>

  const items = posts.length ? posts : placeholders

  return (
    <main>
      <header>
        <h1>Explorar publicaciones</h1>
        <nav>
          <Link to="/posts/create">Crear publicación</Link>
          <Link to="/login">Iniciar sesión</Link>
        </nav>
      </header>

      <section>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
          feugiat, nunc at tincidunt efficitur, lorem sapien pretium metus, at
          venenatis sem lectus ut justo. Cras dictum, nibh eu hendrerit
          dignissim, lacus nisi interdum urna, non varius mi est nec nisi.
        </p>
        <p>
          Aliquam erat volutpat. Curabitur maximus, nisl at porta gravida, nibh
          mi vehicula nibh, a aliquet risus orci eget turpis. Proin posuere
          facilisis urna sed consequat. Mauris porttitor, augue at fermentum
          laoreet, neque sem suscipit massa, id aliquam arcu arcu nec augue.
        </p>
      </section>

      <section>
        {items.map(p => (
          <article key={p._id}>
            <h2>{p.title}</h2>
            <p>{p.description}</p>
            <Link to={`/posts/${p._id}`}>Ver</Link>
          </article>
        ))}
      </section>

      <section>
        <h2>¿Cómo funciona?</h2>
        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
          dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
          proident, sunt in culpa qui officia deserunt mollit anim id est
          laborum.
        </p>
      </section>
    </main>
  )
}
