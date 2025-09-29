import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getFollowing } from '../lib/api.js';

export default function FollowingList() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  async function load(more = false) {
    setLoading(true);
    const data = await getFollowing(id, 20, more ? cursor : '');
    setItems(more ? [...items, ...data.items] : data.items);
    setCursor(data.nextCursor || '');
    setHasMore(Boolean(data.nextCursor));
    setLoading(false);
  }

  useEffect(() => { load(false); }, [id]);

  return (
    <main className="p-4">
      <h1 className="text-lg font-semibold mb-3">Siguiendo</h1>
      <ul className="space-y-2">
        {items.map(u => (
          <li key={u._id} className="flex items-center gap-2">
            <img src={u.avatar || ''} alt="" className="w-8 h-8 rounded-full border" onError={e=>{e.currentTarget.style.visibility='hidden';}} />
            <span>{u.name || u._id}</span>
          </li>
        ))}
      </ul>
      {hasMore && <button className="mt-3 px-3 py-1 rounded border" disabled={loading} onClick={()=>load(true)}>{loading ? 'Cargando...' : 'Cargar más'}</button>}
    </main>
  );
}