// frontend/src/pages/Notifications.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, markNotificationAsRead } from '../lib/api.js';

// estilo Lato
const latoHeading = {
  fontFamily:
    '"Lato", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

export default function Noticications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();
  const avatar = user?.avatar;

  useEffect(() => {
    getNotifications()
      .then(res => {
        setNotifications(Array.isArray(res) ? res : []);
      })
      .catch(e => setError(e.message || 'Error al cargar notificaciones'))
      .finally(() => setLoading(false));
  }, []);

  async function handleOpenNotification(n) {
    if (n.read) return;
    try {
      await markNotificationAsRead(n._id);
      setNotifications(prev =>
        prev.map(item =>
          item._id === n._id ? { ...item, read: true } : item
        )
      );
    } catch (e) {
      // si falla, no rompemos la navegacion
      console.error(e);
    }
  }

  if (loading) {
    return (
      <main
        className="min-h-[85vh] flex items-center justify-center px-4 py-10"
        style={{
          background:
            'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)',
        }}
      >
        <div className="rounded-2xl bg-white/95 px-6 py-4 shadow-[0_18px_50px_rgba(0,0,0,.45)] border border-[color:var(--c-mid-blue)]/50">
          <p style={{ color: 'var(--c-text)' }}>Cargando notificaciones…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        className="min-h-[85vh] flex items-center justify-center px-4 py-10"
        style={{
          background:
            'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)',
        }}
      >
        <div className="rounded-2xl bg-white/95 px-6 py-4 shadow-[0_18px_50px_rgba(0,0,0,.45)] border border-red-200">
          <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2">
            {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-[85vh] px-4 py-8"
      style={{
        background:
          'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)',
      }}
    >
      <section className="max-w-4xl mx-auto">
        <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,.55)] border border-[color:var(--c-mid-blue)]/60">
          {/* encabezado */}
          <header className="mb-5 text-center sm:text-left">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--c-info)]/90">
              Centro de actividad
            </p>
            <h1
              className="mt-1 text-2xl sm:text-3xl font-bold"
              style={{ color: 'var(--c-brand)', ...latoHeading }}
            >
              Notificaciones
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--c-text)' }}>
              Todas las novedades sobre tus trueques y actividad en Cambalache.
            </p>
          </header>

          {/* lista de notificaciones */}
          <div className="flex flex-col gap-4 mt-4">
            {notifications.length === 0 && (
              <p
                className="text-center py-10 text-sm"
                style={{ color: 'var(--c-text)' }}
              >
                No tenés notificaciones todavía.
              </p>
            )}

            {notifications.map(n => {
              const created = n.createdAt
                ? new Date(n.createdAt).toLocaleString()
                : '';

              return (
                <Link
                  key={n._id}
                  to={n.link}
                  onClick={() => handleOpenNotification(n)}
                  className="block"
                >
                  <article
                    className={`flex gap-3 sm:gap-4 items-start rounded-2xl border border-[color:var(--c-mid-blue)]/50 bg-white/95 px-4 py-3 sm:px-5 sm:py-4 shadow-[0_20px_60px_rgba(0,0,0,.25)] hover:bg-[color:var(--c-mid-blue)]/6 transition ${
                      !n.read ? 'ring-2 ring-[color:var(--c-brand)]/25' : ''
                    }`}
                  >
                    {/* avatar / icono */}
                    <div className="mt-1">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 overflow-hidden ring-2 ring-[color:var(--c-brand)]/70">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full grid place-items-center text-xs font-bold"
                            style={{
                              color: 'var(--c-text)',
                              background:
                                'radial-gradient(60% 60% at 30% 30%, var(--c-accent), transparent 70%), radial-gradient(60% 60% at 70% 70%, var(--c-info), transparent 70%), #f6f6ff',
                            }}
                          >
                            C
                          </div>
                        )}
                      </div>
                    </div>

                    {/* contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-3">
                        <h3
                          className="text-sm sm:text-base font-semibold truncate"
                          style={{ color: 'var(--c-text)', ...latoHeading }}
                        >
                          {n.title}
                        </h3>

                        {!n.read && (
                          <div className="flex items-start text-xs sm:text-sm text-[color:var(--c-text)]">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-[color:var(--c-brand)]/60 px-3 py-1">
                              <span className="h-2 w-2 rounded-full bg-[color:var(--c-brand)]" />
                              Nuevo
                            </span>
                          </div>
                        )}
                      </div>

                      <p
                        className="mt-1 text-sm text-gray-700 whitespace-pre-line"
                        style={{ fontFamily: '"Lato", system-ui, sans-serif' }}
                      >
                        {n.message}
                      </p>

                      <p className="mt-2 text-xs text-gray-400">
                        {created}
                      </p>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}