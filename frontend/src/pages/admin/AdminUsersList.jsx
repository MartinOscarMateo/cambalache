// frontend\src\pages\admin\AdminUsersList.jsx
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
          alert('Sesión sin permisos de administrador.');
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

  useEffect(() => { load(); }, [page, limit]);

  function onSearch(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleDelete(id) {
    const ok = window.confirm('confirmar baja logica del usuario?');
    if (!ok) return;
    const raw = localStorage.getItem('token') || '';
    if (!raw) {
      alert('No autenticado.');
      return;
    }
    const token = `Bearer ${raw}`;
    const res = await fetch(`${API}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: token }
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        alert('Sin permisos para eliminar.');
        return;
      }
      const json = await res.json().catch(() => ({}));
      alert(json?.error || 'error al eliminar');
      return;
    }
    await load();
  }

  return (
    <section>
      <h1 className="text-2xl font-bold text-[#2727d1] mb-4">usuarios</h1>

      <form onSubmit={onSearch} className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="buscar por nombre o email"
          className="border px-3 py-2 w-full"
        />
        <button type="submit" className="px-4 py-2 border">buscar</button>
      </form>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-[#f6f2ff]">
              <th className="text-left p-2">name</th>
              <th className="text-left p-2">email</th>
              <th className="text-left p-2">role</th>
              <th className="text-left p-2">active</th>
              <th className="text-left p-2">createdAt</th>
              <th className="text-left p-2">acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map(u => {
              const id = u._id || u.id;
              return (
                <tr key={id} className="border-t">
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role}</td>
                  <td className="p-2">{String(u.active)}</td>
                  <td className="p-2">{u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</td>
                  <td className="p-2 flex gap-2">
                    <Link to={`/admin/users/${id}`} className="px-2 py-1 border">modificar</Link>
                    <button onClick={() => handleDelete(id)} className="px-2 py-1 border">eliminar</button>
                  </td>
                </tr>
              );
            })}
            {data.items.length === 0 && (
              <tr><td className="p-2" colSpan={6}>sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border" disabled={loading}>prev</button>
        <span>page {page}</span>
        <button onClick={() => setPage(p => p + 1)} className="px-3 py-1 border" disabled={loading}>next</button>
        <select value={limit} onChange={(e) => setLimit(parseInt(e.target.value, 10))} className="border px-2 py-1">
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span>total {data.total}</span>
      </div>
    </section>
  );
}
