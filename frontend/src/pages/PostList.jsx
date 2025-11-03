import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// id valido
function pid(p) {
  return p._id || p.id;
}

export default function PostList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const url = `${API}/api/posts?page=1&limit=12`;
    fetch(url)
      .then(r => r.ok ? r.json() : r.json().then(j => Promise.reject(new Error(j.error || String(r.status)))))
      .then(data => setItems(Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []))
      .catch(e => setError(e.message || 'Error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#f6f2ff' }}>
        <p style={{ color: 'var(--c-text)' }}>Cargando…</p>
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
  if (!items.length) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#f6f2ff' }}>
        <p style={{ color: 'var(--c-text)' }}>No hay publicaciones</p>
      </main>
    );
  }

  // tarjeta
  function Card({ p }) {
    const img = Array.isArray(p.images) && p.images[0] ? p.images[0] : '';
    const title = p.title || 'Sin titulo';
    const category = p.category || '';
    const condition = p.condition || '';
    const location = p.location || '';
    const openToOffers = !!p.openToOffers;

    return (
      <article className="flex flex-col rounded-2xl overflow-hidden border border-[color:var(--c-mid-blue)]/60 bg-white shadow-[0_10px_30px_rgba(0,0,0,.12)]">
        {/* imagen */}
        {img ? (
          <img src={img} alt={title} className="w-full h-44 object-cover" />
        ) : (
          <div className="w-full h-44 grid place-items-center" style={{ background: 'linear-gradient(180deg,#fafafe,#eef1ff)' }}>
            <span className="text-sm" style={{ color: 'var(--c-text)' }}>Sin imagen</span>
          </div>
        )}

        {/* contenido */}
        <div className="p-4 flex-1 flex flex-col">
          <h3
            className="font-semibold text-base line-clamp-2"
            style={{ color: 'var(--c-text)' }}
            title={title}
          >
            {title}
          </h3>

          {/* pastillas */}
          <div className="mt-2 flex flex-wrap gap-2">
            {category && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[color:var(--c-mid-pink)]/30 text-[color:var(--c-text)]">
                {category}
              </span>
            )}
            {condition && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[color:var(--c-mid-cyan)]/30 text-[color:var(--c-text)]">
                Estado: {condition}
              </span>
            )}
            {location && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[color:var(--c-accent)]/35 text-[color:var(--c-text)]">
                Zona: {location}
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[color:var(--c-info)]/25 text-[color:var(--c-text)]">
              {openToOffers ? 'Abierto a ofertas' : 'Intercambio especifico'}
            </span>
          </div>

          {/* accion */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => navigate(`/posts/${pid(p)}`)}
              className="px-4 py-2 rounded-xl border border-[color:var(--c-mid-blue)]/60 hover:bg-[color:var(--c-mid-blue)]/15 transition text-sm font-medium"
            >
              Ver detalle
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: '#f6f2ff' }}>
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
          >
            Publicaciones
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--c-text)' }}>
            Explora y propone intercambios.
          </p>
        </header>

        {/* grilla adaptable */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(p => <Card key={pid(p)} p={p} />)}
        </div>
      </div>
    </main>
  );
}