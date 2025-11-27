// frontend/src/pages/PostDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPostById, getPostsByUser, getMeetingPlaces } from '../lib/api.js';

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

  // Espacios públicos
  const [meetingPlaces, setMeetingPlaces] = useState([]);
  const [meetingPlacesLoading, setMeetingPlacesLoading] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [meetingArea, setMeetingArea] = useState('');

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

  // + posts del dueño
  useEffect(() => {
    const uid = idOf(owner?._id) || idOf(post?.ownerId);
    if (!uid || !post?._id) return;
    (async () => {
      try {
        const res = await getPostsByUser(uid, { page: 1, limit: 10 });
        const items = Array.isArray(res) ? res : (res.items || []);
        const filtered = items.filter(p => String(p._id) !== String(post._id));
        setMorePosts(filtered.length >= 3 ? filtered : []);
      } catch {
        try {
          const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
          const token = localStorage.getItem('token') || '';
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const urls = [
            `${API}/api/posts?author=${uid}`,
            `${API}/api/posts?userId=${uid}`
          ];
          let items = [];
          for (const url of urls) {
            const r = await fetch(url, { headers });
            if (!r.ok) continue;
            const j = await r.json().catch(() => ({}));
            items = Array.isArray(j) ? j : (j.items || j.posts || j.data || []);
            if (Array.isArray(items)) break;
          }
          const filtered = (items || []).filter(p => String(p._id) !== String(post._id));
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
      const res = await getPostsByUser(me._id || me.id, { page: 1, limit: 20 });
      const items = Array.isArray(res.items) ? res.items : res;
      const actives = items.filter(p => p.status === 'active');
      setMyPosts(actives);
    } catch {
      setMyPosts([]);
    }
  }

  async function loadMeetingPlacesForPost() {
    const barrio = post?.barrio || '';
    if (!barrio) {
      setMeetingPlaces([]);
      return;
    }
    try {
      setMeetingPlacesLoading(true);
      const items = await getMeetingPlaces(barrio);
      setMeetingPlaces(items);
    } catch {
      setMeetingPlaces([]);
    } finally {
      setMeetingPlacesLoading(false);
    }
  }

  async function submitTrade() {
    setSubmitting(true);
    setError('');
    setInfo('');
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token = localStorage.getItem('token') || '';

      let body;
      if (offerType === 'existing') {
        body = { postRequestedId: id, postOfferedId: selectedPostId };
      } else {
        body = { postRequestedId: id, itemsText: offerText };
      }

      if (meetingArea) {
        body.meetingArea = meetingArea;
      }

      const res = await fetch(`${API}/api/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Error al proponer trueque');

      setInfo('Propuesta enviada');
      setShowModal(false);
      setOfferType('');
      setSelectedPostId('');
      setOfferText('');
      setSelectedPlaceId('');
      setMeetingArea('');
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
  const ownerId = ownerProfileIdOf(post, owner);
  const ownerProfilePath = ownerId ? (String(ownerId) === String(myId) ? '/profile' : `/users/${ownerId}`) : '';

  const canSend =
    (offerType === 'existing' ? !!selectedPostId : !!offerText.trim()) &&
    !!selectedPlaceId &&
    !submitting;

  return (
    <main
  className="min-h-[85vh] bg-[#f6f2ff] px-4 py-6 md:py-10 flex justify-center items-start">

      <article className="w-full max-w-6xl bg-white rounded-2xl border border-[color:var(--c-mid-blue)]/60 shadow-[0_18px_50px_rgba(0,0,0,.12)] overflow-hidden">
        <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* fotos de la izquierda */}
          <aside className="bg-white border-b md:border-b-0 md:border-r border-[color:var(--c-mid-blue)]/30">
            <div className="relative">
              {images.length > 0 && (
                <img
                  src={images[idx]}
                  alt={post.title}
                  className="w-full h-72 md:h-[420px] object-cover"
                />
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/45 text-white px-2.5 py-1.5 rounded-full"
                    aria-label="Anterior"
                  >
                    ‹
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/45 text-white px-2.5 py-1.5 rounded-full"
                    aria-label="Siguiente"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="px-3 py-3 flex gap-2 overflow-x-auto bg-[color:var(--c-mid-blue)]/8">
                {images.map((u, i) => (
                  <img
                    key={i}
                    src={u}
                    onClick={() => setIdx(i)}
                    className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 ${
                      i === idx
                        ? 'border-[color:var(--c-brand)]'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    alt={`thumb-${i}`}
                  />
                ))}
              </div>
            )}
          </aside>

          {/* Detalle que esta a la derecha */}
          <section className="p-5 sm:p-6 md:p-7 flex flex-col gap-5">
            {/* Encabezado :3 */}
            <header className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <h1
                    className="text-2xl md:text-3xl font-bold leading-tight"
                    style={{ color: 'var(--c-text)' }}
                    title={post.title}
                  >
                    {post.title}
                  </h1>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.category && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[color:var(--c-mid-pink)]/30 text-[color:var(--c-text)]">
                        {post.category}
                      </span>
                    )}
                    {post.condition && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[color:var(--c-mid-cyan)]/30 text-[color:var(--c-text)]">
                        Estado: {post.condition}
                      </span>
                    )}
                    {post.location && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[color:var(--c-accent)]/35 text-[color:var(--c-text)]">
                        Zona: {post.location}
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[color:var(--c-info)]/25 text-[color:var(--c-text)]">
                      {post.openToOffers ? 'Abierto a ofertas' : 'Intercambio específico'}
                    </span>
                  </div>
                </div>

                {owner && (
                  ownerProfilePath ? (
                    <Link
                      to={ownerProfilePath}
                      className="shrink-0 flex items-center gap-2 rounded-full px-2.5 py-1.5 bg-[color:var(--c-mid-blue)]/10 hover:bg-[color:var(--c-mid-blue)]/15 transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        {owner.avatar && (
                          <img
                            src={owner.avatar}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="leading-tight">
                        <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
                          {owner.name || 'Usuario'}
                        </p>
                        <p className="text-xs text-gray-500">Propietario</p>
                      </div>
                    </Link>
                  ) : (
                    <div className="shrink-0 flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        {owner.avatar && (
                          <img
                            src={owner.avatar}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="leading-tight">
                        <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
                          {owner.name || 'Usuario'}
                        </p>
                        <p className="text-xs text-gray-500">Propietario</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </header>

            {/* bloquecito principall */}
            <div className="rounded-xl border border-[color:var(--c-mid-blue)]/30 bg-[color:var(--c-mid-blue)]/8 p-4 space-y-3">
              {post.description && (
                <div>
                  <h2
                    className="text-sm font-semibold mb-1.5"
                    style={{ color: 'var(--c-brand)' }}
                  >
                    Sobre esta publicación
                  </h2>
                  <p
                    className="text-sm leading-relaxed max-h-32 md:max-h-40 overflow-auto"
                    style={{ color: 'var(--c-text)' }}
                  >
                    {post.description}
                  </p>
                </div>
              )}

              {(post.hasDetails && post.detailsText) && (
                <div>
                  <h3
                    className="text-xs font-semibold mb-0.5 uppercase tracking-wide"
                    style={{ color: 'var(--c-brand)' }}
                  >
                    Detalles
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                    {post.detailsText}
                  </p>
                </div>
              )}

              {!post.openToOffers && post.interestsText && (
                <div>
                  <h3
                    className="text-xs font-semibold mb-0.5 uppercase tracking-wide"
                    style={{ color: 'var(--c-brand)' }}
                  >
                    Lo que busca a cambio
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                    {post.interestsText}
                  </p>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="mt-2 flex flex-col gap-3">
              {isOwner ? (
                <p className="text-center text-sm text-gray-500">
                  Sos el dueño de esta publicación.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      setShowModal(true);
                      setOfferType('');
                      setSelectedPostId('');
                      setOfferText('');
                      setSelectedPlaceId('');
                      setMeetingArea('');
                      loadMyPosts();
                      loadMeetingPlacesForPost();
                    }}
                    className="px-5 py-2 rounded-xl font-semibold text-white bg-[color:var(--c-brand)] hover:brightness-110 transition"
                  >
                    Proponer trueque
                  </button>
                  <button
                    className="px-4 py-2 md:px-3 rounded-xl border border-[color:var(--c-mid-blue)]/60 hover:bg-[color:var(--c-mid-blue)]/15 transition disabled:opacity-60"
                    onClick={() => ownerProfilePath && navigate(ownerProfilePath)}
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

        {/* Mas publis del mismo userr */}
        {morePosts.length >= 3 && (
          <div className="border-t border-[color:var(--c-mid-blue)]/30 bg-[color:var(--c-mid-blue)]/5 px-5 py-4 md:px-6 md:py-5">
            <h2
              className="text-lg font-semibold mb-3"
              style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
            >
              Más publicaciones de este usuario
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {morePosts.map(p => (
                <div
                  key={p._id}
                  className="min-w-[200px] max-w-[220px] cursor-pointer rounded-xl overflow-hidden border border-[color:var(--c-mid-blue)]/50 bg-white shadow-sm hover:shadow-md transition"
                  onClick={() => navigate(`/posts/${p._id}`)}
                >
                  {p.images?.[0] && (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="w-full h-28 object-cover"
                    />
                  )}
                  <div className="p-3">
                    <h3
                      className="text-sm font-semibold line-clamp-2"
                      style={{ color: 'var(--c-text)' }}
                    >
                      {p.title}
                    </h3>
                    {p.category && (
                      <p className="text-xs mt-1 text-gray-500">
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

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-2xl shadow-lg w-[92%] max-w-md p-6 space-y-4 border border-[color:var(--c-mid-blue)]/50">
            <h2
              className="text-xl font-bold text-center"
              style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
            >
              Proponer trueque
            </h2>

            {!offerType && (
              <div className="space-y-3 text-center">
                <button
                  onClick={() => setOfferType('existing')}
                  className="w-full py-2 rounded-xl bg-[color:var(--c-info)] text-white hover:brightness-110 transition"
                >
                  Ofrecer una publicación existente
                </button>
                <button
                  onClick={() => setOfferType('new')}
                  className="w-full py-2 rounded-xl bg-[color:var(--c-accent)] hover:brightness-105 transition"
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
                    setSelectedPlaceId('');
                    setMeetingArea('');
                  }}
                  className="text-gray-600 text-sm underline"
                >
                  Cancelar
                </button>
              </div>
            )}

            {offerType === 'existing' && (
              <div className="space-y-3">
                <p className="text-center text-sm! sm:text-base! md:text-md! lg:text-xl! font-medium" style={{ color: 'var(--c-text)' }}>
                  Seleccioná una de tus publicaciones activas
                </p>
                {myPosts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No tenés publicaciones activas.</p>
                ) : (
                  <select
                    value={selectedPostId}
                    onChange={e => setSelectedPostId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="">Seleccionar publicación</option>
                    {myPosts.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                )}

                <div className="space-y-2 mt-3">
                  {meetingPlacesLoading && (
                    <p className="text-xs text-gray-500">Cargando espacios públicos cercanos...</p>
                  )}
                  {!meetingPlacesLoading && (
                    <>
                      <p className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                        Elegí un espacio público para encontrarse
                      </p>
                      {meetingPlaces.length === 0 ? (
                        <p className="text-xs text-gray-500">
                          No encontramos espacios públicos cargados para este barrio.
                        </p>
                      ) : (
                        <select
                          value={selectedPlaceId}
                          onChange={e => {
                            const val = e.target.value;
                            setSelectedPlaceId(val);
                            const place = meetingPlaces.find(mp => String(mp.id) === String(val));
                            if (place) {
                              const label = place.name + (place.barrio ? ` (${place.barrio})` : '');
                              setMeetingArea(label);
                            } else {
                              setMeetingArea('');
                            }
                          }}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2"
                        >
                          <option value="">Seleccionar espacio público</option>
                          {meetingPlaces.map(mp => (
                            <option key={mp.id} value={mp.id}>
                              {mp.name}{mp.barrio ? ` (${mp.barrio})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                      {post?.barrio && (
                        <p className="text-xs text-gray-500">Barrio de esta publicación: {post.barrio}</p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex justify-between mt-4">
                  <button onClick={() => setOfferType('')} className="text-gray-600 underline">Volver</button>
                  <button
                    onClick={submitTrade}
                    disabled={!canSend}
                    className="px-4 py-2 rounded-xl bg-[color:var(--c-brand)] text-white hover:brightness-110 transition disabled:opacity-60"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            )}

            {offerType === 'new' && (
              <div className="space-y-3">
                <h3 className="font-medium" style={{ color: 'var(--c-text)' }}>Describí tu oferta</h3>
                <textarea
                  value={offerText}
                  onChange={e => setOfferText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  placeholder="Ej: Ofrezco una bici usada o clases de guitarra"
                />

                <div className="space-y-2 mt-2">
                  {meetingPlacesLoading && (
                    <p className="text-xs text-gray-500">Cargando espacios públicos cercanos...</p>
                  )}
                  {!meetingPlacesLoading && (
                    <>
                      <p className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                        Elegí un espacio público para encontrarse
                      </p>
                      {meetingPlaces.length === 0 ? (
                        <p className="text-xs text-gray-500">
                          No encontramos espacios públicos cargados para este barrio.
                        </p>
                      ) : (
                        <select
                          value={selectedPlaceId}
                          onChange={e => {
                            const val = e.target.value;
                            setSelectedPlaceId(val);
                            const place = meetingPlaces.find(mp => String(mp.id) === String(val));
                            if (place) {
                              const label = place.name + (place.barrio ? ` (${place.barrio})` : '');
                              setMeetingArea(label);
                            } else {
                              setMeetingArea('');
                            }
                          }}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2"
                        >
                          <option value="">Seleccionar espacio público</option>
                          {meetingPlaces.map(mp => (
                            <option key={mp.id} value={mp.id}>
                              {mp.name}{mp.barrio ? ` (${mp.barrio})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                      {post?.barrio && (
                        <p className="text-xs text-gray-500">Barrio de esta publicación: {post.barrio}</p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex justify-between mt-4">
                  <button onClick={() => setOfferType('')} className="text-gray-600 underline">Volver</button>
                  <button
                    onClick={submitTrade}
                    disabled={!canSend}
                    className="px-4 py-2 rounded-xl bg-[color:var(--c-brand)] text-white hover:brightness-110 transition disabled:opacity-60"
                  >
                    Enviar
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