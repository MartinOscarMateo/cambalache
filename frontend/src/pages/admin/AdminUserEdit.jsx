import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function AdminUserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', role: 'user', active: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    async function load() {
      const res = await fetch(`${API}/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return navigate('/admin/users', { replace: true });
      setForm({
        name: json.name || '',
        email: json.email || '',
        role: json.role || 'user',
        active: Boolean(json.active)
      });
      setLoading(false);
    }
    load();
  }, [id, navigate]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(s => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('token') || '';
    const res = await fetch(`${API}/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        role: form.role,
        active: form.active
      })
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return alert(json?.error || 'error al guardar');
    navigate('/admin/users');
  }

  if (loading) return null;

  return (
    <main
      className="min-h-screen px-4 py-8"
      style={{ background: 'var(--c-text)' }}
    >
      <div className="max-w-4xl mx-auto">
        <section className="rounded-2xl bg-white p-5 sm:p-6 border border-[color:var(--c-mid-blue)]/60 shadow-[0_20px_60px_rgba(0,0,0,.25)]">
          <header className="mb-6">
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
            >
              editar usuario
            </h1>
          </header>

          <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
            <div>
              <label className="block mb-1 text-sm font-medium" style={{ color: 'var(--c-text)' }}>name</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium" style={{ color: 'var(--c-text)' }}>email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium" style={{ color: 'var(--c-text)' }}>role</label>
              <select
                name="role"
                value={form.role}
                onChange={onChange}
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <label className="inline-flex items-center gap-2">
              <input
                name="active"
                type="checkbox"
                checked={form.active}
                onChange={onChange}
                disabled={saving}
              />
              <span className="text-sm" style={{ color: 'var(--c-text)' }}>active</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-3 rounded-xl font-semibold text-white bg-[color:var(--c-brand)] hover:brightness-110 transition disabled:opacity-60"
              >
                {saving ? 'guardando…' : 'guardar'}
              </button>
              <Link
                to="/admin/users"
                className="px-5 py-3 rounded-xl border border-[color:var(--c-mid-blue)]/60 hover:bg-[color:var(--c-mid-blue)]/15 transition"
                style={{ color: 'var(--c-text)' }}
              >
                cancelar
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}