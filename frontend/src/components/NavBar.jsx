// frontend/src/components/NavBar.jsx
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo-svg.svg';
import { getMe } from '../lib/api.js';
import '../styles/components/navbar.css';

export default function NavBar() {
  const [open, setOpen] = useState(false); // estado drawer mobile
  const [me, setMe] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [menuUserOpen, setMenuUserOpen] = useState(false); // estado menu avatar
  const [unreadChats, setUnreadChats] = useState(0); // contador chats no leidos
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
    // cierra menu usuario al click fuera
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

  const avatarSrc =
    me?.avatar &&
    typeof me.avatar === 'string' &&
    !me.avatar.startsWith('blob:') &&
    !me.avatar.startsWith('data:')
      ? me.avatar
      : 'https://i.pravatar.cc/40';

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
          {/* izquierda: logo */}
          <div className="flex items-center">
            <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
              <img
                src={logo}
                alt="Logo Cambalache"
                className="h-9 md:h-10 hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>

          {/* centro: links principales con pildora activa */}
          <div className="hidden md:flex">
            <ul className="flex items-center gap-2 text-[15px]">
              <li>
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className={`nav-pill ${isActive('/') ? 'nav-pill--active' : 'text-[#f6f2ff] hover:text-[#ffdb3e]'}`}
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  to="/posts"
                  onClick={() => setOpen(false)}
                  className={`nav-pill ${isActive('/posts') ? 'nav-pill--active' : 'text-[#f6f2ff] hover:text-[#ffdb3e]'}`}
                >
                  Publicaciones
                </Link>
              </li>
              <li>
                <Link
                  to="/mapa"
                  onClick={() => setOpen(false)}
                  className={`nav-pill ${isActive('/mapa') ? 'nav-pill--active' : 'text-[#f6f2ff] hover:text-[#ffdb3e]'}`}
                >
                  Mapa
                </Link>
              </li>
            </ul>
          </div>

          {/* derecha: botones e iconos */}
          <div className="hidden md:flex items-center gap-4">
            {!token && (
              <>
                <Link to="/register" className="btn-nav btn-nav--cyan">Registrarse</Link>
                <Link to="/login" className="btn-nav btn-nav--pink">Ingresar</Link>
              </>
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
                  className="relative nav-icon text-[#ffdb3e] cursor-default opacity-90"
                >
                  <ion-icon name="notifications" className="text-2xl align-middle"></ion-icon>
                </button>

                {/* avatar y menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuUserOpen(v => !v)}
                    aria-haspopup="menu"
                    aria-expanded={menuUserOpen ? 'true' : 'false'}
                    aria-label="menu usuario"
                    className="flex items-center"
                  >
                    <img
                      src={avatarSrc}
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
                        Perfil
                      </Link>
                      {me?.role === 'admin' && (
                        <Link to="/admin/users" className="block px-3 py-2 hover:bg-gray-100" onClick={() => setMenuUserOpen(false)}>
                          Admin
                        </Link>
                      )}
                      <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={logout}>
                        Salir
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* hamburguesa mobile */}
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

      {/* drawer mobile */}
      <div
        id="mobile-drawer"
        className={`md:hidden fixed left-0 ${open ? 'top-[56px]' : '-top-full'} w-full bg-[#2727d1] z-[1001] transition-all`}
      >
        <ul className="flex flex-col gap-4 px-5 py-5 text-[#f6f2ff] text-base">
          <li>
            <Link className={`hover:text-[#ffdb3e] ${isActive('/') ? 'text-[#ffdb3e] underline' : ''}`} to="/" onClick={() => setOpen(false)}>
              Inicio
            </Link>
          </li>
          <li>
            <Link className={`hover:text-[#ffdb3e] ${isActive('/posts') ? 'text-[#ffdb3e] underline' : ''}`} to="/posts" onClick={() => setOpen(false)}>
              Publicaciones
            </Link>
          </li>
          <li>
            <Link className={`hover:text-[#ffdb3e] ${isActive('/mapa') ? 'text-[#ffdb3e] underline' : ''}`} to="/mapa" onClick={() => setOpen(false)}>
              Mapa
            </Link>
          </li>

          {!token && (
            <>
              <li>
                <Link className="btn-nav btn-nav--cyan inline-block w-max" to="/register" onClick={() => setOpen(false)}>
                  Registrarse
                </Link>
              </li>
              <li>
                <Link className="btn-nav btn-nav--pink inline-block w-max" to="/login" onClick={() => setOpen(false)}>
                  Ingresar
                </Link>
              </li>
            </>
          )}

          {token && (
            <>
              <li>
                <Link className={`hover:text-[#ffdb3e] ${isActive('/posts/create') ? 'text-[#ffdb3e] underline' : ''}`} to="/posts/create" onClick={() => setOpen(false)}>
                  Crear
                </Link>
              </li>
              <li>
                <Link className={`hover:text-[#ffdb3e] ${isActive('/chats') ? 'text-[#ffdb3e] underline' : ''}`} to="/chats" onClick={() => setOpen(false)}>
                  Chats
                </Link>
              </li>
              <li className="flex items-center gap-2 text-[#ffdb3e]">
                <ion-icon name="notifications" className="text-xl align-middle"></ion-icon>
                <span>Notificaciones</span>
              </li>
              <li>
                <Link className={`hover:text-[#ffdb3e] ${isActive('/profile') ? 'text-[#ffdb3e] underline' : ''}`} to="/profile" onClick={() => setOpen(false)}>
                  Perfil
                </Link>
              </li>
              {me?.role === 'admin' && (
                <li>
                  <Link className="hover:text-[#ffdb3e]" to="/admin/users" onClick={() => setOpen(false)}>
                    Admin
                  </Link>
                </li>
              )}
              <li>
                <button onClick={logout} className="hover:text-[#ffdb3e]">
                  Salir
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </header>
  );
}