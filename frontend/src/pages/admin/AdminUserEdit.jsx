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
    <section>
      <h1 className="text-2xl font-bold text-[#2727d1] mb-4">editar usuario</h1>

      <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="block mb-1">name</label>
          <input name="name" value={form.name} onChange={onChange} className="border px-3 py-2 w-full" />
        </div>

        <div>
          <label className="block mb-1">email</label>
          <input name="email" type="email" value={form.email} onChange={onChange} className="border px-3 py-2 w-full" />
        </div>

        <div>
          <label className="block mb-1">role</label>
          <select name="role" value={form.role} onChange={onChange} className="border px-3 py-2 w-full">
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <label className="inline-flex items-center gap-2">
          <input name="active" type="checkbox" checked={form.active} onChange={onChange} />
          <span>active</span>
        </label>

        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 border" disabled={saving}>guardar</button>
          <Link to="/admin/users" className="px-4 py-2 border">cancelar</Link>
        </div>
      </form>
    </section>
  );
}