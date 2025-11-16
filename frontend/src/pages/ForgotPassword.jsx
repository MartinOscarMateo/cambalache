export default function ForgotPassword() {
  return (
    <main className="bg-[var(--c-text)] min-h-screen flex items-center justify-center px-4">
      <section className="w-full max-w-sm">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,.25)] border border-[color:var(--c-mid-blue)]/50">
          <h1 className="text-3xl! font-bold tracking-tight text-center">Recuperar contraseña</h1>
          <form onSubmit={e => e.preventDefault()} className="mt-6 space-y-4">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Email</label>
              <input type="email" placeholder="correo@ejemplo.com" className="w-full rounded-xl border px-4 py-3 border-slate-200 "/>
            </div>
            <button type="submit" className="w-full rounded-xl bg-[color:var(--c-text)] px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60">Enviar enlace</button>
          </form>
        </div>
      </section>
    </main>
  )
}