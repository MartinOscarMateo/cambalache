import { useState } from 'react';

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);


  return (
    <main className="bg-[var(--c-text)] min-h-screen flex items-center justify-center px-4">
      <section className="w-full max-w-sm">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,.25)] border border-[color:var(--c-mid-blue)]/50">
          <h1 className="text-3xl! font-bold tracking-tight text-center">Restablecer contraseña</h1>
          <form onSubmit={e => e.preventDefault()}>
            <div className="grid gap-1 my-5">
              <label className="text-sm font-medium">Nueva contraseña</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full rounded-xl border px-4 py-3 border-slate-200"/>
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
            <div className="grid gap-1 my-5">
              <label className="text-sm font-medium">Repetir contraseña</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} placeholder="••••••••" className="w-full rounded-xl border px-4 py-3 border-slate-200"/>
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-sm text-[color:var(--c-text)] hover:bg-slate-100"
                  aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirm ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full rounded-xl bg-[color:var(--c-text)] px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60">Guardar Contraseña</button>
          </form>
        </div>
      </section>
    </main>
  )
}