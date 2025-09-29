import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getMe, getFollowers, getFollowing, followUser, unfollowUser } from '../lib/api.js';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';

function FollowButton({ targetId, meId, onChange }) {
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getFollowers(targetId, 50);
        const found = data.items.some(u => String(u._id) === String(meId));
        if (active) setFollowing(found);
      } catch {}
    })();
    return () => { active = false; };
  }, [targetId, meId]);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    try {
      if (following) {
        await unfollowUser(targetId);
        setFollowing(false);
        onChange && onChange();
      } else {
        await followUser(targetId);
        setFollowing(true);
        onChange && onChange();
      }
    } finally {
      setLoading(false);
    }
  }

  if (String(targetId) === String(meId)) return null;
  return <button onClick={toggle} disabled={loading} className="px-3 py-1 rounded border">{loading ? '...' : following ? 'Dejar de seguir' : 'Seguir'}</button>;
}

export default function Profile() {
  const params = useParams();
  const [me, setMe] = useState(null);
  const [targetId, setTargetId] = useState('');
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  async function loadCounts(id) {
    const [a, b] = await Promise.all([getFollowers(id, 1), getFollowing(id, 1)]);
    setCounts({ followers: a.total || 0, following: b.total || 0 });
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
        const res = await getMe();
        const u = res?.user ?? res;
        setMe(u);
        localStorage.setItem('user', JSON.stringify(u));
        const tid = params.id || u._id;
        setTargetId(tid);
        await loadCounts(tid);
      } catch (err) {
        const status = err?.status || err?.response?.status;
        if (status === 401) {
          logout();
          return;
        }
        setError(err?.message || 'Error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, params.id]);

  if (loading) return <main className="p-4"><Spinner label="Cargando perfil…" /></main>;
  if (error) return (
    <main className="p-4">
      <h1 className="text-2xl font-semibold">Perfil</h1>
      <Alert>{error}</Alert>
      <button onClick={logout} className="mt-3">Salir</button>
    </main>
  );

  const viewingOwn = String(targetId) === String(me?._id);

  return (
    <main className="p-4 space-y-3">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{viewingOwn ? 'Mi perfil' : 'Perfil'}</h1>
        {me && <FollowButton targetId={targetId} meId={me._id} onChange={() => loadCounts(targetId)} />}
      </header>
      <section className="flex gap-6">
        <Link to={`/users/${targetId}/followers`} className="underline">Seguidores: {counts.followers}</Link>
        <Link to={`/users/${targetId}/following`} className="underline">Siguiendo: {counts.following}</Link>
      </section>
      {viewingOwn && (
        <section className="space-y-1">
          <p><strong>Usuario:</strong> {me?.name || me?.username || '(sin nombre)'}</p>
          <p><strong>Email:</strong> {me?.email}</p>
          {me?.bio && <p><strong>Bio:</strong> {me.bio}</p>}
          <button onClick={logout}>Cerrar sesión</button>
        </section>
      )}
    </main>
  );
}