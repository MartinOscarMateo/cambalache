import { useEffect, useState } from 'react';
import { listTrades } from '../lib/api.js';
import TradeActions from '../components/TradeActions.jsx';

export default function Trades() {
  const [role, setRole] = useState('inbox');
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const myId = String(currentUser._id || currentUser.id || '');

  useEffect(() => {
    setLoading(true);
    setError('');
    listTrades({ role, page: 1, limit: 10 })
      .then(setData)
      .catch(e => setError(e.message || 'Error'))
      .finally(() => setLoading(false));
  }, [role]);

  function statusLabel(status) {
    if (status === 'pending') return 'Pendiente';
    if (status === 'countered') return 'Con contraoferta';
    if (status === 'accepted') return 'En progreso';
    if (status === 'finished') return 'Finalizado';
    if (status === 'rejected') return 'Rechazado';
    if (status === 'cancelled') return 'Cancelado';
    return status || 'Desconocido';
  }

  function statusDetail(t) {
    const status = t.status;
    const finishedBy = Array.isArray(t.finishedBy) ? t.finishedBy.map(v => {
      if (!v) return '';
      if (typeof v === 'string') return v;
      return v._id || v.id || v.userId || '';
    }) : [];
    const iFinished = myId && finishedBy.includes(myId);

    if (status === 'pending') {
      if (role === 'inbox') return 'Esperando que respondas la propuesta.';
      return 'Esperando respuesta de la otra persona.';
    }
    if (status === 'countered') {
      return 'Hay una contraoferta pendiente de revisión.';
    }
    if (status === 'accepted') {
      if (iFinished) {
        return 'Ya marcaste el trueque como realizado. Falta que la otra parte también lo marque.';
      }
      return 'El trueque está aceptado. Cuando ambos lo marquen como realizado se dará por finalizado.';
    }
    if (status === 'finished') {
      return 'Ambas partes marcaron el trueque como realizado.';
    }
    if (status === 'rejected') return 'La propuesta fue rechazada.';
    if (status === 'cancelled') return 'El trueque fue cancelado.';
    return '';
  }

  function meetingSummary(t) {
    const meeting = t.meeting || {};
    if (!meeting || meeting.status === 'none') return '';
    const parts = [];
    if (meeting.placeName) parts.push(meeting.placeName);
    if (meeting.barrio) parts.push(meeting.barrio);
    if (meeting.placeAddress) parts.push(meeting.placeAddress);
    const base = parts.join(' · ') || t.meetingArea || '';
    if (!base) return '';
    if (meeting.status === 'proposed') return `Punto de encuentro propuesto: ${base}`;
    if (meeting.status === 'confirmed') return `Punto de encuentro confirmado: ${base}`;
    return `Punto de encuentro: ${base}`;
  }

  if (loading) return <main className="container"><p>Cargando…</p></main>;
  if (error) return <main className="container"><p style={{color:'crimson'}}>{error}</p></main>;

  return (
  <main
  className="min-h-[85vh] px-4 py-8"
  style={{ background: 'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)' }}
>
      <div className="max-w-3xl mx-auto">
        <header className="mb-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.18em]" style={{color:'var(--c-info)'}}>
            Resumen de intercambios
          </p>
          <h1 className="text-2xl font-bold mt-1" style={{ color: 'var(--c-brand)' }}>
            Trueques
          </h1>
          <p className="mt-1 text-sm" style={{color:'var(--c-bg-soft,#f6f2ff)'}}>
            Revisá las propuestas que recibiste y las que enviaste, seguí el estado y marcá los trueques como realizados.
          </p>
        </header>

        <div className="flex justify-center gap-4 my-5">
          <button
            onClick={()=>setRole('inbox')}
            disabled={role==='inbox'}
            className={`px-3 py-2 rounded-full text-sm font-semibold border transition ${
              role === 'sent'
                ? 'bg-white border-slate-200 hover:bg-slate-50'
                : 'bg-[color:var(--c-mid-cyan)]/20 border-[color:var(--c-mid-cyan)]/40'
            }`}
          >
            Recibidos
          </button>
          <button
            onClick={()=>setRole('sent')}
            disabled={role==='sent'}
            className={`px-3 py-2 rounded-full text-sm font-semibold border transition ${
              role === 'inbox'
                ? 'bg-white border-slate-200 hover:bg-slate-50'
                : 'bg-[color:var(--c-mid-cyan)]/20 border-[color:var(--c-mid-cyan)]/40'
            }`}
          >
            Enviados
          </button>
        </div>

        <ul className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,.12)] list-none p-0 m-0 grid">
          {!data.items.length && (
            <p className="p-5 text-sm" style={{color:'var(--c-text)'}}>
              No hay trueques {role==='inbox'?'recibidos':'enviados'}.
            </p>
          )}
        </ul>

        <ul className="rounded-2xl list-none p-0 m-0 grid gap-6 mt-4">
          {data.items.map(t => {
            const id = t.id || t._id;
            const pr = t.postRequestedId?.title || 'Publicación';
            const po = t.postOfferedId?.title || (t.itemsText ? 'Propuesta textual' : 'Sin oferta');
            const who = role==='inbox' ? t.proposerId?.name || 'Usuario' : t.receiverId?.name || 'Usuario';
            const created = t.createdAt ? new Date(t.createdAt).toLocaleString() : '';
            const badgeLabel = statusLabel(t.status);
            const detail = statusDetail(t);
            const meetingText = meetingSummary(t);

            let badgeClass = 'bg-slate-200/80 text-slate-700';
            if (t.status === 'pending') badgeClass = 'bg-[color:var(--c-info)]/10 text-[color:var(--c-info)]';
            else if (t.status === 'countered') badgeClass = 'bg-amber-100 text-amber-700';
            else if (t.status === 'accepted') badgeClass = 'bg-[color:var(--c-mid-cyan)]/15 text-[color:var(--c-mid-cyan)]';
            else if (t.status === 'finished') badgeClass = 'bg-[color:var(--c-accent)]/25 text-[color:var(--c-text)]';
            else if (t.status === 'rejected') badgeClass = 'bg-red-100 text-red-600';
            else if (t.status === 'cancelled') badgeClass = 'bg-slate-100 text-slate-600';

            return (
              <li key={id} className="bg-white shadow-[0_10px_30px_rgba(0,0,0,.18)] border border-[#e5e7eb] rounded-2xl p-5">
                <div className="flex flex-col md:flex-row md:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold" style={{color:'var(--c-text)'}}>
                      {pr}
                    </div>
                    <div style={{fontSize:13,color:'#6b7280'}}>
                      Oferta: {po}
                    </div>
                    <div style={{fontSize:13,color:'#6b7280'}}>
                      Con: {who}
                    </div>
                    {meetingText && (
                      <div style={{fontSize:12,color:'var(--c-info)'}}>
                        {meetingText}
                      </div>
                    )}
                  </div>
                  <div className="md:text-right flex flex-col items-start md:items-end gap-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badgeClass}`}>
                      {badgeLabel}
                    </span>
                    <div style={{fontSize:13,color:'#374151'}}>
                      Estado: {t.status}
                    </div>
                    {detail && (
                      <div style={{fontSize:12,color:'#6b7280',maxWidth:260}}>
                        {detail}
                      </div>
                    )}
                    <div style={{fontSize:12,color:'#6b7280'}}>
                      {created}
                    </div>
                  </div>
                </div>
                <TradeActions trade={t} />
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}