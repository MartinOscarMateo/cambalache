import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, getPostsByUser, deletePost } from '../lib/api.js';

export default function MyPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPost, setSelectedPost] = useState(null); // para el modal

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setUserId(me._id || me.id);
      } catch (err) {
        setError(err.message || 'Error cargando usuario');
      }
    })();
  }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        setLoading(true);
        // trae todas las publicaciones del usuario (active, paused, traded)
        const res = await getPostsByUser(userId, { page: 1, limit: 50, status: 'all' });
        const items = Array.isArray(res.items) ? res.items : res;
        setPosts(items);
      } catch (err) {
        setError(err.message || 'Error cargando publicaciones');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // confirm de borrado
  async function handleDeleteConfirm() {
    if (!selectedPost) return;
    try {
      await deletePost(selectedPost._id);
      setSuccess('Publicación eliminada correctamente');
      setPosts(prev => prev.filter(p => p._id !== selectedPost._id));
      setSelectedPost(null);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message || 'Error al eliminar la publicación');
    }
  }

  // estado con paleta
  function StatusPill({ status }) {
    const s = String(status || '').toLowerCase();
    const map = {
      active: { bg: 'bg-[color:var(--c-mid-cyan)]/30', text: 'Activa' },
      paused: { bg: 'bg-[color:var(--c-accent)]/40', text: 'Pausada' },
      traded: { bg: 'bg-slate-200', text: 'Trueque realizado' }
    };
    const cfg = map[s] || map.traded;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${cfg.bg}`}
        style={{ color: 'var(--c-text)' }}
      >
        {cfg.text}
      </span>
    );
  }

  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4 py-10"
        style={{ background: '#f6f2ff' }}
      >
        <p style={{ color: 'var(--c-text)' }}>Cargando…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4 py-10"
        style={{ background: '#f6f2ff' }}
      >
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: '#f6f2ff' }}>
      <div className="max-w-6xl mx-auto">
        {/* encabezado */}
        <header className="mb-6">
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: 'var(--c-brand)' }}
          >
            Mis publicaciones
          </h1>

          <p className="mt-1 text-sm" style={{ color: 'var(--c-text)' }}>
            Administra lo que ofreces y revisa el estado de tus trueques.
          </p>
        </header>

        {/* alertas */}
        {success && (
          <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-800 text-sm">
            {success}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center border border-[color:var(--c-mid-blue)]/60 shadow-[0_10px_30px_rgba(0,0,0,.12)]">
            <p style={{ color: 'var(--c-text)' }}>No tenes publicaciones creadas.</p>
            <button
              onClick={() => navigate('/posts/create')}
              className="mt-4 px-4 py-2 rounded-xl font-semibold text-white hover:brightness-110 transition"
              style={{ background: 'var(--c-text)' }}
            >
              Crear publicacion
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white border border-[color:var(--c-mid-blue)]/60 shadow-[0_10px_30px_rgba(0,0,0,.12)]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[color:var(--c-mid-blue)]/20">
                <tr>
                  <th className="p-3 text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
                    Imagen
                  </th>
                  <th className="p-3 text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
                    Titulo
                  </th>
                  <th className="p-3 text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
                    Fecha
                  </th>
                  <th className="p-3 text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
                    Estado
                  </th>
                  <th
                    className="p-3 text-right text-sm font-semibold"
                    style={{ color: 'var(--c-text)' }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {posts.map(p => {
                  const isTraded = String(p.status || '').toLowerCase() === 'traded';

                  return (
                    <tr
                      key={p._id}
                      className="border-t border-[color:var(--c-mid-blue)]/40 hover:bg-[color:var(--c-mid-blue)]/10"
                    >
                      <td className="p-3">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div
                            className="w-16 h-16 rounded-lg"
                            style={{
                              background:
                                'radial-gradient(60% 60% at 30% 30%, var(--c-accent), transparent 70%), radial-gradient(60% 60% at 70% 70%, var(--c-info), transparent 70%), #f6f6ff'
                            }}
                          />
                        )}
                      </td>
                      <td className="p-3">
                        <div className="max-w-xs">
                          <p
                            className="font-semibold truncate"
                            style={{ color: 'var(--c-text)' }}
                          >
                            {p.title}
                          </p>
                          {p.location && (
                            <p
                              className="text-xs mt-0.5 px-2 py-0.5 inline-block rounded-full bg-[color:var(--c-accent)]/35"
                              style={{ color: 'var(--c-text)' }}
                            >
                              Zona: {p.location}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleDateString('es-AR')
                          : '-'}
                      </td>
                      <td className="p-3">
                        <StatusPill status={p.status} />
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/posts/${p._id}`)}
                            className="px-3 py-1.5 rounded-xl text-sm font-semibold border border-[color:var(--c-mid-blue)]/60 hover:bg-[color:var(--c-mid-blue)]/15 transition"
                            style={{ color: 'var(--c-text)' }}
                          >
                            Ver
                          </button>

                          {!isTraded && (
                            <button
                              onClick={() => navigate(`/posts/${p._id}/edit`)}
                              className="px-3 py-1.5 rounded-xl text-sm font-semibold border border-[color:var(--c-info)]/60 hover:bg-[color:var(--c-info)]/15 transition"
                              style={{ color: 'var(--c-text)' }}
                            >
                              Editar
                            </button>
                          )}

                          {!isTraded && (
                            <button
                              onClick={() => setSelectedPost(p)}
                              className="px-3 py-1.5 rounded-xl text-sm font-semibold text-white hover:brightness-110 transition"
                              style={{ background: 'var(--c-brand)' }}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* modal de confirmacion */}
        {selectedPost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="w-[92%] max-w-sm rounded-2xl bg-white p-6 border border-[color:var(--c-mid-blue)]/60 shadow-[0_20px_60px_rgba(0,0,0,.25)]">
              <h2
                className="text-lg font-bold text-center"
                style={{ color: 'var(--c-brand)' }}
              >
                Eliminar publicacion
              </h2>
              <p className="text-sm mt-3 text-center" style={{ color: 'var(--c-text)' }}>
                Seguro que queres eliminar <strong>{selectedPost.title}</strong>?
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="px-4 py-2 rounded-xl font-semibold border border-[color:var(--c-mid-blue)]/60 hover:bg-[color:var(--c-mid-blue)]/15 transition"
                  style={{ color: 'var(--c-text)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 rounded-xl font-semibold text-white hover:brightness-110 transition"
                  style={{ background: 'var(--c-brand)' }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}