// frontend/src/pages/Home.jsx
import { Link } from 'react-router-dom'
import bannerImg from '../assets/images/banner-cambalache.webp'

export default function LandingPage() {
  return (
    <main className="min-h-[85vh]">
      <section className="p-10">
        <div className="container">
          <div className="relative border h-[40vh] rounded-4xl shadow-xl">
            <div className="absolute bottom-8 left-10 px-4 py-2 bg-[var(--c-text)] text-white rounded-2xl inline-block scale-100 hover:scale-110 transition-transform duration-200 hover:bg-[#00afe7] hover:shadow-lg shadow-cyan-500/50">
              Registrate
            </div>
          </div>
        </div>
      </section>
      <section className="bg-[var(--c-text)] p-10">
        <div className='container'>
          <div className="flex bg-[#ffff] border border-[color:var(--c-mid-blue)]/60 rounded-4xl h-[40vh] shadow-[0_20px_60px_rgba(0,0,0,.2)]">
            <div className='w-3/5 border-e border-[color:var(--c-mid-blue)]/60 h-full py-6 px-7'>
              <h2>¿Qué es Cambalache?</h2>
              <p className="font-bold!">Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto veniam nihil at assumenda et! Accusamus ipsum veniam tempore enim reiciendis sed rem itaque, voluptatum, quae at qui dolores deleniti modi obcaecati dolore? Id dolorem numquam, distinctio ipsum eos veritatis maxime impedit illum quasi repudiandae sequi accusamus illo quos totam nihil.</p>
            </div>
            <div className='w-2/5 h-full bg-[#ececec] rounded-r-4xl'>

            </div>
          </div>
        </div>
      </section>
      <section className="p-10" aria-labelledby="como-funciona">
        <div className="container h-[40vh] flex justify-center items-center">
          <div>
            <h2 className="text-center mb-5!" id="como-funciona">¿Cómo funciona?</h2>
            <div className="home-guest__grid">
              {[
                { n: '1', d: 'Creás tu cuenta y verificás tu perfil para generar confianza desde el inicio.' },
                { n: '2', d: 'Publicás lo que ofrecés o buscás y explorás opciones cerca tuyo.' },
                { n: '3', d: 'Enviás ofertas o contraofertas y chateás para coordinar el intercambio.' },
                { n: '4', d: 'Concretás en un punto acordado y dejás tu calificación.' }
              ].map(item => (
                <article key={item.n} className="home-guest__step shadow-xl">
                  <div className="home-guest__badge">{item.n}</div>
                  <p>{item.d}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="bg-[var(--c-text)] p-10">
        <div className='container'>
          <div className="flex bg-[#ffff] border border-[color:var(--c-mid-blue)]/60 rounded-4xl h-[40vh] shadow-xl">
            <div className='w-2/5 h-full bg-[#ececec] rounded-l-4xl'>

            </div>
            <div className="w-3/5 border-s border-[color:var(--c-mid-blue)]/60 h-full py-6 px-7">
              <h2>Otra Section</h2>
              <p className="font-bold!">Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto veniam nihil at assumenda et! Accusamus ipsum veniam tempore enim reiciendis sed rem itaque, voluptatum, quae at qui dolores deleniti modi obcaecati dolore? Id dolorem numquam, distinctio ipsum eos veritatis maxime impedit illum quasi repudiandae sequi accusamus illo quos totam nihil.</p>
            </div>  
          </div>
        </div>
      </section>
      <section className="p-10">
        <div className='container'>
          <div className="flex justify-center items-center h-[40vh]">
            <div className="bg-[#ffff] inline-block p-7 rounded-3xl border border-[color:var(--c-mid-blue)]/60 shadow-xl">
              <h2 className="text-center">Unite al movimiento</h2>
              <p className="py-3 font-bold! text-center">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Error, consequuntur.</p>
              <div className="flex justify-center items-center">
                <div className="mt-5 bg-[var(--c-text)] rounded-2xl inline-block scale-100 hover:scale-110 transition-transform duration-200 hover:bg-[#00afe7] hover:shadow-lg shadow-cyan-500/50">
                  <Link to="/register" className="px-4 py-2 text-white! inline-block">Crear Cuenta</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}