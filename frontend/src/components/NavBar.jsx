// frontend/src/components/NavBar.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo-svg.svg'; // importa tu logo SVG

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
    setOpen(false);
  }

  return (
    <header className="bg-[#2727d1] font-['lato'] font-bold">
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-[1000] md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="py-4 md:py-5 relative z-[1001]">
        <nav className="flex justify-between items-center w-[92%] mx-auto">
          {/* Logo Cambalache */}
          <div className="flex items-center">
            <Link to="/" onClick={() => setOpen(false)}>
              <img
                src={logo}
                alt="Logo Cambalache"
                className="h-10 md:h-12 hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>

          {/* Menú */}
          <div
            className={`md:static fixed md:min-h-fit min-h-[50vh] left-0 ${
              open ? 'top-[72px]' : '-top-full'
            } md:w-auto w-full flex items-center px-5 bg-[#2727d1] md:bg-transparent z-[1001]`}
          >
            <ul className="flex md:flex-row flex-col md:items-center md:gap-[4vw] gap-6 w-full md:w-auto text-white text-base">
              <li><Link className="hover:text-[#ffdb3e]" to="/" onClick={() => setOpen(false)}>Inicio</Link></li>
              <li><Link className="hover:text-[#ffdb3e]" to="/posts" onClick={() => setOpen(false)}>Publicaciones</Link></li>
              <li><Link className="hover:text-[#ffdb3e]" to="/posts/create" onClick={() => setOpen(false)}>Crear</Link></li>

              {token ? (
                <>
                  <li><Link className="hover:text-[#ffdb3e]" to="/chats" onClick={() => setOpen(false)}>Chats</Link></li>
                  <li><Link className="hover:text-[#ffdb3e]" to="/profile" onClick={() => setOpen(false)}>{user?.name || 'Perfil'}</Link></li>
                  <li><button onClick={logout} className="hover:text-[#ffdb3e]">Salir</button></li>
                </>
              ) : (
                <>
                  <li><Link className="hover:text-[#ffdb3e]" to="/register" onClick={() => setOpen(false)}>Registrarse</Link></li>
                  <li><Link className="hover:text-[#ffdb3e]" to="/login" onClick={() => setOpen(false)}>Ingresar</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Toggle móvil */}
          <div className="flex items-center gap-4 md:hidden">
            <button onClick={() => setOpen(!open)} aria-label="Abrir menú">
              <ion-icon name={open ? 'close' : 'menu'} className="text-3xl text-white"></ion-icon>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}