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
        const res = await getPostsByUser(userId, { page: 1, limit: 50 });
        const items = Array.isArray(res.items) ? res.items : res;
        setPosts(items);
      } catch (err) {
        setError(err.message || 'Error cargando publicaciones');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

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

  if (loading) return <main className="p-6"><p>Cargando…</p></main>;
  if (error) return <main className="p-6"><p className="text-red-600">{error}</p></main>;

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Mis publicaciones</h1>

      {success && (
        <div className="mb-4 p-3 rounded bg-green-100 text-green-700 border border-green-300">
          {success}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="text-gray-600">No tenés publicaciones creadas.</p>
      ) : (
        <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3">Imagen</th>
                <th className="p-3">Título</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded" />
                    )}
                  </td>
                  <td className="p-3 font-medium text-gray-900">{p.title}</td>
                  <td className="p-3 text-gray-600 text-sm">
                    {new Date(p.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        p.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : p.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {p.status === 'active'
                        ? 'Activa'
                        : p.status === 'paused'
                        ? 'Pausada'
                        : 'Finalizada'}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-3">
                    <button
                      onClick={() => navigate(`/posts/${p._id}`)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => navigate(`/posts/${p._id}/edit`)}
                      className="text-yellow-600 hover:underline text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setSelectedPost(p)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center">
            <h2 className="text-lg font-semibold mb-3">Eliminar publicación</h2>
            <p className="text-gray-700 mb-6">
              ¿Seguro que querés eliminar <strong>{selectedPost.title}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}