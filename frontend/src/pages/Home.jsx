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
        </div>
      </section>

      {/* Fondo azul*/}
      <div
        className="mt-6 pb-6"
        style={{ background: 'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)' }}
      >
        {/* Bloque de contexto */}
        <section
          className="home-guest__intro py-8"
          aria-labelledby="que-podes-hacer"
          style={{ background: 'transparent' }}
        >
          <div className="container">
            <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,.55)] border border-[color:var(--c-mid-blue)]/60">
              <header className="mb-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--c-info)]/90">
                  Para qué usar Cambalache
                </p>
                <h2
                  id="que-podes-hacer"
                  className="mt-1 text-2xl sm:text-3xl font-bold"
                  style={{ color: 'var(--c-brand)' }}
                >
                  Qué podés hacer en Cambalache
                </h2>
              </header>

              <p className="home-guest__intro-text text-sm sm:text-base" style={{ color: 'var(--c-text)' }}>
                Publicás lo que ya no usás, buscás lo que necesitás y coordinás el intercambio directamente con otras
                personas de tu zona. Todo organizado en un solo lugar.
              </p>
              <p className="home-guest__intro-sub mt-2 text-sm" style={{ color: 'var(--c-text)' }}>
                La app está pensada para trueques cotidianos: desde objetos de uso diario hasta servicios simples entre vecinos.
              </p>

              <ul className="home-guest__intro-list mt-5 space-y-4">
                <li className="home-guest__intro-item flex gap-3">
                  <span className="home-guest__intro-dot shrink-0" />
                  <div>
                    <h3
                      className="text-sm sm:text-base font-semibold"
                      style={{ color: 'var(--c-text)' }}
                    >
                      Intercambios más seguros
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                      Perfiles con datos básicos, historial de trueques y calificaciones entre usuarios.
                    </p>
                  </div>
                </li>
                <li className="home-guest__intro-item flex gap-3">
                  <span className="home-guest__intro-dot shrink-0" />
                  <div>
                    <h3
                      className="text-sm sm:text-base font-semibold"
                      style={{ color: 'var(--c-text)' }}
                    >
                      Todo cerca tuyo
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                      Filtrado por barrio y mapa para ubicar quién ofrece qué en tu zona.
                    </p>
                  </div>
                </li>
                <li className="home-guest__intro-item flex gap-3">
                  <span className="home-guest__intro-dot shrink-0" />
                  <div>
                    <h3
                      className="text-sm sm:text-base font-semibold"
                      style={{ color: 'var(--c-text)' }}
                    >
                      Aprovechar lo que ya existe
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                      Extendés la vida útil de las cosas y evitás comprar de más.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pasos del flujo */}
        <section
          className="home-guest__steps"
          aria-labelledby="como-funciona"
          style={{ background: 'transparent' }}
        >
          <div className="container py-4">
            <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,.55)] border border-[color:var(--c-mid-blue)]/60">
              <h2
                id="como-funciona"
                className="text-2xl sm:text-3xl font-bold mb-4"
                style={{ color: 'var(--c-brand)' }}
              >
                ¿Cómo funciona?
              </h2>
              <div className="home-guest__grid grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { n: '1', d: 'Creás tu cuenta y verificás tu perfil para generar confianza desde el inicio.' },
                  { n: '2', d: 'Publicás lo que ofrecés o buscás y explorás opciones cerca tuyo.' },
                  { n: '3', d: 'Enviás ofertas o contraofertas y chateás para coordinar el intercambio.' },
                  { n: '4', d: 'Concretás en un punto acordado y dejás tu calificación.' }
                ].map(item => (
                  <article
                    key={item.n}
                    className="home-guest__step flex flex-col rounded-2xl border border-[color:var(--c-mid-blue)]/40 bg-white shadow-[0_14px_35px_rgba(0,0,0,.14)] p-4"
                  >
                    <div className="home-guest__badge mb-2 text-sm font-semibold rounded-full inline-flex items-center justify-center px-3 py-1 bg-[color:var(--c-info)]/15 text-[color:var(--c-brand)]">
                      {item.n}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--c-text)' }}>{item.d}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Accesos */}
        <section
          className="home-guest__cta"
          aria-label="Acciones rápidas"
          style={{ background: 'transparent' }}
        >
          <div className="container py-4">
            <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,.55)] border border-[color:var(--c-mid-blue)]/60">
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--c-info)]/90">
                  Empezar a usar Cambalache
                </p>
                <h2
                  className="mt-1 text-2xl sm:text-3xl font-bold"
                  style={{ color: 'var(--c-brand)' }}
                >
                  Accesos rápidos
                </h2>

              </div>

              <div className="home-guest__cta-grid grid gap-4 sm:grid-cols-3">
                <article className="home-guest__cta-card rounded-2xl border border-[color:var(--c-mid-blue)]/40 bg-white shadow-[0_14px_35px_rgba(0,0,0,.14)] p-4 flex flex-col">
                  <h3 className="text-base font-semibold" style={{ color: 'var(--c-text)' }}>
                    Explorar publicaciones
                  </h3>
                  <p className="mt-2 text-sm flex-1" style={{ color: 'var(--c-text)' }}>
                    Mirar qué están ofreciendo otras personas y descubrir oportunidades de intercambio.
                  </p>
                  <Link to="/posts" className="home-guest__cta-link mt-3 text-sm font-medium text-[color:var(--c-brand)] underline-offset-2 hover:underline">
                    Ver publicaciones
                  </Link>
                </article>

                <article className="home-guest__cta-card rounded-2xl border border-[color:var(--c-mid-blue)]/40 bg-white shadow-[0_14px_35px_rgba(0,0,0,.14)] p-4 flex flex-col">
                  <h3 className="text-base font-semibold" style={{ color: 'var(--c-text)' }}>
                    Ver mapa
                  </h3>
                  <p className="mt-2 text-sm flex-1" style={{ color: 'var(--c-text)' }}>
                    Ubicar publicaciones por zona y organizar tus trueques según tus recorridos.
                  </p>
                  <Link to="/map" className="home-guest__cta-link mt-3 text-sm font-medium text-[color:var(--c-brand)] underline-offset-2 hover:underline">
                    Abrir mapa
                  </Link>
                </article>

                <article className="home-guest__cta-card rounded-2xl border border-[color:var(--c-mid-blue)]/40 bg-white shadow-[0_14px_35px_rgba(0,0,0,.14)] p-4 flex flex-col">
                  <h3 className="text-base font-semibold" style={{ color: 'var(--c-text)' }}>
                    Crear mi cuenta
                  </h3>
                  <p className="mt-2 text-sm flex-1" style={{ color: 'var(--c-text)' }}>
                    Completar tu perfil, sumar una foto y empezar a publicar lo que ofrecés.
                  </p>
                  <Link to="/register" className="home-guest__cta-link mt-3 text-sm font-medium text-[color:var(--c-brand)] underline-offset-2 hover:underline">
                    Crear cuenta
                  </Link>
                </article>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}