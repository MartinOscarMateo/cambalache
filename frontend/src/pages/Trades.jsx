import { useEffect, useState } from 'react';
import { listTrades } from '../lib/api.js';

export default function Trades() {
  const [role, setRole] = useState('inbox');
  const [onlyUnread, setOnlyUnread] = useState(false);
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
    <main className="min-h-[85vh] px-4 py-8" style={{ background: '#f6f2ff' }}>
      <div className='max-w-3xl mx-auto'>
        <h1 className='text-2xl font-bold text-center mb-4'>Trueques</h1>
        <div className="flex justify-center gap-4 my-5">
          <button 
            onClick={()=>setRole('inbox')} disabled={role==='inbox'}
            className={`px-3 py-2 rounded-full text-sm font-semibold border transition ${
              role === 'sent'
                ? 'bg-white border-slate-200 hover:bg-slate-50 '
                : 'bg-[color:var(--c-mid-cyan)]/20 border-[color:var(--c-mid-cyan)]/40'
            }`}
          >
            Recibidos
          </button>
          <button 
            onClick={()=>setRole('sent')} disabled={role==='sent'}
            className={`px-3 py-2 rounded-full text-sm font-semibold border transition ${
              role === 'inbox'
                ? 'bg-white border-slate-200 hover:bg-slate-50 '
                : 'bg-[color:var(--c-mid-cyan)]/20 border-[color:var(--c-mid-cyan)]/40'
            }`}
          >
            Enviados
          </button>
        </div>

        <ul className='bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,.12)] list-none p-0 m-0 grid'>
          {!data.items.length && <p className='p-5'>No hay trueques {role==='inbox'?'recibidos':'enviados'}.</p>}
        </ul>


        <ul className='bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,.12)] list-none p-0 m-0 grid gap-12'>
          {data.items.map(t => {
            const id = t.id || t._id;
            const pr = t.postRequestedId?.title || 'Publicación';
            const po = t.postOfferedId?.title || (t.itemsText ? 'Propuesta textual' : 'Sin oferta');
            const who = role==='inbox' ? t.proposerId?.name || 'Usuario' : t.receiverId?.name || 'Usuario';
            return (
              <li key={id} className='border border-[#e5e7eb] rounded-2xl p-5'>
                <div className='flex flex-col md:flex-row md:justify-between gap-4'>
                  <div>
                    <div style={{fontWeight:600}}>{pr}</div>
                    <div style={{fontSize:13,color:'#6b7280'}}>Oferta: {po}</div>
                    <div style={{fontSize:13,color:'#6b7280'}}>Con: {who}</div>
                  </div>
                  <div className='md:text-right'>
                    <div style={{fontSize:13,color:'#374151'}}>Estado: {t.status}</div>
                    <div style={{fontSize:13,color:'#6b7280'}}>{new Date(t.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}