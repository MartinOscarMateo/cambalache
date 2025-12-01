// frontend/src/pages/admin/AdminPanel.jsx
import { Link } from 'react-router-dom';

export default function AdminPanel() {
  const latoHeading = {
    fontFamily: '"Lato", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  return (
    <main
      className="min-h-[85vh] px-4 py-8"
      style={{ background: 'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)' }}
    >
      <section className="max-w-6xl mx-auto">
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
              Panel de administracion
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--c-text)' }}>
              Gestiona usuarios, publicaciones y trueques desde un solo lugar.
            </p>
          </header>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Usuarios */}
            <Link
              to="/admin/users"
              className="group rounded-2xl border border-[color:var(--c-mid-blue)]/60 bg-white shadow-[0_14px_35px_rgba(0,0,0,.14)] hover:shadow-[0_18px_45px_rgba(0,0,0,.2)] hover:bg-[color:var(--c-mid-blue)]/5 transition p-4 flex flex-col justify-between"
            >
              <div>
                <h2
                  className="text-lg font-semibold mb-1"
                  style={{ color: 'var(--c-text)', ...latoHeading }}
                >
                  Usuarios
                </h2>
                <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                  Ver y gestionar cuentas de la comunidad: bloqueos, roles y datos basicos.
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-[color:var(--c-brand)]">
                Ir a usuarios
                <span className="ml-1">›</span>
              </span>
            </Link>

            {/* Publicaciones */}
            <Link
              to="/admin/posts"
              className="group rounded-2xl border border-[color:var(--c-mid-blue)]/60 bg-white shadow-[0_14px_35px_rgba(0,0,0,.14)] hover:shadow-[0_18px_45px_rgba(0,0,0,.2)] hover:bg-[color:var(--c-mid-blue)]/5 transition p-4 flex flex-col justify-between"
            >
              <div>
                <h2
                  className="text-lg font-semibold mb-1"
                  style={{ color: 'var(--c-text)', ...latoHeading }}
                >
                  Publicaciones
                </h2>
                <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                  Revisar publicaciones, moderar contenido y marcar elementos como destacados o inactivos.
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-[color:var(--c-brand)]">
                Ir a publicaciones
                <span className="ml-1">›</span>
              </span>
            </Link>

            {/* Trueques */}
            <Link
              to="/admin/trades"
              className="group rounded-2xl border border-[color:var(--c-mid-blue)]/60 bg-white shadow-[0_14px_35px_rgba(0,0,0,.14)] hover:shadow-[0_18px_45px_rgba(0,0,0,.2)] hover:bg-[color:var(--c-mid-blue)]/5 transition p-4 flex flex-col justify-between"
            >
              <div>
                <h2
                  className="text-lg font-semibold mb-1"
                  style={{ color: 'var(--c-text)', ...latoHeading }}
                >
                  Trueques
                </h2>
                <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                  Monitorear intercambios, resolver conflictos y revisar historial de trueques.
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-[color:var(--c-brand)]">
                Ir a trueques
                <span className="ml-1">›</span>
              </span>
            </Link>

            {/* Reportes / Moderacion (placeholder) */}
            <Link
              to="/admin/reports"
              className="group rounded-2xl border border-[color:var(--c-mid-blue)]/60 bg-white shadow-[0_14px_35px_rgba(0,0,0,.14)] hover:shadow-[0_18px_45px_rgba(0,0,0,.2)] hover:bg-[color:var(--c-mid-blue)]/5 transition p-4 flex flex-col justify-between"
            >
              <div>
                <h2
                  className="text-lg font-semibold mb-1"
                  style={{ color: 'var(--c-text)', ...latoHeading }}
                >
                  Reportes
                </h2>
                <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                  Acceso rapido a contenido reportado y acciones de moderacion.
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-[color:var(--c-brand)]">
                Ir a reportes
                <span className="ml-1">›</span>
              </span>
            </Link>

            {/* Estadisticas (placeholder) */}
            <Link
              to="/admin/stats"
              className="group rounded-2xl border border-[color:var(--c-mid-blue)]/60 bg-white shadow-[0_14px_35px_rgba(0,0,0,.14)] hover:shadow-[0_18px_45px_rgba(0,0,0,.2)] hover:bg-[color:var(--c-mid-blue)]/5 transition p-4 flex flex-col justify-between"
            >
              <div>
                <h2
                  className="text-lg font-semibold mb-1"
                  style={{ color: 'var(--c-text)', ...latoHeading }}
                >
                  Estadisticas
                </h2>
                <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                  Vision general de la actividad: usuarios activos, publicaciones y volumen de trueques.
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-[color:var(--c-brand)]">
                Ver estadisticas
                <span className="ml-1">›</span>
              </span>
            </Link>

            {/* Configuracion (placeholder) */}
            <Link
              to="/admin/settings"
              className="group rounded-2xl border border-[color:var(--c-mid-blue)]/60 bg-white shadow-[0_14px_35px_rgba(0,0,0,.14)] hover:shadow-[0_18px_45px_rgba(0,0,0,.2)] hover:bg-[color:var(--c-mid-blue)]/5 transition p-4 flex flex-col justify-between"
            >
              <div>
                <h2
                  className="text-lg font-semibold mb-1"
                  style={{ color: 'var(--c-text)', ...latoHeading }}
                >
                  Configuracion
                </h2>
                <p className="text-sm" style={{ color: 'var(--c-text)' }}>
                  Ajustes generales de la plataforma y opciones avanzadas de administracion.
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-[color:var(--c-brand)]">
                Abrir configuracion
                <span className="ml-1">›</span>
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}