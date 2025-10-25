// frontend/src/components/NavBar.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo-svg.svg';
import { getMe } from '../lib/api.js';

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token');

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      if (!token) {
        setMe(null);
        return;
      }
      try {
        const data = await getMe();
        if (!mounted) return;
        setMe(data);
        localStorage.setItem('user', JSON.stringify(data));
      } catch {
        // token invalido o 401 -limpiar sesion
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setMe(null);
      }
    }
    hydrate();
    return () => { mounted = false; };
  }, [token]);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
    setOpen(false);
  }

  function isActive(path) {
    return location.pathname === path;
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
          {/* logo */}
          <div className="flex items-center">
            <Link to="/" onClick={() => setOpen(false)}>
              <img
                src={logo}
                alt="Logo Cambalache"
                className="h-10 md:h-12 hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>

          {/* menu */}
          <div
            className={`md:static fixed md:min-h-fit min-h-[50vh] left-0 ${
              open ? 'top-[72px]' : '-top-full'
            } md:w-auto w-full flex items-center px-5 bg-[#2727d1] md:bg-transparent z-[1001]`}
          >
            <ul className="flex md:flex-row flex-col md:items-center md:gap-[4vw] gap-6 w-full md:w-auto text-white text-base">
              <li>
                <Link
                  className={`hover:text-[#ffdb3e] ${isActive('/') ? 'underline' : ''}`}
                  to="/"
                  onClick={() => setOpen(false)}
                >
                  inicio
                </Link>
              </li>

              <li>
                <Link
                  className={`hover:text-[#ffdb3e] ${isActive('/posts') ? 'underline' : ''}`}
                  to="/posts"
                  onClick={() => setOpen(false)}
                >
                  publicaciones
                </Link>
              </li>

              {token && (
                <li>
                  <Link
                    className={`hover:text-[#ffdb3e] ${isActive('/posts/create') ? 'underline' : ''}`}
                    to="/posts/create"
                    onClick={() => setOpen(false)}
                  >
                    crear
                  </Link>
                </li>
              )}

              {/* admin solo si role === 'admin' */}
              {token && me?.role === 'admin' && (
                <li>
                  <Link
                    className={`hover:text-[#ffdb3e] ${location.pathname.startsWith('/admin') ? 'underline' : ''}`}
                    to="/admin/users"
                    onClick={() => setOpen(false)}
                  >
                    admin
                  </Link>
                </li>
              )}

              {token ? (
                <>
                  <li>
                    <Link
                      className={`hover:text-[#ffdb3e] ${isActive('/chats') ? 'underline' : ''}`}
                      to="/chats"
                      onClick={() => setOpen(false)}
                    >
                      chats
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={`hover:text-[#ffdb3e] ${isActive('/profile') ? 'underline' : ''}`}
                      to="/profile"
                      onClick={() => setOpen(false)}
                    >
                      {me?.name || 'perfil'}
                    </Link>
                  </li>
                  <li>
                    <button onClick={logout} className="hover:text-[#ffdb3e]">salir</button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link className="hover:text-[#ffdb3e]" to="/register" onClick={() => setOpen(false)}>registrarse</Link>
                  </li>
                  <li>
                    <Link className="hover:text-[#ffdb3e]" to="/login" onClick={() => setOpen(false)}>ingresar</Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* toggle movil */}
          <div className="flex items-center gap-4 md:hidden">
            <button onClick={() => setOpen(!open)} aria-label="abrir menu">
              <ion-icon name={open ? 'close' : 'menu'} className="text-3xl text-white"></ion-icon>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}