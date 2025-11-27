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
  const [q, setQ] = useState('');

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
  if (!items.length) {
    return (
      <main
        className="min-h-[85vh] flex items-center justify-center px-4 py-10"
        style={{ background: 'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)' }}
      >
        <div className="rounded-2xl bg-white/95 px-6 py-4 shadow-[0_18px_50px_rgba(0,0,0,.45)] border border-[color:var(--c-mid-blue)]/50">
          <p style={{ color: 'var(--c-text)' }}>No hay publicaciones disponibles todavía.</p>
        </div>
      </main>
    );
  }

  const filtered = items.filter(p => {
    const title = String(p.title || "").toLowerCase();
    const category = String(p.category || "").toLowerCase();
    const location = String(p.location || "").toLowerCase();

    const qlow = q.toLowerCase();

    // Coincidencia por título, categoría o zona
    return (
      !q ||
      title.includes(qlow) ||
      category.includes(qlow) ||
      location.includes(qlow)
    );
  });

  // 📌 ordenar por fecha (si el backend lo manda)
  const sorted = filtered.sort((a, b) => {
    const da = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
    const db = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
    return db - da;
  });

  // tarjeta
  function Card({ p }) {
    const img = Array.isArray(p.images) && p.images[0] ? p.images[0] : '';
    const title = p.title || 'Sin título';
    const category = p.category || '';
    const condition = p.condition || '';
    const location = p.location || '';
    const openToOffers = !!p.openToOffers;

    return (
      <article className="flex flex-col rounded-2xl overflow-hidden border border-[color:var(--c-mid-blue)]/40 bg-white shadow-[0_14px_35px_rgba(0,0,0,.14)]">
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
            className="font-semibold text-[15px] sm:text-base line-clamp-2"
            style={{ color: 'var(--c-text)' }}
            title={title}
          >
            {title}
          </h3>

          {/* pastillas */}
          <div className="mt-2 mb-3 flex flex-wrap gap-2">
            {category && (
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[color:var(--c-mid-pink)]/30 text-[color:var(--c-text)]">
                {category}
              </span>
            )}
            {condition && (
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[color:var(--c-mid-cyan)]/30 text-[color:var(--c-text)]">
                Estado: {condition}
              </span>
            )}
            {location && (
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[color:var(--c-accent)]/35 text-[color:var(--c-text)]">
                Zona: {location}
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[color:var(--c-info)]/25 text-[color:var(--c-text)]">
              {openToOffers ? 'Abierto a ofertas' : 'Intercambio específico'}
            </span>
          </div>

          {/* accion */}
          <div className="mt-auto flex items-center justify-between">
            <button
              onClick={() => navigate(`/posts/${pid(p)}`)}
              className="px-4 py-2 rounded-xl border border-[color:var(--c-mid-blue)]/60 hover:bg-[color:var(--c-mid-blue)]/10 transition text-xs sm:text-sm font-medium text-[color:var(--c-text)]"
            >
              Ver detalle
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <main
      className="min-h-[85vh] px-4 py-8"
      style={{ background: 'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)' }}
    >
      <section className="max-w-6xl mx-auto">
        <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,.55)] border border-[color:var(--c-mid-blue)]/60">
          <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--c-info)]/90">
                Explorar trueques
              </p>
              <h1
                className="mt-1 text-2xl sm:text-3xl font-bold"
                style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
              >
                Publicaciones
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--c-text)' }}>
                Explorá las publicaciones y encontrá con qué intercambiar.
              </p>
            </div>
            <div className="text-xs text-slate-500 text-center sm:text-right">
              <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[color:var(--c-mid-blue)]/40 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-[color:var(--c-info)]" />
                {sorted.length} publicaciones activas
              </span>
            </div>
          </header>

          <div className="mb-5">
            <div className="flex-1">
              <label htmlFor="q" className="sr-only">Buscar</label>
              <input
                id="q"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscar por nombre, categoría o zona…"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)] focus:border-[color:var(--c-info)] text-sm"
              />
            </div>
          </div>

          {/* grilla adaptable */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map(p => <Card key={pid(p)} p={p} />)}
          </div>
        </div>
      </section>
    </main>
  );
}