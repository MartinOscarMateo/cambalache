import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../lib/api.js';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';

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

  if (loading) return <main className="p-4"><Spinner label="Cargando perfil…" /></main>;
  if (error) return (
    <main className="p-4">
      <h1 className="text-2xl font-semibold">Mi perfil</h1>
      <Alert>{error}</Alert>
      <button onClick={logout} className="mt-3">Salir</button>
    </main>
);

  return (
    <main>
      <h1 className="text-2xl font-semibold">Mi perfil</h1>
      <p><strong>Usuario:</strong> {user?.name || user?.username || '(sin nombre)'}</p>
      <p><strong>Email:</strong> {user?.email}</p>
      {user?.bio && <p><strong>Bio:</strong> {user.bio}</p>}
      <button onClick={logout}>Cerrar sesión</button>
    </main>
  );
}