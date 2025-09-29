import { useEffect, useState } from 'react';
import PostCard from '../components/PostCard.jsx';

export default function PostList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const url = `${API}/api/posts?page=1&limit=12`;
    fetch(url)
      .then(r => r.ok ? r.json() : r.json().then(j => Promise.reject(new Error(j.error || String(r.status)))))
      .then(data => setItems(Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []))
      .catch(e => setError(e.message || 'Error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="container"><p>Cargando…</p></main>;
  if (error) return <main className="container"><p style={{color:'crimson'}}>{error}</p></main>;
  if (!items.length) return <main className="container"><p>No hay publicaciones</p></main>;

  return (
    <main className="container">
      <h1>Publicaciones</h1>
      <div className="grid">
        {items.map(p => <PostCard key={p.id || p._id} post={p} />)}
      </div>
    </main>
  );
}