// frontend/src/pages/PostDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPostById, getPostsByUser, createTrade } from '../lib/api.js';

function idOf(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v._id || v.id || v.userId || '';
  return String(v);
}

function ownerProfileIdOf(p, o) {
  return (
    idOf(o?._id) ||
    idOf(p?.ownerId) ||
    idOf(p?.userId) ||
    idOf(p?.authorId) ||
    idOf(p?.owner) ||
    idOf(p?.user) ||
    idOf(p?.author) ||
    ''
  );
}

const latoHeading = {
  fontFamily:
    '"Lato", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

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

  // modal
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
          idOf(data.ownerId) ||
          idOf(data.userId) ||
          idOf(data.authorId) ||
          idOf(data.owner) ||
          idOf(data.user) ||
          idOf(data.author);

        setPost({ ...data, ownerId });
        setIdx(0);

        const name =
          data.ownerName ||
          data.owner?.name ||
          data.user?.name ||
          data.author?.name;
        const avatar =
          data.ownerAvatar ||
          data.owner?.avatar ||
          data.user?.avatar ||
          data.author?.avatar;

        if (name || avatar) {
          setOwner({
            _id: ownerId,
            name: name || 'Usuario',
            avatar: avatar || '',
          });
        } else if (ownerId) {
          const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
          const token = localStorage.getItem('token') || '';
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await fetch(`${API}/api/users/${ownerId}`, { headers });
          if (res.ok) {
            const u = await res.json();
            setOwner({
              _id: u._id || u.id,
              name: u.name || u.email || 'Usuario',
              avatar: u.avatar || '',
            });
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
    return () => {
      active = false;
    };
  }, [id]);

  // mas posts del duenio
  useEffect(() => {
    const uid = idOf(owner?._id) || idOf(post?.ownerId);
    if (!uid || !post?._id) return;
    (async () => {
      try {
        const res = await getPostsByUser(uid, { page: 1, limit: 10 });
        const items = Array.isArray(res) ? res : res.items || [];
        const filtered = items.filter(p => String(p._id) !== String(post._id));
        setMorePosts(filtered.length >= 3 ? filtered : []);
      } catch {
        try {
          const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
          const token = localStorage.getItem('token') || '';
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const urls = [
            `${API}/api/posts?author=${uid}`,
            `${API}/api/posts?userId=${uid}`,
          ];
          let items = [];
          for (const url of urls) {
            const r = await fetch(url, { headers });
            if (!r.ok) continue;
            const j = await r.json().catch(() => ({}));
            items = Array.isArray(j) ? j : j.items || j.posts || j.data || [];
            if (Array.isArray(items)) break;
          }
          const filtered = (items || []).filter(
            p => String(p._id) !== String(post._id)
          );
          setMorePosts(filtered.length >= 3 ? filtered : []);
        } catch {
          setMorePosts([]);
        }
      }
    })();
  }, [owner, post]);

  async function loadMyPosts() {
    const me = JSON.parse(localStorage.getItem('user') || '{}');
    if (!me?.id && !me?._id) return;
    try {
      const res = await getPostsByUser(me._id || me.id, {
        page: 1,
        limit: 20,
      });
      const items = Array.isArray(res.items) ? res.items : res;
      const actives = items.filter(p => p.status === 'active');
      setMyPosts(actives);
    } catch {
      setMyPosts([]);
    }
  }

  async function submitTrade() {
    setSubmitting(true);
    setError('');
    setInfo('');
    try {
      const payload = { postRequestedId: id, postOfferedId: selectedPostId };
      await createTrade(payload);

      setInfo('Propuesta enviada');
      setShowModal(false);
      setOfferType('');
      setSelectedPostId('');
      setOfferText('');
      navigate(`/chat/${owner?._id}`);
    } catch (e) {
      setError(e.message || 'Error al enviar propuesta');
    } finally {
      setSubmitting(false);
    }
  }

  function prev() {
    setIdx(p =>
      post?.images?.length
        ? (p - 1 + post.images.length) % post.images.length
        : 0
    );
  }
  function next() {
    setIdx(p =>
      post?.images?.length ? (p + 1) % post.images.length : 0
    );
  }

  const me = JSON.parse(localStorage.getItem('user') || '{}');
  const myId = me?.id || me?._id || '';
  const isOwner = String(owner?._id || '') === String(myId);

  if (loading) {
    return (
      <main
        className="min-h-[85vh] flex items-center justify-center px-4 py-10"
        style={{
          background:
            'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)',
        }}
      >
        <div className="rounded-2xl bg-white/95 px-6 py-4 shadow-[0_18px_50px_rgba(0,0,0,.45)] border border-[color:var(--c-mid-blue)]/50">
          <p style={{ color: 'var(--c-text)' }}>Cargando publicacion…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        className="min-h-[85vh] flex items-center justify-center px-4 py-10"
        style={{
          background:
            'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)',
        }}
      >
        <div className="rounded-2xl bg-white/95 px-6 py-4 shadow-[0_18px_50px_rgba(0,0,0,.45)] border border-red-200">
          <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main
        className="min-h-[85vh] flex items-center justify-center px-4 py-10"
        style={{
          background:
            'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)',
        }}
      >
        <div className="rounded-2xl bg-white/95 px-6 py-4 shadow-[0_18px_50px_rgba(0,0,0,.45)] border border-[color:var(--c-mid-blue)]/50">
          <p style={{ color: 'var(--c-text)' }}>Publicacion no encontrada.</p>
        </div>
      </main>
    );
  }

  const images = Array.isArray(post.images) ? post.images : [];
  const ownerId = ownerProfileIdOf(post, owner);
  const ownerProfilePath = ownerId
    ? String(ownerId) === String(myId)
      ? '/profile'
      : `/users/${ownerId}`
    : '';

  const canSend = !!selectedPostId && !submitting;

  return (
    <main
      className="min-h-[85vh] px-4 py-8"
      style={{
        background:
          'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)',
      }}
    >
      <section className="w-full max-w-5xl mx-auto">
        <article className="w-full bg-white/95 rounded-3xl border border-[color:var(--c-mid-blue)]/60 shadow-[0_24px_80px_rgba(0,0,0,.55)] overflow-hidden backdrop-blur-sm">
          <div className="grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            {/* fotos izquierda */}
            <aside className="bg-white border-b md:border-b-0 md:border-r border-[color:var(--c-mid-blue)]/30">
              <div className="relative">
                {images.length > 0 && (
                  <img
                    src={images[idx]}
                    alt={post.title}
                    className="w-full h-72 md:h-[380px] object-cover"
                  />
                )}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/45 text-white px-2 py-1 rounded-full text-xs"
                      aria-label="Anterior"
                    >
                      ‹
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/45 text-white px-2 py-1 rounded-full text-xs"
                      aria-label="Siguiente"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="px-3 py-2 flex gap-2 overflow-x-auto bg-[color:var(--c-mid-blue)]/8">
                  {images.map((u, i) => (
                    <img
                      key={i}
                      src={u}
                      onClick={() => setIdx(i)}
                      className={`w-14 h-14 object-cover rounded-lg cursor-pointer border-2 ${i === idx
                          ? 'border-[color:var(--c-brand)]'
                          : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      alt={`thumb-${i}`}
                    />
                  ))}
                </div>
              )}
            </aside>

            {/* detalle derecha */}
            <section className="p-4 sm:p-5 md:p-6 flex flex-col gap-4">
              {/* encabezado */}
              <header className="flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <h1
                      className="text-xl md:text-2xl font-bold leading-snug"
                      style={{ color: 'var(--c-brand)', ...latoHeading }}
                      title={post.title}
                    >
                      {post.title}
                    </h1>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {post.category && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[color:var(--c-mid-pink)]/30 text-[color:var(--c-text)]">
                          {post.category}
                        </span>
                      )}
                      {post.condition && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[color:var(--c-mid-cyan)]/30 text-[color:var(--c-text)]">
                          Estado: {post.condition}
                        </span>
                      )}
                      {post.location && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[color:var(--c-accent)]/35 text-[color:var(--c-text)]">
                          Zona: {post.location}
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[color:var(--c-info)]/25 text-[color:var(--c-text)]">
                        {post.openToOffers
                          ? 'Abierto a ofertas'
                          : 'Intercambio especifico'}
                      </span>
                    </div>
                  </div>

                  {owner &&
                    (ownerProfilePath ? (
                      <Link
                        to={ownerProfilePath}
                        className="shrink-0 flex items-center gap-2 rounded-full px-2 py-1 bg-[color:var(--c-mid-blue)]/10 hover:bg-[color:var(--c-mid-blue)]/15 transition"
                      >
                        <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden">
                          {owner.avatar && (
                            <img
                              src={owner.avatar}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="leading-tight">
                          <p
                            className="text-xs font-semibold"
                            style={{ color: 'var(--c-text)', ...latoHeading }}
                          >
                            {owner.name || 'Usuario'}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Propietario
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <div className="shrink-0 flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden">
                          {owner.avatar && (
                            <img
                              src={owner.avatar}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="leading-tight">
                          <p
                            className="text-xs font-semibold"
                            style={{ color: 'var(--c-text)', ...latoHeading }}
                          >
                            {owner.name || 'Usuario'}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Propietario
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </header>

              {/* bloque principal mas compacto */}
              <div className="rounded-xl border border-[color:var(--c-mid-blue)]/25 bg-[color:var(--c-mid-blue)]/6 p-3.5 space-y-3 max-w-xl">
                {post.description && (
                  <div>
                    <h2
                      className="text-[11px] font-semibold mb-0.5"
                      style={{ color: 'var(--c-brand)', ...latoHeading }}
                    >
                      Sobre esta publicacion
                    </h2>
                    <p
                      className="text-[13px] leading-relaxed max-h-32 overflow-auto"
                      style={{ color: 'var(--c-text)' }}
                    >
                      {post.description}
                    </p>
                  </div>
                )}

                {post.hasDetails && post.detailsText && (
                  <div>
                    <h3
                      className="text-[9px] font-semibold mb-0.5 uppercase tracking-wide"
                      style={{ color: 'var(--c-brand)', ...latoHeading }}
                    >
                      Detalles
                    </h3>
                    <p
                      className="text-[13px]"
                      style={{ color: 'var(--c-text)' }}
                    >
                      {post.detailsText}
                    </p>
                  </div>
                )}

                {!post.openToOffers && post.interestsText && (
                  <div>
                    <h3
                      className="text-[10px] font-semibold mb-0.5 uppercase tracking-wide"
                      style={{ color: 'var(--c-brand)', ...latoHeading }}
                    >
                      Lo que busca a cambio
                    </h3>
                    <p
                      className="text-[13px]"
                      style={{ color: 'var(--c-text)' }}
                    >
                      {post.interestsText}
                    </p>
                  </div>
                )}
              </div>

              {/* acciones */}
              <div className="mt-1 flex flex-col gap-2.5">
                {isOwner ? (
                  <p className="text-center text-xs text-gray-500">
                    Sos el dueno de esta publicacion.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => {
                        setShowModal(true);
                        setOfferType('');
                        setSelectedPostId('');
                        setOfferText('');
                        loadMyPosts();
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[color:var(--c-brand)] hover:brightness-110 transition"
                    >
                      Proponer trueque
                    </button>
                    <button
                      className="px-3 py-2 rounded-xl text-sm border border-[color:var(--c-mid-blue)]/60 hover:bg-[color:var(--c-mid-blue)]/15 transition disabled:opacity-60"
                      onClick={() =>
                        ownerProfilePath && navigate(ownerProfilePath)
                      }
                      disabled={!ownerProfilePath}
                    >
                      Ver perfil
                    </button>
                  </div>
                )}

                {(info || error) && (
                  <div className="text-center text-sm">
                    {info && <p className="text-green-600">{info}</p>}
                    {error && <p className="text-red-600">{error}</p>}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* mas publicaciones */}
          {morePosts.length >= 3 && (
            <div className="border-t border-[color:var(--c-mid-blue)]/30 bg-[color:var(--c-mid-blue)]/5 px-4 py-4 md:px-5 md:py-4">
              <h2
                className="text-[13px] font-semibold mb-2.5"
                style={{ color: 'var(--c-brand)', ...latoHeading }}
              >
                Mas publicaciones de este usuario
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {morePosts.map(p => (
                  <div
                    key={p._id}
                    className="min-w-[190px] max-w-[210px] cursor-pointer rounded-xl overflow-hidden border border-[color:var(--c-mid-blue)]/50 bg-white shadow-sm hover:shadow-md transition"
                    onClick={() => navigate(`/posts/${p._id}`)}
                  >
                    {p.images?.[0] && (
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-full h-24 object-cover"
                      />
                    )}
                    <div className="p-2.5">
                      <h3
                        className="text-[13px] font-semibold line-clamp-2"
                        style={{ color: 'var(--c-text)', ...latoHeading }}
                      >
                        {p.title}
                      </h3>
                      {p.category && (
                        <p className="text-[11px] mt-1 text-gray-500">
                          {p.category}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </section>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white/98 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,.45)] w-[92%] max-w-md p-5 space-y-4 border border-[color:var(--c-mid-blue)]/60">
            <h2
              className="text-lg font-bold text-center"
              style={{ color: 'var(--c-brand)', ...latoHeading }}
            >
              Proponer trueque
            </h2>

            {!offerType && (
              <div className="space-y-3 text-center">
                <button
                  onClick={() => setOfferType('existing')}
                  className="w-full py-2 rounded-xl text-sm bg-[color:var(--c-info)] text-white hover:brightness-110 transition"
                >
                  Ofrecer una publicacion existente
                </button>
                <button
                  onClick={() => setOfferType('new')}
                  className="w-full py-2 rounded-xl text-sm bg-[color:var(--c-accent)] hover:brightness-105 transition"
                  style={{ color: 'var(--c-text)' }}
                >
                  Crear una nueva oferta
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setOfferType('');
                    setSelectedPostId('');
                    setOfferText('');
                  }}
                  className="text-gray-600 text-xs underline"
                >
                  Cancelar
                </button>
              </div>
            )}

            {offerType === 'existing' && (
              <div className="space-y-3">
                <p
                  className="text-center text-sm font-medium"
                  style={{ color: 'var(--c-text)', ...latoHeading }}
                >
                  Selecciona una de tus publicaciones activas
                </p>
                {myPosts.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No tenes publicaciones activas.
                  </p>
                ) : (
                  <select
                    value={selectedPostId}
                    onChange={e => setSelectedPostId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
                  >
                    <option value="">Seleccionar publicacion</option>
                    {myPosts.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex justify-between mt-3">
                  <button
                    onClick={() => setOfferType('')}
                    className="text-gray-600 underline text-xs"
                  >
                    Volver
                  </button>
                  <button
                    onClick={submitTrade}
                    disabled={!canSend}
                    className="px-4 py-2 rounded-xl bg-[color:var(--c-brand)] text-white hover:brightness-110 transition disabled:opacity-60 text-sm font-semibold"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            )}

            {offerType === 'new' && (
              <div className="space-y-3">
                <p
                  className="text-sm"
                  style={{ color: 'var(--c-text)', ...latoHeading }}
                >
                  Vas a crear una nueva publicacion con lo que queres ofrecer y
                  la vamos a usar como base para la propuesta de trueque.
                </p>

                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => setOfferType('')}
                    className="text-gray-600 underline text-xs"
                  >
                    Volver
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setOfferType('');
                      setSelectedPostId('');
                      setOfferText('');
                      navigate('/posts/create', {
                        state: { offerForPostId: id },
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-[color:var(--c-brand)] text-white hover:brightness-110 transition text-sm font-semibold"
                  >
                    Ir a crear publicacion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}