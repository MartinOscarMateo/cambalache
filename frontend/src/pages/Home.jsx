import { Link } from 'react-router-dom'
import bannerImg from '../assets/images/banner-cambalache.webp'
import '../styles/pages/home-guest.css'

export default function Home() {
  return (
    <main className="min-h-[85vh] home-guest">
      {/* Banner principal */}
      <section className="home-guest__banner mt-4" aria-labelledby="home-hero-title">
        <div className="container">
          <h1 id="home-hero-title" className="sr-only">Cambalache — trueque simple y local</h1>
          <div className="home-guest__banner-box">
            <img src={bannerImg} alt="" />
            <div className="home-guest__banner-actions" role="group" aria-label="Acción principal">
              <Link to="/register" className="btn btn-cyan">Crear cuenta</Link>
            </div>
          </div>
          <p className="home-guest__banner-text">
            Cambalache te conecta con personas cerca tuyo para intercambiar objetos y servicios sin usar dinero,
            priorizando la confianza, la cercanía y el cuidado del ambiente.
          </p>
        </div>
      </section>

      {/* Bloque  de contexto */}
      <section className="home-guest__intro" aria-labelledby="que-podes-hacer">
        <div className="container">
          <h2 id="que-podes-hacer">Qué podés hacer en Cambalache</h2>
          <p className="home-guest__intro-text">
            Publicás lo que ya no usás, buscás lo que necesitás y coordinás el intercambio directamente con otras
            personas de tu zona. Todo organizado en un solo lugar.
          </p>
          <p className="home-guest__intro-sub">
            La app está pensada para trueques cotidianos: desde objetos de uso diario hasta servicios simples entre vecinos.
          </p>

          <ul className="home-guest__intro-list">
            <li className="home-guest__intro-item">
              <span className="home-guest__intro-dot" />
              <div>
                <h3>Intercambios más seguros</h3>
                <p>Perfiles con datos básicos, historial de trueques y calificaciones entre usuarios.</p>
              </div>
            </li>
            <li className="home-guest__intro-item">
              <span className="home-guest__intro-dot" />
              <div>
                <h3>Todo cerca tuyo</h3>
                <p>Filtrado por barrio y mapa para ubicar quién ofrece qué en tu zona.</p>
              </div>
            </li>
            <li className="home-guest__intro-item">
              <span className="home-guest__intro-dot" />
              <div>
                <h3>Aprovechar lo que ya existe</h3>
                <p>Extendés la vida útil de las cosas y evitás comprar de más.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Pasos del flujo */}
      <section className="home-guest__steps mb-4" aria-labelledby="como-funciona">
        <div className="container">
          <h2 id="como-funciona">¿Cómo funciona?</h2>
          <div className="home-guest__grid">
            {[
              { n: '1', d: 'Creás tu cuenta y verificás tu perfil para generar confianza desde el inicio.' },
              { n: '2', d: 'Publicás lo que ofrecés o buscás y explorás opciones cerca tuyo.' },
              { n: '3', d: 'Enviás ofertas o contraofertas y chateás para coordinar el intercambio.' },
              { n: '4', d: 'Concretás en un punto acordado y dejás tu calificación.' }
            ].map(item => (
              <article key={item.n} className="home-guest__step">
                <div className="home-guest__badge">{item.n}</div>
                <p>{item.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Accesos */}
      <section className="home-guest__cta" aria-label="Acciones rápidas">
        <div className="container home-guest__cta-grid">
          <article className="home-guest__cta-card">
            <h3>Explorar publicaciones</h3>
            <p>Mirar qué están ofreciendo otras personas y descubrir oportunidades de intercambio.</p>
            <Link to="/posts" className="home-guest__cta-link">
              Ver publicaciones
            </Link>
          </article>

          <article className="home-guest__cta-card">
            <h3>Ver mapa</h3>
            <p>Ubicar publicaciones por zona y organizar tus trueques según tus recorridos.</p>
            <Link to="/map" className="home-guest__cta-link">
              Abrir mapa
            </Link>
          </article>

          <article className="home-guest__cta-card">
            <h3>Crear mi cuenta</h3>
            <p>Completar tu perfil, sumar una foto y empezar a publicar lo que ofrecés.</p>
            <Link to="/register" className="home-guest__cta-link">
              Crear cuenta
            </Link>
          </article>
        </div>
      </section>
    </main>
  )
}