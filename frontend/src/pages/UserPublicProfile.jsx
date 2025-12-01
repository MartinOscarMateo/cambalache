// frontend/src/pages/UserPublicProfile.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPostsByUser } from '../lib/api.js';

export default function UserPublicProfile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState('');

  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  // carga los datos del usuario por id
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token') || '';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API}/api/users/${id}`, { headers });
        if (!res.ok) throw new Error('Usuario no encontrado');
        const json = await res.json();
        if (!active) return;
        setUser(json);
      } catch (e) {
        setError(e.message || 'Error cargando perfil');
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  // carga publicaciones
  useEffect(() => {
    if (!user) return;
    const uid = String(user._id || user.id || '');
    if (!uid) return;

    let active = true;
    (async () => {
      setPostsLoading(true);
      setPostsError('');
      try {
        const res = await getPostsByUser(uid, { page: 1, limit: 12 });
        const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
        if (!active) return;
        setPosts(items);
      } catch (e) {
        if (!active) return;
        setPostsError(e.message || 'No se pudieron cargar las publicaciones');
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
          <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  function initials() {
    const base = String(user.name || user.email || '').trim();
    if (!base) return 'C';
    const parts = base.split(' ').filter(Boolean);
    const a = parts[0]?.[0] || '';
    const b = parts[1]?.[0] || '';
    return (a + b).toUpperCase();
  }

  const uid = String(user._id || user.id || id || '');
  const postsCount = (typeof user.postsCount === 'number' ? user.postsCount : posts.length) || 0;

  const latoHeading = {
    fontFamily: '"Lato", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  };

  return (
    <main
      className="min-h-[85vh] px-4 py-8"
      style={{ background: 'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)' }}
    >
      <section className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,.55)] border border-[color:var(--c-mid-blue)]/60">
          {/* header */}
          <header className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-[color:var(--c-brand)] bg-white">
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
                    <span className="text-2xl font-bold" style={{ color: 'var(--c-text)', ...latoHeading }}>
                      {initials()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <h1
                className="text-3xl font-bold leading-tight"
                style={{ color: 'var(--c-text)', ...latoHeading }}
              >
                {user.name || user.email}
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--c-text)' }}>
                {user.email}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3 max-w-md">
                <Link
                  to={`/users/${uid}/followers`}
                  className="rounded-xl border border-[color:var(--c-mid-blue)]/60 px-3 py-2 text-center hover:bg-[color:var(--c-mid-blue)]/10 transition"
                >
                  <span className="block text-lg font-semibold text-[color:var(--c-brand)]" style={latoHeading}>
                    {user.followersCount ?? 0}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--c-text)' }}>Seguidores</span>
                </Link>

                <Link
                  to={`/users/${uid}/following`}
                  className="rounded-xl border border-[color:var(--c-mid-blue)]/60 px-3 py-2 text-center hover:bg-[color:var(--c-mid-blue)]/10 transition"
                >
                  <span className="block text-lg font-semibold text-[color:var(--c-brand)]" style={latoHeading}>
                    {user.followingCount ?? 0}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--c-text)' }}>Seguidos</span>
                </Link>

                <div className="rounded-xl border border-[color:var(--c-mid-blue)]/60 px-3 py-2 text-center bg-white/80">
                  <span className="block text-lg font-semibold text-[color:var(--c-brand)]" style={latoHeading}>
                    {user.tradesCount ?? 0}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--c-text)' }}>Trueques</span>
                </div>
              </div>
            </div>
          </header>

          {/* secciones */}
          <div className="mt-8 grid gap-6">
            <section className="rounded-xl bg-[color:var(--c-mid-pink)]/25 border border-[color:var(--c-mid-pink)]/60 p-4">
              <h3
                className="text-lg font-semibold mb-1"
                style={{ color: 'var(--c-brand)', ...latoHeading }}
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
                style={{ color: 'var(--c-brand)', ...latoHeading }}
              >
                Actividad
              </h3>
              <ul className="text-sm space-y-1" style={{ color: 'var(--c-text)' }}>
                <li>Publicaciones: {postsCount}</li>
                <li>Valoraciones: {user.ratingsCount ?? 0}</li>
              </ul>
            </section>

            {/* publicaciones del usuario */}
            <section className="rounded-xl border border-[color:var(--c-mid-blue)]/60 bg-white/90 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: 'var(--c-brand)', ...latoHeading }}
                >
                  Publicaciones
                </h3>
              </div>

              {postsLoading && (
                <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                  Cargando publicaciones…
                </p>
              )}
              {postsError && <p className="text-sm text-red-700">{postsError}</p>}

              {!postsLoading && !postsError && posts.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                  Este usuario aún no tiene publicaciones.
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
                          <span className="text-xs" style={{ color: 'var(--c-text)' }}>
                            Sin imagen
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-semibold line-clamp-2" style={{ color: 'var(--c-text)', ...latoHeading }}>
                        {p.title || 'Sin título'}
                      </h4>
                      <div className="mt-2 text-[11px] flex items-center gap-2 flex-wrap">
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
    </main>
  );
}