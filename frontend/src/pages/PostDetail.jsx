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
  const [myPosts, setMyPosts] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [offerType, setOfferType] = useState('');
  const [selectedPostId, setSelectedPostId] = useState('');
  const [offerText, setOfferText] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  // Cargar mas publis del propietario
  useEffect(() => {
    const uid = idOf(owner?._id) || idOf(post?.ownerId);
    if (!uid || !post?._id) return;
    getPostsByUser(uid, { page: 1, limit: 10 })
      .then(res => {
        const items = Array.isArray(res) ? res : (res.items || []);
        const filtered = items.filter(p => p._id !== post._id);
        // solo muestra si el propietario tiene 3 o mas publicaciones activas
        setMorePosts(filtered.length >= 3 ? filtered : []);
      })
      .catch(() => setMorePosts([]));
  }, [owner, post]);

  // Cargar publicaciones propias para ofrecer
  async function loadMyPosts() {
    const me = JSON.parse(localStorage.getItem('user') || '{}');
    if (!me?.id && !me?._id) return;
    try {
      const res = await getPostsByUser(me._id || me.id, { page: 1, limit: 20 });
      const items = Array.isArray(res.items) ? res.items : res;
      const actives = items.filter(p => p.status === 'active');
      setMyPosts(actives);
    } catch {
      setMyPosts([]);
    }
  }

  // Enviar propuesta
  async function submitTrade() {
    setSubmitting(true);
    setError('');
    setInfo('');
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token = localStorage.getItem('token') || '';

      const body =
        offerType === 'existing'
          ? { postRequestedId: id, postOfferedId: selectedPostId }
          : { postRequestedId: id, itemsText: offerText };

      const res = await fetch(`${API}/api/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Error al proponer trueque');

      setInfo('Propuesta enviada');
      setShowModal(false);

      // Redirige al chat con el propietario
      navigate(`/chat/${owner?._id}`);
    } catch (e) {
      setError(e.message || 'Error al enviar propuesta');
    } finally {
      setSubmitting(false);
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
              <button onClick={prev} className="absolute left-2 top-1/2 bg-black/40 text-white px-2 py-1 rounded-full z-10">‹</button>
              <button onClick={next} className="absolute right-2 top-1/2 bg-black/40 text-white px-2 py-1 rounded-full z-10">›</button>
              <div className="flex gap-2 p-2 overflow-x-auto bg-white/80 justify-center">
                {images.map((u, i) => (
                  <img key={i} src={u} onClick={() => setIdx(i)} className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 ${i === idx ? 'border-gray-800' : 'border-transparent opacity-60 hover:opacity-100'}`} />
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

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {post.condition && <p><strong>Estado:</strong> {post.condition}</p>}
            {post.hasDetails && post.detailsText && <p><strong>Detalles:</strong> {post.detailsText}</p>}
            {post.location && <p><strong>Zona:</strong> {post.location}</p>}
            <p><strong>Abierto a ofertas:</strong> {post.openToOffers ? 'Sí' : 'No'}</p>
            {!post.openToOffers && post.interestsText && <p><strong>Intereses:</strong> {post.interestsText}</p>}
          </div>

          {isOwner ? (
            <p className="text-gray-500 text-center">Sos el dueño de esta publicación</p>
          ) : (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => {
                  setShowModal(true);
                  loadMyPosts();
                }}
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

        {/* Más publicaciones */}
        {morePosts.length >= 3 && (
          <div className="border-t px-6 py-6 bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">Más publicaciones de este usuario</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {morePosts.map(p => (
                <div key={p._id} className="cursor-pointer border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition" onClick={() => navigate(`/posts/${p._id}`)}>
                  {p.images?.[0] && (<img src={p.images[0]} alt={p.title} className="w-full h-40 object-cover" />)}
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

      {/* Modal de propuesta */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-center">Proponer trueque</h2>

            {!offerType && (
              <div className="space-y-4 text-center">
                <button onClick={() => setOfferType('existing')} className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">Ofrecer una publicación existente</button>
                <button onClick={() => setOfferType('new')} className="w-full py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition">Crear una nueva oferta</button>
                <button onClick={() => setShowModal(false)} className="text-gray-600 text-sm underline">Cancelar</button>
              </div>
            )}

            {offerType === 'existing' && (
              <div className="space-y-3">
                <h3 className="font-medium">Seleccioná una de tus publicaciones activas:</h3>
                {myPosts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No tenés publicaciones activas.</p>
                ) : (
                  <select value={selectedPostId} onChange={e => setSelectedPostId(e.target.value)} className="w-full border rounded p-2">
                    <option value="">Seleccionar publicación</option>
                    {myPosts.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                )}
                <div className="flex justify-between mt-4">
                  <button onClick={() => setOfferType('')} className="text-gray-600 underline">Volver</button>
                  <button onClick={submitTrade} disabled={!selectedPostId || submitting} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition">Enviar</button>
                </div>
              </div>
            )}

            {offerType === 'new' && (
              <div className="space-y-3">
                <h3 className="font-medium">Describí tu oferta:</h3>
                <textarea value={offerText} onChange={e => setOfferText(e.target.value)} className="w-full border rounded p-2" placeholder="Ej: Ofrezco una bici usada o clases de guitarra" />
                <div className="flex justify-between mt-4">
                  <button onClick={() => setOfferType('')} className="text-gray-600 underline">Volver</button>
                  <button onClick={submitTrade} disabled={!offerText.trim() || submitting} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition">Enviar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}