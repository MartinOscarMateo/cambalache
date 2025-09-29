// frontend/src/pages/Home.jsx
import { Link } from 'react-router-dom'
import bannerImg from '../assets/images/banner-cambalache.jpg'

export default function Home() {
  return (
    <main className="space-y-16">
      <section aria-label="Presentación Cambalache">
        <img
          src={bannerImg}
          alt="Banner Cambalache"
          className="w-full rounded-xl"
        />
      </section>

      <div className="px-[400px] flex flex-col items-center space-y-16">
        <section className="text-center space-y-4">
          <h1 className="text-3xl font-extrabold text-[#0E2031]">
            Bienvenido a{' '}
            <span className="milonga text-gold-shadow-blue font-normal">
              Cambalache
            </span>
          </h1>
          <h2 className="text-xl font-semibold text-[#4271B6]">
            La forma más simple de intercambiar en CABA
          </h2>
          <p className="text-lg leading-relaxed text-gray-700">
            Una plataforma P2P que te conecta con tu comunidad para dar nueva vida a objetos
            y servicios. Fomentamos la reutilización, la confianza entre vecinos y un consumo
            responsable, todo sin necesidad de dinero.
          </p>
        </section>

        <section className="w-full">
          <h2 className="text-2xl font-bold mb-8 text-center text-[#0E2031]">
            Cómo funciona
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: '1',
                d: 'Creás tu cuenta y verificás tu perfil para generar confianza desde el inicio.'
              },
              {
                n: '2',
                d: 'Publicás lo que ofrecés o buscás y explorás opciones cerca tuyo.'
              },
              {
                n: '3',
                d: 'Enviás ofertas o contraofertas y chateás para coordinar el intercambio.'
              },
              {
                n: '4',
                d: 'Concretás en un punto acordado y dejás tu calificación.'
              }
            ].map((item) => (
              <article
                key={item.n}
                className="rounded-xl p-6 shadow-md transition hover:shadow-lg flex flex-col items-center text-center"
                style={{
                  backgroundColor: '#F5F5F5',
                  border: '2px solid #4271B6'
                }}
              >
                <div className="text-4xl font-extrabold text-[#BF133D] mb-3">
                  {item.n}
                </div>
                <p className="text-[#0E2031]">{item.d}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="w-full bg-[#F5F5F5] border-t-4 border-[#BF133D] shadow-inner py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold mb-4 text-[#0E2031]">
            Empezá ahora
          </h2>
          <p className="mb-8 text-lg text-gray-700">
            Unite a{' '}
            <span className="milonga text-gold-shadow-blue font-normal">
              Cambalache
            </span>{' '}
            y empezá a publicar, chatear y concretar tus trueques hoy mismo.
          </p>
          <div className="flex gap-6 flex-wrap justify-center">
            <Link
              to="/login"
              className="btn btn-blue px-6 py-3 text-lg rounded-lg"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="btn btn-red px-6 py-3 text-lg rounded-lg"
            >
              Quiero registrarme
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
