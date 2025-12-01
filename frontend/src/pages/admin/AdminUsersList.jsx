// frontend/src/pages/admin/AdminUsersList.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function AdminUsersList() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const latoHeading = {
    fontFamily:
      '"Lato", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  async function load() {
    setLoading(true);
    try {
      const raw = localStorage.getItem('token') || '';
      if (!raw) throw new Error('NO_AUTH');
      const token = `Bearer ${raw}`;
      const url = new URL(`${API}/api/admin/users`);
      if (q) url.searchParams.set('q', q);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(limit));
      const res = await fetch(url, { headers: { Authorization: token } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          alert('Sesion sin permisos de administrador.');
          navigate('/login');
          return;
        }
        throw new Error(json?.error || 'error');
      }
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, limit]);

  function onSearch(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleDelete(id) {
    const ok = window.confirm('Confirmar baja logica del usuario?');
    if (!ok) return;
    const raw = localStorage.getItem('token') || '';
    if (!raw) {
      alert('No autenticado.');
      return;
    }
    const token = `Bearer ${raw}`;
    const res = await fetch(`${API}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: token },
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        alert('Sin permisos para eliminar.');
        return;
      }
      const json = await res.json().catch(() => ({}));
      alert(json?.error || 'Error al eliminar');
      return;
    }
    await load();
  }

  return (
    <main
      className="min-h-[85vh] px-4 py-8"
      style={{
        background:
          'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)',
      }}
    >
      <section className="max-w-6xl mx-auto">
        <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,.55)] border border-[color:var(--c-mid-blue)]/60">
          <header className="mb-5">
            <p
              className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--c-info)]/90"
              style={latoHeading}
            >
              Administracion
            </p>
            <h1
              className="mt-1 text-2xl md:text-3xl font-bold"
              style={{ color: 'var(--c-brand)', ...latoHeading }}
            >
              Usuarios
            </h1>
          </header>

          <form
            onSubmit={onSearch}
            className="flex flex-col sm:flex-row gap-2 mb-4"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o email"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
            />
            <button
              type="submit"
              className="px-4 py-3 rounded-xl font-semibold text-white bg-[color:var(--c-info)] hover:brightness-110 transition"
            >
              Buscar
            </button>
          </form>

          <div className="overflow-x-auto rounded-2xl border border-[color:var(--c-mid-blue)]/60">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--c-mid-blue)]/20 text-left">
                  <th className="p-3" style={{ color: 'var(--c-text)', ...latoHeading }}>
                    Nombre
                  </th>
                  <th className="p-3" style={{ color: 'var(--c-text)', ...latoHeading }}>
                    Email
                  </th>
                  <th className="p-3" style={{ color: 'var(--c-text)', ...latoHeading }}>
                    Rol
                  </th>
                  <th className="p-3" style={{ color: 'var(--c-text)', ...latoHeading }}>
                    Activo
                  </th>
                  <th className="p-3" style={{ color: 'var(--c-text)', ...latoHeading }}>
                    Creado
                  </th>
                  <th className="p-3" style={{ color: 'var(--c-text)', ...latoHeading }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => {
                  const id = u._id || u.id;
                  const isActive = !!u.active;
                  const role = String(u.role || '').toLowerCase();
                  return (
                    <tr
                      key={id}
                      className="border-t hover:bg-[color:var(--c-mid-blue)]/10"
                    >
                      <td className="p-3 text-[color:var(--c-text)]">
                        {u.name}
                      </td>
                      <td className="p-3 text-[color:var(--c-text)]">
                        {u.email}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            role === 'admin'
                              ? 'bg-[color:var(--c-brand)] text-white'
                              : 'bg-[color:var(--c-accent)]/50 text-[color:var(--c-text)]'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            isActive
                              ? 'bg-[color:var(--c-mid-cyan)]/40 text-[color:var(--c-text)]'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {String(u.active)}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleString()
                          : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2 justify-start">
                          <Link
                            to={`/admin/users/${id}`}
                            className="px-3 py-1.5 rounded-xl border border-[color:var(--c-mid-blue)]/60 hover:bg-[color:var(--c-mid-blue)]/15 transition text-[color:var(--c-text)]"
                          >
                            Modificar
                          </Link>
                          <button
                            onClick={() => handleDelete(id)}
                            className="px-3 py-1.5 rounded-xl bg-[color:var(--c-brand)] text-white hover:brightness-110 transition"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data.items.length === 0 && (
                  <tr>
                    <td
                      className="p-3"
                      colSpan={6}
                      style={{ color: 'var(--c-text)' }}
                    >
                      Sin resultados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-2 rounded-full border border-[color:var(--c-mid-blue)]/60 hover:bg-[color:var(--c-mid-blue)]/15 transition"
              disabled={loading}
              style={{ color: 'var(--c-text)' }}
            >
              Anterior
            </button>
            <span
              className="px-3 py-2 rounded-full bg-[color:var(--c-accent)]/50 text-sm font-semibold"
              style={{ color: 'var(--c-text)' }}
            >
              Pagina {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-2 rounded-full border border-[color:var(--c-mid-blue)]/60 hover:bg-[color:var(--c-mid-blue)]/15 transition"
              disabled={loading}
              style={{ color: 'var(--c-text)' }}
            >
              Siguiente
            </button>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
              style={{ color: 'var(--c-text)' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span
              className="ml-auto text-sm"
              style={{ color: 'var(--c-text)' }}
            >
              Total {data.total}
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}