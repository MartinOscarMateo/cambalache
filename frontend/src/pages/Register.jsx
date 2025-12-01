import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../lib/api.js';
import Alert from '../components/Alert.jsx';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      await registerUser({ name: form.name, email: form.email, password: form.password });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo registrar');
    } finally {
      setForm(prev => ({ ...prev, password: '', confirm: '' }));
      setLoading(false);
    }
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'var(--c-text)' }}
    >
      <section className="w-full max-w-sm">
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,.25)] border border-[color:var(--c-mid-blue)]/50">
          <header className="text-center">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: 'var(--c-brand)' }}
            >
              Crear cuenta
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--c-text)' }}>
              Sumate a la comunidad de trueque.
            </p>
          </header>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid gap-1">
              <label htmlFor="name" className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                Nombre
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Tu nombre"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={onChange}
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-20 text-slate-900 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-sm text-[color:var(--c-text)] hover:bg-slate-100"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            <div className="grid gap-1">
              <label htmlFor="confirm" className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                Repetir contraseña
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  name="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={onChange}
                  minLength={6}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-20 text-slate-900 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-sm text-[color:var(--c-text)] hover:bg-slate-100"
                  aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                >
                  {showConfirm ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            {error && <Alert>{error}</Alert>}

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full rounded-xl bg-[color:var(--c-text)] px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? 'Registrando…' : 'Registrarme'}
            </button>

            <p className="text-center text-sm mt-2">
              <Link to="/login" className="underline underline-offset-2 hover:opacity-90" style={{ color: 'var(--c-brand)' }}>
                ¿Ya tenés cuenta? Iniciá sesión
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}