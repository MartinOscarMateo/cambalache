// frontend/src/pages/PostDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostById, getPostsByUser } from '../lib/api.js';

function idOf(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v._id || v.id || v.userId || '';
  return String(v);
}

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [owner, setOwner] = useState(null);
  const [morePosts, setMorePosts] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getPostById(id);
        if (!active) return;

        const ownerId =
          idOf(data.ownerId) || idOf(data.userId) || idOf(data.authorId) ||
          idOf(data.owner) || idOf(data.user) || idOf(data.author);

        setPost({ ...data, ownerId });
        setIdx(0);

        const name = data.ownerName || data.owner?.name || data.user?.name || data.author?.name;
        const avatar = data.ownerAvatar || data.owner?.avatar || data.user?.avatar || data.author?.avatar;

        if (name || avatar) {
          setOwner({ _id: ownerId, name: name || 'Usuario', avatar: avatar || '' });
        } else if (ownerId) {
          const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
          const token = localStorage.getItem('token') || '';
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await fetch(`${API}/api/users/${ownerId}`, { headers });
          if (res.ok) {
            const u = await res.json();
            setOwner({ _id: u._id || u.id, name: u.name || u.email || 'Usuario', avatar: u.avatar || '' });
          } else {
            setOwner({ _id: ownerId, name: 'Usuario', avatar: '' });
          }
        } else {
          setOwner(null);
        }
      } catch (e) {
        setError(e.message || 'Error');
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    const uid = idOf(owner?._id) || idOf(post?.ownerId);
    if (!uid || !post?._id) return;
    getPostsByUser(uid, { page: 1, limit: 8 })
      .then(res => {
        const items = Array.isArray(res) ? res : (res.items || []);
        setMorePosts(items.filter(p => p._id !== post._id));
      })
      .catch(() => setMorePosts([]));
  }, [owner, post]);

  async function proposeTrade() {
    setInfo('');
    setError('');
    const me = JSON.parse(localStorage.getItem('user') || '{}');
    if (!me?.id && !me?._id) return setError('Necesitás iniciar sesión');
    const itemsText = window.prompt('¿Qué ofrecés a cambio?');
    if (itemsText === null) return;
    const text = String(itemsText).trim();
    if (!text) return setError('La propuesta no puede estar vacía');
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API}/api/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ postRequestedId: id, itemsText: text })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Error al proponer trueque');
      setInfo('Propuesta enviada');
    } catch (e) {
      setError(e.message || 'Error');
    }
  }

  function prev() {
    setIdx(p => (post?.images?.length ? (p - 1 + post.images.length) % post.images.length : 0));
  }
  function next() {
    setIdx(p => (post?.images?.length ? (p + 1) % post.images.length : 0));
  }

  const me = JSON.parse(localStorage.getItem('user') || '{}');
  const myId = me?.id || me?._id || '';
  const isOwner = String(owner?._id || '') === String(myId);

  if (loading) return <main className="container p-6"><p>Cargando…</p></main>;
  if (error) return <main className="container p-6"><p className="text-red-600">{error}</p></main>;
  if (!post) return <main className="container p-6"><p>No encontrado</p></main>;

  const images = Array.isArray(post.images) ? post.images : [];

  return (
    <main className="flex justify-center p-4 md:p-10 bg-gray-50">
      <article className="max-w-3xl w-full bg-white rounded-xl shadow-md overflow-hidden">
        {/* Galería */}
        <div className="relative z-0">
          {images.length > 0 && (
            <img
              src={images[idx]}
              alt={post.title}
              className="w-full max-h-[480px] object-cover"
            />
          )}
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 bg-black/40 text-white px-2 py-1 rounded-full z-10"
              >
                ‹
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 bg-black/40 text-white px-2 py-1 rounded-full z-10"
              >
                ›
              </button>
              <div className="flex gap-2 p-2 overflow-x-auto bg-white/80 justify-center">
                {images.map((u, i) => (
                  <img
                    key={i}
                    src={u}
                    onClick={() => setIdx(i)}
                    className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 ${i === idx ? 'border-gray-800' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Detalles */}
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{post.title}</h1>
            <p className="text-gray-500 text-sm">{post.category}</p>
          </div>

          <p className="text-gray-700 leading-relaxed">{post.description}</p>

          {isOwner ? (
            <p className="text-gray-500 text-center">Sos el dueño de esta publicación</p>
          ) : (
            <div className="flex justify-center mt-8">
              <button
                onClick={proposeTrade}
                className="px-8 py-3 bg-yellow-500 text-white font-semibold rounded-lg text-lg shadow-md hover:bg-yellow-600 transition"
              >
                Proponer trueque
              </button>
            </div>
          )}

          {info && <p className="text-green-600 text-center mt-3">{info}</p>}
          {error && <p className="text-red-600 text-center mt-3">{error}</p>}
        </div>

        {/* Propietario */}
        <div className="border-t px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
              {owner?.avatar && <img src={owner.avatar} alt="avatar" className="w-full h-full object-cover" />}
            </div>
            <div>
              <p className="font-semibold">{owner?.name || 'Usuario'}</p>
              <p className="text-sm text-gray-500">Propietario</p>
            </div>
          </div>
          {!isOwner && (
            <button className="px-4 py-1 border rounded-lg text-sm hover:bg-gray-100 transition">
              Seguir
            </button>
          )}
        </div>

        {/* Mas publis */}
        {morePosts.length > 0 && (
          <div className="border-t px-6 py-6 bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">Más publicaciones de este usuario</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {morePosts.map(p => (
                <div
                  key={p._id}
                  className="cursor-pointer border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition"
                  onClick={() => navigate(`/posts/${p._id}`)}
                >
                  {p.images?.[0] && (
                    <img src={p.images[0]} alt={p.title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-3">
                    <h3 className="font-medium text-gray-800">{p.title}</h3>
                    <p className="text-sm text-gray-500">{p.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    </main>
  );
}