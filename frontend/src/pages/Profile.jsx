import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getMe, getPostsByUser } from '../lib/api.js';

export default function Profile() {
  const params = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState('');

  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    (async () => {
      try {
        if (!params.id) {
          setUser(await getMe());
        } else {
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

  // Carga de publicaciones del usuario con endpoints de fallback comunes
  useEffect(() => {
    if (!user) return;
    const uid = String(user._id || user.id || '');
    if (!uid) return;

    let active = true;
    (async () => {
      setPostsLoading(true);
      setPostsError('');
      try {
        // usa la capa de api centralizada para implementar los fallbacks correctos xd
        const env = await getPostsByUser(uid, { page: 1, limit: 18 });
        if (!active) return;
        setPosts(Array.isArray(env?.items) ? env.items : []);
      } catch (e) {
        if (!active) return;
        setPostsError('No se pudieron cargar las publicaciones');
        setPosts([]);
      } finally {
        if (active) setPostsLoading(false);
      }
    })();

    return () => { active = false; };
  }, [user]);

  if (loading) {
    return (
      <main
        className="min-h-[85vh] flex items-center justify-center px-4 py-10"
        style={{ background: 'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)' }}
      >
        <div className="rounded-2xl bg-white/95 px-6 py-4 shadow-[0_18px_50px_rgba(0,0,0,.45)] border border-[color:var(--c-mid-blue)]/50">
          <p style={{ color: 'var(--c-text)' }}>Cargando…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        className="min-h-[85vh] flex items-center justify-center px-4 py-10"
        style={{ background: 'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)' }}
      >
        <div className="rounded-2xl bg-white/95 px-6 py-4 shadow-[0_18px_50px_rgba(0,0,0,.45)] border border-red-200">
          <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2">{error}</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const myId = stored.id || stored._id;
  const viewingOwn = !params.id || String(params.id) === String(myId);

  function initials() {
    const base = String(user.name || user.email || '').trim();
    if (!base) return 'C';
    const parts = base.split(' ').filter(Boolean);
    const a = parts[0]?.[0] || '';
    const b = parts[1]?.[0] || '';
    return (a + b).toUpperCase();
  }

  const postsCount = (typeof user.postsCount === 'number' ? user.postsCount : posts.length) || 0;

  // avatar blob = se ignora y se usa fallback xddd me dio altos errores eso jajaja
  const safeAvatar =
    typeof user.avatar === 'string' &&
    user.avatar &&
    !user.avatar.startsWith('blob:') &&
    !user.avatar.startsWith('data:')
      ? user.avatar
      : '';

  return (
    <main
      className="min-h-[85vh] px-4 py-8"
      style={{ background: 'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)' }}
    >
      <section className="max-w-5xl mx-auto">
        <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,.55)] border border-[color:var(--c-mid-blue)]/60">
          <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
            {viewingOwn && (
              <aside>
                <div className="rounded-2xl bg-white/95 border border-[color:var(--c-mid-blue)]/50 shadow-[0_18px_45px_rgba(0,0,0,.18)] p-4">
                  <h2
                    className="text-xl font-bold mb-3 px-3"
                    style={{ color: 'var(--c-brand)' }}
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
                      onClick={() => navigate('/trades')}
                      className="w-full text-left rounded-lg px-3 py-2 transition hover:bg-[color:var(--c-mid-cyan)]/35"
                      style={{ color: 'var(--c-text)' }}
                    >
                      Gestionar trueques
                    </button>
                  </nav>
                </div>
              </aside>
            )}

            <section className={!viewingOwn ? 'md:col-span-2' : ''}>
              <div className="rounded-2xl bg-white/95 border border-[color:var(--c-mid-blue)]/50 shadow-[0_18px_60px_rgba(0,0,0,.25)] p-6 md:p-8">
                <header className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-[color:var(--c-brand)] bg-white">
                      {safeAvatar ? (
                        <img src={safeAvatar} alt="avatar" className="w-full h-full object-cover" />
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
                    <h1 className="text-3xl font-bold leading-tight" style={{ color: 'var(--c-text)' }}>
                      {user.name || user.email}
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: 'var(--c-text)' }}>{user.email}</p>

                    <div className="mt-4 grid grid-cols-3 gap-3 max-w-md">
                      <button
                        onClick={() => navigate(`/users/${params.id || myId}/followers`)}
                        className="rounded-xl border border-[color:var(--c-mid-blue)]/60 px-3 py-2 text-center hover:bg-[color:var(--c-mid-blue)]/10 transition"
                      >
                        <span className="block text-lg font-semibold text-[color:var(--c-brand)]">
                          {user.followersCount ?? 0}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--c-text)' }}>Seguidores</span>
                      </button>

                      <button
                        onClick={() => navigate(`/users/${params.id || myId}/following`)}
                        className="rounded-xl border border-[color:var(--c-mid-blue)]/60 px-3 py-2 text-center hover:bg-[color:var(--c-mid-blue)]/10 transition"
                      >
                        <span className="block text-lg font-semibold text-[color:var(--c-brand)]">
                          {user.followingCount ?? 0}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--c-text)' }}>Seguidos</span>
                      </button>

                      <div className="rounded-xl border border-[color:var(--c-mid-blue)]/60 px-3 py-2 text-center bg-white/80">
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
                      style={{ color: 'var(--c-brand)' }}
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
                      style={{ color: 'var(--c-brand)' }}
                    >
                      Actividad
                    </h3>
                    <ul className="text-sm space-y-1" style={{ color: 'var(--c-text)' }}>
                      <li>
                        <p>Publicaciones: {postsCount}</p>
                      </li>
                      <li className="mt-2">
                        <p className="me-2">Valoraciones: {user.ratingCount}</p>
                      </li>
                      <li className="flex items-center gap-1">
                        <p className="me-2">Calificación: {user.ratingAverage}</p>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            style={{
                              fontSize: '20px',
                              color: star <= Math.round(user.ratingAverage || 0) ? '#ffc107' : '#ccc'
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </li>
                    </ul>
                  </section>

                  {/* Publicaciones del usuario */}
                  <section className="rounded-xl border border-[color:var(--c-mid-blue)]/60 bg-white/90 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3
                        className="text-lg font-semibold"
                        style={{ color: 'var(--c-brand)' }}
                      >
                        Publicaciones
                      </h3>
                      {viewingOwn && (
                        <button
                          onClick={() => navigate('/posts/create')}
                          className="text-sm rounded-lg px-3 py-1.5 bg-[color:var(--c-brand)]/90 text-white hover:opacity-90"
                        >
                          Nueva publicación
                        </button>
                      )}
                    </div>

                    {postsLoading && <p className="text-sm" style={{ color: 'var(--c-text)' }}>Cargando publicaciones…</p>}
                    {postsError && <p className="text-sm text-red-700">{postsError}</p>}

                    {!postsLoading && !postsError && posts.length === 0 && (
                      <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                        {viewingOwn ? 'Aún no creaste publicaciones.' : 'Este usuario aún no tiene publicaciones.'}
                      </p>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {posts.map((p) => (
                        <Link
                          key={String(p._id || p.id)}
                          to={`/posts/${String(p._id || p.id)}`}
                          className="group rounded-2xl overflow-hidden border border-[color:var(--c-mid-blue)]/40 bg-white shadow-[0_14px_35px_rgba(0,0,0,.14)] hover:shadow-[0_18px_45px_rgba(0,0,0,.2)] transition"
                        >
                          <div className="aspect-[4/3] bg-[color:var(--c-mid-blue)]/10">
                            {p.images?.[0] ? (
                              <img
                                src={p.images[0]}
                                alt={p.title || 'Publicación'}
                                className="w-full h-full object-cover group-hover:scale-[1.02] transition"
                              />
                            ) : (
                              <div className="w-full h-full grid place-items-center">
                                <span className="text-xs" style={{ color: 'var(--c-text)' }}>Sin imagen</span>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className="text-sm font-semibold line-clamp-2" style={{ color: 'var(--c-text)' }}>
                              {p.title || 'Sin título'}
                            </h4>
                            <div className="mt-2 text-[11px] flex flex-wrap items-center gap-2">
                              {p.status && (
                                <span className="px-3 py-1 rounded-full bg-[color:var(--c-mid-cyan)]/30 border border-[color:var(--c-mid-cyan)]/60 text-[color:var(--c-text)]">
                                  {String(p.status)}
                                </span>
                              )}
                              {Array.isArray(p.categories) && p.categories[0] && (
                                <span className="px-3 py-1 rounded-full bg-[color:var(--c-mid-pink)]/30 border border-[color:var(--c-mid-pink)]/60 text-[color:var(--c-text)]">
                                  {p.categories[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}