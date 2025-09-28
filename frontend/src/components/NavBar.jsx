import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="py-5 border-b border-[#646cff]">
      <nav className="flex justify-between items center w-[92%] mx-auto">
        <div className="flex items-center">
          <Link className="text-[#646cff] hover:text-[#535bf2]" to="/">Cambalache</Link>
        </div>
        <div className={`bg-[#242424] md:static absolute md:min-h-fit min-h-[50vh] left-0 ${open ? "top-[9%]" : "top-[-100%]"} md:w-auto w-full flex items-center px-5 text-[#646cff] border-b md:border-0`}>
          <ul className="flex md:flex-row flex-col md:items-center md:gap-[4vw] gap-8">
            <li>
              <Link className="hover:text-[#535bf2]" to="/">Inicio</Link>
            </li>
            <li>
              <Link className="hover:text-[#535bf2]" to="/posts">Publicaciones</Link>
            </li>
            <li>
              <Link className="hover:text-[#535bf2]" to="/posts/create">Crear</Link>
            </li>
            <li>
              <Link className="hover:text-[#535bf2]" to="/register">Registrarse</Link>
            </li>
            <li>
              <Link className="hover:text-[#535bf2]" to="/profile">Perfil</Link>
            </li>
          </ul>
        </div>
        <div className="flex items-center gap-6">
          <Link className="bg-[#646cff] text-white px-5 py-2 rounded-full hover:bg-[#535bf2]" to="/login">Ingresar</Link>
          <button onClick={() => setOpen(!open)}>
            <ion-icon name={open ? "close" : "menu"} className="text-3xl md:hidden text-[#646cff] flex items-center"></ion-icon>
          </button>
        </div>
      </nav>
    </header>
  )
}