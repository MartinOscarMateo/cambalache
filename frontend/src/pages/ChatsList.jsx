import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// id del otro participante
function otherOf(chat, myId) {
  return chat?.participants?.find?.(p => p && String(p._id || p.id) !== String(myId)) || null;
}

// formatear fecha corta
function shortWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString();
}

// iniciales si no hay avatar
function initials(name, email) {
  const base = String(name || email || 'U').trim();
  const parts = base.split(' ').filter(Boolean);
  const a = parts[0]?.[0] || 'U';
  const b = parts[1]?.[0] || '';
  return (a + b).toUpperCase();
}

export default function ChatsList() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = String(currentUser.id || currentUser._id || '');

  useEffect(() => {
    async function loadChats() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/chats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error al obtener los chats');
        const data = await res.json();
        setChats(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Error cargando chats');
      } finally {
        setLoading(false);
      }
    }
    loadChats();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#f6f2ff' }}>
        <p style={{ color: 'var(--c-text)' }}>Cargando chats…</p>
      </main>
    );
  }
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#f6f2ff' }}>
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2">{error}</p>
      </main>
    );
  }

  // filtrar y ordenar chats
  const filtered = chats.filter(c => {
    const other = otherOf(c, currentUserId);
    const name = String(other?.name || other?.email || '').toLowerCase();
    const last = String(c?.lastMessage || '').toLowerCase();
    const okQ = !q || name.includes(q.toLowerCase()) || last.includes(q.toLowerCase());
    const unread = Number(c?.unreadCount || 0) > 0;
    const okUnread = !onlyUnread || unread;
    return okQ && okUnread;
  });
  const sorted = filtered.sort((a, b) => {
    const da = new Date(a?.updatedAt || a?.lastMessageAt || 0).getTime();
    const db = new Date(b?.updatedAt || b?.lastMessageAt || 0).getTime();
    return db - da;
  });

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: '#f6f2ff' }}>
      <div className="max-w-3xl mx-auto">
        {/* encabezado */}
        <header className="mb-4">
          <h1
            className="text-2xl font-bold text-center"
            style={{ color: 'var(--c-brand)' }}
          >
            Mis chats
          </h1>

          <p className="text-sm text-center mt-1" style={{ color: 'var(--c-text)' }}>
            Conversaciones para coordinar tus trueques.
          </p>
        </header>

        {/* barra de herramientas */}
        <div className="mb-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          {/* buscador */}
          <div className="flex-1">
            <label htmlFor="q" className="sr-only">Buscar</label>
            <input
              id="q"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar por nombre o ultimo mensaje…"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
            />
          </div>
          {/* filtro de no leidos */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyUnread(false)}
              className={`px-3 py-2 rounded-full text-sm font-semibold border transition ${
                !onlyUnread
                  ? 'bg-[color:var(--c-mid-cyan)]/20 border-[color:var(--c-mid-cyan)]/40'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
              style={{ color: 'var(--c-text)' }}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setOnlyUnread(true)}
              className={`px-3 py-2 rounded-full text-sm font-semibold border transition ${
                onlyUnread
                  ? 'bg-[color:var(--c-mid-pink)]/30 border-[color:var(--c-mid-pink)]/60'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
              style={{ color: 'var(--c-text)' }}
            >
              Sin leer
            </button>
          </div>
        </div>

        {/* contenedor lista */}
        <section className="rounded-2xl bg-white p-2 sm:p-3 border border-[color:var(--c-mid-blue)]/60 shadow-[0_10px_30px_rgba(0,0,0,.12)]">
          {sorted.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: 'var(--c-text)' }}>
              No hay conversaciones.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {sorted.map(chat => {
                const other = otherOf(chat, currentUserId);
                if (!other) return null;

                const unreadCount = Number(chat?.unreadCount || 0);
                const when = shortWhen(chat?.updatedAt || chat?.lastMessageAt);
                const last = chat?.lastMessage || 'Sin mensajes';

                return (
                  <li key={chat._id}>
                    {/* card clickeable */}
                    <button
                      onClick={() => navigate(`/chat/${other._id || other.id}`)}
                      className="w-full text-left grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-transparent hover:border-[color:var(--c-mid-blue)]/60 hover:bg-[color:var(--c-mid-blue)]/10 transition px-3 py-3"
                    >
                      {/* avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[color:var(--c-brand)] bg-gray-200">
                          {other.avatar ? (
                            <img src={other.avatar} alt={other.name || 'Usuario'} className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className="w-full h-full grid place-items-center text-sm font-bold"
                              style={{
                                color: 'var(--c-text)',
                                background:
                                  'radial-gradient(60% 60% at 30% 30%, var(--c-accent), transparent 70%), radial-gradient(60% 60% at 70% 70%, var(--c-info), transparent 70%), #f6f6ff'
                              }}
                            >
                              {initials(other.name, other.email)}
                            </div>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full grid place-items-center text-[10px] font-bold text-white bg-[color:var(--c-brand)]">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>

                      {/* texto */}
                      <div className="min-w-0">
                        <p className="font-semibold truncate" style={{ color: 'var(--c-text)' }}>
                          {other.name || 'Usuario'}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{last}</p>
                      </div>

                      {/* pastilla hora/fecha */}
                      <div className="shrink-0">
                        <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-[color:var(--c-accent)]/40 text-[color:var(--c-text)]">
                          {when}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}