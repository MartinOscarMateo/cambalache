// frontend/src/pages/Home.jsx
import { Link } from 'react-router-dom'
import bannerSm from '../assets/images/banner-sm.webp'
import bannerMd from '../assets/images/banner-md.webp'
import banner from '../assets/images/banner.webp'
import descripcionImg from '../assets/images/intercambio-libros-usados.png'
import propuesta from '../assets/images/propuesta.jpeg'
import '../styles/pages/landing.css'


export default function LandingPage() {
  return (
    <main className="min-h-[85vh]">
      <section className="py-5">
        <div className="container">
          <div className="relative border min-h-[40vh] rounded-2xl shadow-xl">
            <img src={bannerSm} alt="banner" className='rounded-2xl movile'/>
            <img src={bannerMd} alt="banner" className='rounded-2xl hidden xs md:hidden!'/>
            <img src={banner} alt="banner" className='min-h-[40vh] object-cover rounded-2xl hidden md:block'/>
            <div className="absolute boton px-4 py-2 bg-[#00afe7] text-white rounded-2xl inline-block scale-100 hover:scale-110 transition-transform duration-200  hover:shadow-lg shadow-cyan-500/50">
              Registrate
            </div>
          </div>
        </div>
      </section>
      <section className="bg-[var(--c-text)] py-5">
        <div className='container m-auto'>
          <div className="inline-block md:flex bg-[#ffff] border border-[color:var(--c-mid-blue)]/60 rounded-2xl md:min-h-[40vh] shadow-[0_20px_60px_rgba(0,0,0,.2)]">
            <div className='w-full h-full md:w-3/5 py-6 px-7'>
              <h2>¿Qué es Cambalache?</h2>
              <p className=""><strong className='text-[#ff52b9]'>Cambalache</strong> es una plataforma que <strong className='text-[#ff52b9]'>facilita el intercambio</strong> de objetos entre personas, sin necesidad de usar dinero. <strong className='text-[#ff52b9]'>Nuestro objetivo es</strong> conectar a quienes buscan satisfacer sus necesidades de forma práctica y económica, <strong className='text-[#ff52b9]'>promoviendo el trueque</strong> como una alternativa sostenible de consumo. De este modo, <strong className='text-[#ff52b9]'>Cambalache</strong> promueve y fortalece la economía circular, fomentando una comunidad más colaborativa y consciente del valor de los recursos.</p>
            </div>
            <div className='md:relative w-full md:w-2/5 bg-[#ececec] rounded-b-2xl md:rounded-bl-none md:rounded-r-2xl md:border-s border-[color:var(--c-mid-blue)]/60'>
              <img src={descripcionImg} alt="descripcion" className='h-full w-full md:absolute object-cover rounded-b-2xl md:rounded-bl-none md:rounded-r-2xl' />
            </div>
          </div>
        </div>
      </section>
      <section className="py-10" aria-labelledby="como-funciona">
        <div className="container flex justify-center items-center">
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
      <section className="bg-[var(--c-text)] py-5">
        <div className='container m-auto'>
          <div className="inline-block md:flex bg-[#ffff] border border-[color:var(--c-mid-blue)]/60 rounded-2xl md:min-h-[40vh] shadow-[0_20px_60px_rgba(0,0,0,.2)]">
            <div className='md:relative w-full md:w-2/5 bg-[#ececec] rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl md:border-e border-[color:var(--c-mid-blue)]/60'>
              <img src={propuesta} alt="descripcion" className='h-full w-full md:absolute object-cover rounded-t-2xl md:rounded-r-none md:rounded-l-2xl' />
            </div>
            <div className='w-full h-full md:w-3/5 py-6 px-7'>
              <h2>Propuesta de valor</h2>
              <p className="">
                <strong className='text-[#ff52b9]'>Cambalache</strong> ofrece una forma práctica y accesible de obtener lo que necesitás sin usar dinero, intercambiando objetos que ya no se usan o no se necesitan. <strong className='text-[#ff52b9]'>Conectamos a personas</strong> que quieren intercambiar de manera <strong className='text-[#ff52b9]'>directa, transparente y segura</strong>, promoviendo una comunidad basada en la confianza y la colaboración. Nuestra plataforma <strong className='text-[#ff52b9]'>moderna e intuitiva</strong> facilita todo el proceso: desde publicar lo que tenes, encontrar lo que buscas y chatear con otros usuarios, hasta concretar el intercambio de forma rápida y organizada.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-10">
        <div className='container'>
          <div className="flex justify-center items-center h-[40vh]">
            <div className="bg-[#ffff] inline-block p-7 rounded-2xl border border-[color:var(--c-mid-blue)]/60 shadow-xl">
              <h2 className="text-center">Unite al movimiento</h2>
              <p className="pb-3 text-center">Descubrí el valor de dar y recibir sin la necesidad del dinero.</p>
              <div className="flex justify-center items-center">
                <div className="mt-4 bg-[var(--c-text)] rounded-2xl inline-block scale-100 hover:scale-110 transition-transform duration-200 hover:bg-[#00afe7] hover:shadow-lg shadow-cyan-500/50">
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