// frontend/src/components/NavBar.jsx
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo-svg.svg';
import { getMe } from '../lib/api.js';

export default function NavBar() {
  const [open, setOpen] = useState(false); // estado del drawer mobile
  const [me, setMe] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [menuUserOpen, setMenuUserOpen] = useState(false); // estado del menu del avatar
  const [unreadChats, setUnreadChats] = useState(0); // contador simple de chats no leidos
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setMe(null);
      }
    }
    hydrate();
    return () => { mounted = false; };
  }, [token]);

  useEffect(() => {
    // cierra menu usuario al hacer click fuera
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuUserOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
    setOpen(false);
    setMenuUserOpen(false);
  }

  function isActive(path) {
    return location.pathname === path;
  }

  return (
    <header className="bg-[#2727d1] font-['lato']">
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-[1000] md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="py-3 md:py-4 relative z-[1001]">
        <nav className="flex justify-between items-center w-[92%] mx-auto">
          {/* zona izquierda: logo */}
          <div className="flex items-center">
            <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
              <img
                src={logo}
                alt="Logo Cambalache"
                className="h-9 md:h-10 hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>

          {/* zona centro: links principales */}
          <div className="hidden md:flex">
            <ul className="flex items-center gap-8 text-[#f6f2ff] text-[15px]">
              <li>
                <Link
                  className={`hover:text-[#ffdb3e] ${isActive('/') ? 'text-[#ffdb3e] underline' : ''}`}
                  to="/"
                >
                  inicio
                </Link>
              </li>
              <li>
                <Link
                  className={`hover:text-[#ffdb3e] ${isActive('/posts') ? 'text-[#ffdb3e] underline' : ''}`}
                  to="/posts"
                >
                  publicaciones
                </Link>
              </li>
              <li>
                <Link
                  className={`hover:text-[#ffdb3e] ${isActive('/mapa') ? 'text-[#ffdb3e] underline' : ''}`}
                  to="/mapa"
                >
                  mapa
                </Link>
              </li>
            </ul>
          </div>

          {/* zona derecha: iconos y avatar */}
          <div className="hidden md:flex items-center gap-5 text-white">
            {!token && (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-md bg-[#ff52b9] hover:opacity-90 transition-opacity"
              >
                ingresar
              </Link>
            )}

            {token && (
              <>
                {/* crear publicacion */}
                <Link to="/posts/create" aria-label="crear publicacion" title="crear publicacion" className="relative nav-icon text-[#ff52b9]">
                  <ion-icon name="add-circle" className="text-2xl align-middle"></ion-icon>
                </Link>

                {/* chats */}
                <Link to="/chats" aria-label="chats" title="chats" className="relative nav-icon text-[#00afe7]">
                  <ion-icon name="chatbubbles" className="text-2xl align-middle"></ion-icon>
                  {unreadChats > 0 && <span className="nav-badge">{unreadChats}</span>}
                </Link>

                {/* notificaciones */}
                <button
                  type="button"
                  aria-label="notificaciones"
                  title="notificaciones"
                  aria-disabled="true"
                  className="relative nav-icon text-[#ffdb3e] cursor-default opacity-90">
                  <ion-icon name="notifications" className="text-2xl align-middle"></ion-icon>
                </button>

                {/* avatar y menu de cuenta */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuUserOpen(v => !v)}
                    aria-haspopup="menu"
                    aria-expanded={menuUserOpen ? 'true' : 'false'}
                    aria-label="menu usuario"
                    className="flex items-center"
                  >
                    <img
                      src={me?.avatar || 'https://i.pravatar.cc/40'}
                      alt="avatar"
                      className="h-8 w-8 rounded-full ring-1 ring-white/30"
                    />
                  </button>

                  {menuUserOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-44 rounded-md bg-white text-sm text-gray-800 shadow-lg overflow-hidden"
                    >
                      <Link to="/profile" className="block px-3 py-2 hover:bg-gray-100" onClick={() => setMenuUserOpen(false)}>
                        perfil
                      </Link>
                      {me?.role === 'admin' && (
                        <Link to="/admin/users" className="block px-3 py-2 hover:bg-gray-100" onClick={() => setMenuUserOpen(false)}>
                          admin
                        </Link>
                      )}
                      <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={logout}>
                        salir
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* boton hamburguesa - mobile */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={() => setOpen(!open)}
              aria-label="abrir menu"
              aria-expanded={open ? 'true' : 'false'}
              aria-controls="mobile-drawer"
            >
              <ion-icon name={open ? 'close' : 'menu'} className="text-3xl text-white"></ion-icon>
            </button>
          </div>
        </nav>
      </div>

      {/* drawer mobile: basicamnente tiene todo xddd*/}
      <div
        id="mobile-drawer"
        className={`md:hidden fixed left-0 ${open ? 'top-[56px]' : '-top-full'} w-full bg-[#2727d1] z-[1001] transition-all`}
      >
        <ul className="flex flex-col gap-4 px-5 py-5 text-[#f6f2ff] text-base">
          <li>
            <Link className={`hover:text-[#ffdb3e] ${isActive('/') ? 'text-[#ffdb3e] underline' : ''}`} to="/" onClick={() => setOpen(false)}>
              inicio
            </Link>
          </li>
          <li>
            <Link className={`hover:text-[#ffdb3e] ${isActive('/posts') ? 'text-[#ffdb3e] underline' : ''}`} to="/posts" onClick={() => setOpen(false)}>
              publicaciones
            </Link>
          </li>
          <li>
            <Link className={`hover:text-[#ffdb3e] ${isActive('/mapa') ? 'text-[#ffdb3e] underline' : ''}`} to="/mapa" onClick={() => setOpen(false)}>
              mapa
            </Link>
          </li>

          {!token && (
            <>
              <li>
                <Link className="hover:text-[#ffdb3e]" to="/login" onClick={() => setOpen(false)}>
                  ingresar
                </Link>
              </li>
              <li>
                <Link className="hover:text-[#ffdb3e]" to="/register" onClick={() => setOpen(false)}>
                  registrarse
                </Link>
              </li>
            </>
          )}

          {token && (
            <>
              <li>
                <Link className={`hover:text-[#ffdb3e] ${isActive('/posts/create') ? 'text-[#ffdb3e] underline' : ''}`} to="/posts/create" onClick={() => setOpen(false)}>
                  crear
                </Link>
              </li>
              <li>
                <Link className={`hover:text-[#ffdb3e] ${isActive('/chats') ? 'text-[#ffdb3e] underline' : ''}`} to="/chats" onClick={() => setOpen(false)}>
                  chats
                </Link>
              </li>
              <li className="flex items-center gap-2 text-[#ffdb3e]">
                <ion-icon name="notifications-outline" className="text-xl align-middle"></ion-icon>
                <span>notificaciones</span>
              </li>
              <li>
                <Link className={`hover:text-[#ffdb3e] ${isActive('/profile') ? 'text-[#ffdb3e] underline' : ''}`} to="/profile" onClick={() => setOpen(false)}>
                  perfil
                </Link>
              </li>
              {me?.role === 'admin' && (
                <li>
                  <Link className="hover:text-[#ffdb3e]" to="/admin/users" onClick={() => setOpen(false)}>
                    admin
                  </Link>
                </li>
              )}
              <li>
                <button onClick={logout} className="hover:text-[#ffdb3e]">
                  salir
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </header>
  );
}