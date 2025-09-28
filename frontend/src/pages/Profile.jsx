import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../lib/api.js';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    (async () => {
      try {
        setError('');
        const me = await getMe();
        const u = me?.user ?? me;
        setUser(u);
        // sincronizamos una copia en storage
        localStorage.setItem('user', JSON.stringify(u));
      } catch (err) {
        const status = err?.status || err?.response?.status;
        if (status === 401) {
          // token invalido y/o expirado
          logout();
          return;
        }
        setError(err?.message || 'Error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) return <main><p>Cargando…</p></main>;
  if (error) return (
    <main>
      <h1>Mi perfil</h1>
      <p style={{ color: 'crimson' }}>{error}</p>
      <button onClick={logout}>Salir</button>
    </main>
  );

  return (
    <main>
      <h1>Mi perfil</h1>
      <p><strong>Usuario:</strong> {user?.name || user?.username || '(sin nombre)'}</p>
      <p><strong>Email:</strong> {user?.email}</p>
      {user?.bio && <p><strong>Bio:</strong> {user.bio}</p>}
      <button onClick={logout}>Cerrar sesión</button>
    </main>
  );
}