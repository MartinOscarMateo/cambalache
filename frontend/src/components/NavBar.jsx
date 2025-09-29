// frontend/src/components/NavBar.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  return (
    <header className="bg-gold">
      <div className="bg-red py-4 md:py-5">
        <nav className="flex justify-between items-center w-[92%] mx-auto">
          {/* Brand */}
          <div className="flex items-center">
            <Link to="/" className="text-gold-shadow-blue text-xl md:text-2xl hover:opacity-90">
              <span className="milonga font-normal">Cambalache</span>
            </Link>
          </div>

          {/* Menú */}
          <div
            className={`md:static absolute md:min-h-fit min-h-[50vh] left-0 ${
              open ? 'top-[72px]' : 'top-[-100%]'
            } md:w-auto w-full flex items-center px-5 bg-red md:bg-transparent`}
          >
            <ul className="flex md:flex-row flex-col md:items-center md:gap-[4vw] gap-6 w-full md:w-auto">
              <li><Link className="text-gold-shadow-blue hover:opacity-90" to="/">Inicio</Link></li>
              <li><Link className="text-gold-shadow-blue hover:opacity-90" to="/posts">Publicaciones</Link></li>
              <li><Link className="text-gold-shadow-blue hover:opacity-90" to="/posts/create">Crear</Link></li>

              {token ? (
                <>
                  <li>
                    <Link className="text-gold-shadow-blue hover:opacity-90" to="/profile">
                      {user?.name || 'Perfil'}
                    </Link>
                  </li>
                  <li>
                    <button onClick={logout} className="text-gold-shadow-blue hover:opacity-90">
                      Salir
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li><Link className="btn btn-red" to="/register">Registrarse</Link></li>
                  <li><Link className="btn btn-blue" to="/login">Ingresar</Link></li>
                </>
              )}
            </ul>
          </div>

          <div className="flex items-center gap-4 md:hidden">
            <button onClick={() => setOpen(!open)} aria-label="Abrir menú">
              <ion-icon name={open ? 'close' : 'menu'} className="text-3xl text-gold"></ion-icon>
            </button>
          </div>
        </nav>
      </div>

      <div className="h-3 bg-gold" />
    </header>
  );
}
