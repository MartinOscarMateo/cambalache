import { useEffect, useState } from 'react';
import { listTrades } from '../lib/api.js';

export default function Trades() {
  const [role, setRole] = useState('inbox');
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    listTrades({ role, page: 1, limit: 10 })
      .then(setData)
      .catch(e => setError(e.message || 'Error'))
      .finally(() => setLoading(false));
  }, [role]);

  if (loading) return <main className="container"><p>Cargando…</p></main>;
  if (error) return <main className="container"><p style={{color:'crimson'}}>{error}</p></main>;

  return (
    <main className="container">
      <h1>Trueques</h1>
      <div style={{display:'flex',gap:8,margin:'12px 0'}}>
        <button onClick={()=>setRole('inbox')} disabled={role==='inbox'}>Recibidos</button>
        <button onClick={()=>setRole('sent')} disabled={role==='sent'}>Enviados</button>
      </div>

      {!data.items.length && <p>No hay trueques {role==='inbox'?'recibidos':'enviados'}.</p>}

      <ul style={{listStyle:'none',padding:0,margin:0,display:'grid',gap:12}}>
        {data.items.map(t => {
          const id = t.id || t._id;
          const pr = t.postRequestedId?.title || 'Publicación';
          const po = t.postOfferedId?.title || (t.itemsText ? 'Propuesta textual' : 'Sin oferta');
          const who = role==='inbox' ? t.proposerId?.name || 'Usuario' : t.receiverId?.name || 'Usuario';
          return (
            <li key={id} style={{border:'1px solid #e5e7eb',borderRadius:12,padding:12}}>
              <div style={{display:'flex',justifyContent:'space-between',gap:12}}>
                <div>
                  <div style={{fontWeight:600}}>{pr}</div>
                  <div style={{fontSize:12,color:'#6b7280'}}>Oferta: {po}</div>
                  <div style={{fontSize:12,color:'#6b7280'}}>Con: {who}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:12,color:'#374151'}}>Estado: {t.status}</div>
                  <div style={{fontSize:12,color:'#6b7280'}}>{new Date(t.createdAt).toLocaleString()}</div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}