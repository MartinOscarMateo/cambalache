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
    setOpen(false);
  }

  return (
    <header className="bg-gold relative">
      {/* Overlay móvil por detrás del panel */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-[1000] md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="bg-red py-4 md:py-5 relative z-[1001]">
        <nav className="flex justify-between items-center w-[92%] mx-auto">
          {/* Brand */}
          <div className="flex items-center">
            <Link to="/" className="text-gold-shadow-blue text-xl md:text-2xl hover:opacity-90">
              <span className="milonga font-normal">Cambalache</span>
            </Link>
          </div>

          {/* Menú */}
          <div
            className={`md:static fixed md:min-h-fit min-h-[50vh] left-0 ${
              open ? 'top-[72px]' : '-top-full'
            } md:w-auto w-full flex items-center px-5 bg-red md:bg-transparent z-[1001]`}
          >
            <ul className="flex md:flex-row flex-col md:items-center md:gap-[4vw] gap-6 w-full md:w-auto">
              <li><Link className="text-gold-shadow-blue hover:opacity-90" to="/" onClick={() => setOpen(false)}>Inicio</Link></li>
              <li><Link className="text-gold-shadow-blue hover:opacity-90" to="/posts" onClick={() => setOpen(false)}>Publicaciones</Link></li>
              <li><Link className="text-gold-shadow-blue hover:opacity-90" to="/posts/create" onClick={() => setOpen(false)}>Crear</Link></li>

              {token ? (
                <>
                  <li>
                    <Link className="text-gold-shadow-blue hover:opacity-90" to="/chats" onClick={() => setOpen(false)}>
                      Chats
                    </Link>
                  </li>

                  <li>
                    <Link className="text-gold-shadow-blue hover:opacity-90" to="/profile" onClick={() => setOpen(false)}>
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
                  <li><Link className="btn btn-red" to="/register" onClick={() => setOpen(false)}>Registrarse</Link></li>
                  <li><Link className="btn btn-blue" to="/login" onClick={() => setOpen(false)}>Ingresar</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Toggle */}
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