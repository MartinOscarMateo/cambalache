import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main className="space-y-12">
      <section
        className="relative rounded-xl overflow-hidden"
        aria-label="Presentación Cambalache"
      >
        <div
          className="w-full h-72"
          style={{
            background:
              'radial-gradient(circle, rgba(191,19,61,1) 0%, rgba(14,32,49,1) 100%)',
          }}
        />
        <div className="absolute inset-0 flex items-center px-6 bg-black/40">
          <div className="max-w-2xl text-[#EFC55A]">
            <h1 className="text-4xl font-extrabold leading-tight drop-shadow-lg">
              Trueques locales simples y seguros
            </h1>
            <p className="mt-3 mb-5 text-lg text-[#F5F5F5] drop-shadow">
              Publicá lo que ofrecés, encontrá lo que necesitás y cerrá el
              intercambio con perfiles verificados y reputación visible.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                to="/login"
                className="bg-[#00A884] text-white px-5 py-2 rounded-lg font-semibold shadow hover:opacity-90"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="border border-white/60 text-white px-5 py-2 rounded-lg font-semibold backdrop-blur hover:bg-white/10"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6">
        <p className="text-lg leading-relaxed max-w-3xl">
          <span className="font-semibold text-[#BF133D]">Cambalache</span> es
          una plataforma P2P para intercambiar objetos y servicios sin dinero.
          Diseñada para CABA y AMBA en el lanzamiento. Fomenta comunidad,
          reutilización y consumo responsable con reglas claras y soporte
          centralizado.
        </p>
      </section>

      <section className="px-6">
        <h2 className="text-2xl font-bold mb-6 text-[#0E2031]">
          Qué podés hacer en Cambalache
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              t: 'Intercambiar productos y servicios',
              d: 'Ofrecé lo que ya no usás o tus habilidades, y conseguí lo que necesitás sin gastar dinero.'
            },
            {
              t: 'Encontrar por cercanía',
              d: 'Buscá ofertas en tu barrio o zona, filtrando por categorías y distancia para concretar rápido.'
            },
            {
              t: 'Construir tu reputación',
              d: 'Sumá calificaciones positivas y verificá tu perfil para generar confianza en cada intercambio.'
            }
          ].map((item) => (
            <article
              key={item.t}
              className="rounded-xl p-5 shadow transition hover:shadow-md"
              style={{
                backgroundColor: '#F5F5F5',
                border: '2px solid #4271B6'
              }}
            >
              <h3 className="font-semibold text-lg mb-2 text-[#BF133D]">
                {item.t}
              </h3>
              <p className="text-[#0E2031]">{item.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6">
        <h2 className="text-2xl font-bold mb-4 text-[#0E2031]">
          Cómo funciona
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Creás tu cuenta y verificás tu perfil.</li>
          <li>Publicás lo que ofrecés o buscás y explorás cerca tuyo.</li>
          <li>Enviás ofertas o contraofertas y chateás para coordinar.</li>
          <li>Concretás en un punto acordado y dejás tu calificación.</li>
        </ol>
      </section>

      <section className="bg-[#F5F5F5] border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 mx-6">
        <div className="max-w-md">
          <h2 className="text-xl font-bold mb-2 text-[#0E2031]">
            Empezá ahora
          </h2>
          <p className="text-gray-700">
            Accedé a tu cuenta para publicar, chatear y gestionar tus trueques.
          </p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <Link
            to="/login"
            className="btn btn-blue"
          >
            Ir a Login
          </Link>
          <Link
            to="/posts"
            className="btn btn-gold"
          >
            Ver publicaciones
          </Link>
          <Link
            to="/posts/create"
            className="btn btn-red"
          >
            Crear publicación
          </Link>
        </div>
      </section>

      <section className="px-6">
        <h2 className="text-2xl font-bold mb-2 text-[#0E2031]">
          Seguridad y confianza
        </h2>
        <p className="text-gray-700 max-w-2xl">
          Moderación activa, perfiles verificados y reputación pública. Enfoque
          en cercanía, reglas claras e inclusión para una experiencia simple y
          justa.
        </p>
      </section>
    </main>
  )
}