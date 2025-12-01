// frontend/src/pages/admin/AdminUserEdit.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function AdminUserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', role: 'user', active: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const latoHeading = {
    fontFamily:
      '"Lato", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  useEffect(() => {
    const token = localStorage.getItem('token') || '';

    async function load() {
      try {
        const res = await fetch(`${API}/api/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          navigate('/admin/users', { replace: true });
          return;
        }
        setForm({
          name: json.name || '',
          email: json.email || '',
          role: json.role || 'user',
          active: Boolean(json.active),
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, navigate]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('token') || '';

    const res = await fetch(`${API}/api/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        role: form.role,
        active: form.active,
      }),
    });

    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      alert(json?.error || 'Error al guardar');
      return;
    }
    navigate('/admin/users');
  }

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

  return (
    <main
      className="min-h-[85vh] px-4 py-8"
      style={{ background: 'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)' }}
    >
      <section className="max-w-4xl mx-auto">
        <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,.55)] border border-[color:var(--c-mid-blue)]/60">
          <header className="mb-6">
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
              Editar usuario
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--c-text)' }}>
              Actualiza los datos basicos, el rol y el estado de la cuenta.
            </p>
          </header>

          <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
            <div>
              <label
                className="block mb-1 text-sm font-medium"
                style={{ color: 'var(--c-text)' }}
              >
                Nombre
              </label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
              />
            </div>

            <div>
              <label
                className="block mb-1 text-sm font-medium"
                style={{ color: 'var(--c-text)' }}
              >
                Email
              </label>
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
              <label
                className="block mb-1 text-sm font-medium"
                style={{ color: 'var(--c-text)' }}
              >
                Rol
              </label>
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
              <span className="text-sm" style={{ color: 'var(--c-text)' }}>
                Cuenta activa
              </span>
            </label>

            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-3 rounded-xl font-semibold text-white bg-[color:var(--c-brand)] hover:brightness-110 transition disabled:opacity-60"
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <Link
                to="/admin/users"
                className="px-5 py-3 rounded-xl border border-[color:var(--c-mid-blue)]/60 hover:bg-[color:var(--c-mid-blue)]/15 transition text-sm font-semibold"
                style={{ color: 'var(--c-text)' }}
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}