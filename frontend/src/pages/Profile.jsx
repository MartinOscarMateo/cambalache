import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMe } from '../lib/api.js';

export default function Profile() {
  const params = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        if (!params.id) {
          setUser(await getMe());
        } else {
          const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
          const token = localStorage.getItem('token') || '';
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await fetch(`${API}/api/users/${params.id}`, { headers });
          if (!res.ok) throw new Error('Usuario no encontrado');
          setUser(await res.json());
        }
      } catch (err) {
        setError(err.message || 'Error cargando perfil');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: 'var(--c-text)' }}>
        <p className="text-white">Cargando…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: 'var(--c-text)' }}>
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2">{error}</p>
      </main>
    );
  }

  if (!user) return null;

  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const myId = stored.id || stored._id;
  const viewingOwn = !params.id || String(params.id) === String(myId);

  function initials(text) {
    const base = String(user.name || user.email || '').trim();
    if (!base) return 'C';
    const parts = base.split(' ').filter(Boolean);
    const a = parts[0]?.[0] || '';
    const b = parts[1]?.[0] || '';
    return (a + b).toUpperCase();
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--c-text)' }}>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
          {viewingOwn && (
            <aside>
              <div className="rounded-2xl bg-white border border-[color:var(--c-mid-blue)]/60 shadow-[0_20px_60px_rgba(0,0,0,.2)] p-4">
                <h2
                  className="text-xl font-bold mb-3"
                  style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
                >
                  Acciones
                </h2>
                <nav className="flex flex-col gap-2">
                  <button
                    onClick={() => navigate('/profile/edit')}
                    className="w-full text-left rounded-lg px-3 py-2 transition hover:bg-[color:var(--c-mid-pink)]/35"
                    style={{ color: 'var(--c-text)' }}
                  >
                    Editar perfil
                  </button>
                  <button
                    onClick={() => navigate('/posts/manage')}
                    className="w-full text-left rounded-lg px-3 py-2 transition hover:bg-[color:var(--c-accent)]/35"
                    style={{ color: 'var(--c-text)' }}
                  >
                    Gestionar publicaciones
                  </button>
                  <button
                    onClick={() => navigate('/my-trades')}
                    className="w-full text-left rounded-lg px-3 py-2 transition hover:bg-[color:var(--c-mid-cyan)]/35"
                    style={{ color: 'var(--c-text)' }}
                  >
                    Gestionar trueques
                  </button>
                </nav>
              </div>
            </aside>
          )}

          <section>
            <div className="rounded-2xl bg-white border border-[color:var(--c-mid-blue)]/60 shadow-[0_20px_60px_rgba(0,0,0,.2)] p-6 md:p-8">
              <header className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-[color:var(--c-brand)]">
                    {user.avatar ? (
                      <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full grid place-items-center"
                        style={{
                          background:
                            'radial-gradient(60% 60% at 30% 30%, var(--c-accent), transparent 70%), radial-gradient(60% 60% at 70% 70%, var(--c-info), transparent 70%), #f6f6ff'
                        }}
                      >
                        <span className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>{initials()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <h1
                    className="text-3xl font-bold leading-tight"
                    style={{ color: 'var(--c-text)' }}
                  >
                    {user.name || user.email}
                  </h1>
                  <p className="mt-1 text-sm" style={{ color: 'var(--c-text)' }}>{user.email}</p>

                  <div className="mt-4 grid grid-cols-3 gap-3 max-w-md">
                    <button
                      onClick={() => navigate(`/users/${params.id || myId}/followers`)}
                      className="rounded-xl border border-[color:var(--c-mid-blue)]/60 px-3 py-2 text-center hover:bg-[color:var(--c-mid-blue)]/20"
                    >
                      <span className="block text-lg font-semibold text-[color:var(--c-brand)]">
                        {user.followersCount ?? 0}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--c-text)' }}>Seguidores</span>
                    </button>

                    <button
                      onClick={() => navigate(`/users/${params.id || myId}/following`)}
                      className="rounded-xl border border-[color:var(--c-mid-blue)]/60 px-3 py-2 text-center hover:bg-[color:var(--c-mid-blue)]/20"
                    >
                      <span className="block text-lg font-semibold text-[color:var(--c-brand)]">
                        {user.followingCount ?? 0}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--c-text)' }}>Seguidos</span>
                    </button>

                    <div className="rounded-xl border border-[color:var(--c-mid-blue)]/60 px-3 py-2 text-center">
                      <span className="block text-lg font-semibold text-[color:var(--c-brand)]">
                        {user.tradesCount ?? 0}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--c-text)' }}>Trueques</span>
                    </div>
                  </div>
                </div>
              </header>

              <div className="mt-8 grid gap-6">
                <section className="rounded-xl bg-[color:var(--c-mid-pink)]/25 border border-[color:var(--c-mid-pink)]/60 p-4">
                  <h3
                    className="text-lg font-semibold mb-1"
                    style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
                  >
                    Acerca de
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                    {user.bio || 'Sin descripción aún.'}
                  </p>
                </section>

                <section className="rounded-xl bg-[color:var(--c-info)]/20 border border-[color:var(--c-info)]/50 p-4">
                  <h3
                    className="text-lg font-semibold mb-1"
                    style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
                  >
                    Actividad
                  </h3>
                  <ul className="text-sm space-y-1" style={{ color: 'var(--c-text)' }}>
                    <li>Publicaciones: {user.postsCount ?? 0}</li>
                    <li>Valoraciones: {user.ratingsCount ?? 0}</li>
                  </ul>
                </section>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}