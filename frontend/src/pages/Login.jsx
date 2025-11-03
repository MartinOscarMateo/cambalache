import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../lib/api.js';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await loginUser(form);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Error de inicio de sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'var(--c-text)' }}
    >
      <section className="w-full max-w-sm">
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,.25)] border border-[color:var(--c-mid-blue)]/50">
          <header className="text-center">
            <h2
              className="text-3xl font-bold tracking-tight"
              style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
            >
              Iniciar sesión
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--c-text)' }}>
              Accedé a tus trueques.
            </p>
          </header>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[color:var(--c-text)] px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <Link
                to="/forgot-password"
                className="underline underline-offset-2 hover:opacity-90"
                style={{ color: 'var(--c-info)' }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
              <Link
                to="/register"
                className="underline underline-offset-2 hover:opacity-90"
                style={{ color: 'var(--c-brand)' }}
              >
                Crear cuenta
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}