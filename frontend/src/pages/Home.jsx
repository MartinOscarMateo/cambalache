// frontend/src/pages/Home.jsx
import { Link } from 'react-router-dom'

export default function Home() {
  const samples = [
    { id: '001', title: 'Lorem ipsum dolor sit amet', excerpt: 'Consectetur adipiscing elit. Integer feugiat nunc at tincidunt efficitur.' },
    { id: '002', title: 'Sed do eiusmod tempor', excerpt: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi.' },
    { id: '003', title: 'Duis autem vel eum', excerpt: 'Iriure dolor in hendrerit in vulputate velit esse molestie consequat.' }
  ]

  return (
    <main>
      <header>
        <h1>Explorar publicaciones</h1>
        <nav>
          <Link to="/posts/create">Crear publicación</Link>
          <span> · </span>
          <Link to="/login">Iniciar sesión</Link>
        </nav>
      </header>

      <section>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras dictum
          lacus nisi interdum urna, non varius mi est nec nisi. Aliquam erat
          volutpat. Curabitur maximus at porta gravida.
        </p>
        <p>
          Proin posuere facilisis urna sed consequat. Mauris porttitor augue at
          fermentum laoreet. Suspendisse potenti. Etiam vitae lorem at tortor
          ultrices tristique.
        </p>
      </section>

      <section>
        {samples.map(p => (
          <article key={p.id} style={{ margin: '16px 0' }}>
            <h2>{p.title}</h2>
            <p>{p.excerpt}</p>
            <Link to={`/posts/${p.id}`}>Ver</Link>
          </article>
        ))}
        <p>
          <Link to="/posts">Ver todas las publicaciones</Link>
        </p>
      </section>

      <section>
        <h2>¿Cómo funciona?</h2>
        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
          dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
          proident.
        </p>
      </section> */}
    </main>
  );
}
