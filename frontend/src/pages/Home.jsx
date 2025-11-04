// frontend/src/pages/Home.jsx
import { Link } from 'react-router-dom'
import bannerImg from '../assets/images/banner-cambalache.webp'
import '../styles/pages/home-guest.css'

export default function Home() {
  return (
    <main className="min-h-[85vh] home-guest">
      <section className="home-guest__banner" aria-labelledby="home-hero-title">
        <div className="container">
          <h1 id="home-hero-title" className="sr-only">Cambalache — trueque simple y local</h1>
          <div className="home-guest__banner-box">
            <img src={bannerImg} alt="" />
            <div className="home-guest__banner-actions" role="group" aria-label="Accion principal">
              <Link to="/register" className="btn btn-cyan">Crear cuenta</Link>
            </div>
          </div>
        </div>
      </section>

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
    </main>
  )
}