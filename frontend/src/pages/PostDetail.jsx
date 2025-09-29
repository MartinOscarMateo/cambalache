import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    setLoading(true);
    setError('');
    fetch(`${API}/api/posts/${id}`)
      .then(r => r.ok ? r.json() : r.json().then(j => Promise.reject(new Error(j.error || String(r.status)))))
      .then(data => { setPost(data); setIdx(0); })
      .catch(e => setError(e.message || 'Error'))
      .finally(() => setLoading(false));
  }, [id]);

  async function proposeTrade() {
    setInfo('');
    setError('');
    const me = JSON.parse(localStorage.getItem('user') || '{}');
    if (!me?.id && !me?._id) return setError('Necesitás iniciar sesión');
    const itemsText = window.prompt('Qué ofrecés a cambio?');
    if (itemsText === null) return;
    const text = String(itemsText).trim();
    if (!text) return setError('La propuesta no puede estar vacía');
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API}/api/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ postRequestedId: id, itemsText: text })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Error al proponer trueque');
      setInfo('Propuesta enviada');
    } catch (e) {
      setError(e.message || 'Error');
    }
  }

  if (loading) return <main className="container"><p>Cargando…</p></main>;
  if (error) return <main className="container"><p style={{color:'crimson'}}>{error}</p></main>;
  if (!post) return <main className="container"><p>No encontrado</p></main>;

  const images = Array.isArray(post.images) ? post.images : [];
  const me = JSON.parse(localStorage.getItem('user') || '{}');
  const myId = me?.id || me?._id || '';
  const ownerId = post.ownerId || post.userId || post.authorId || '';
  const isOwner = String(ownerId) === String(myId);

  function prev() { setIdx(p => (images.length ? (p - 1 + images.length) % images.length : 0)); }
  function next() { setIdx(p => (images.length ? (p + 1) % images.length : 0)); }

  return (
    <main className="container">
      <article>
        <h1>{post.title}</h1>

        {images.length > 1 ? (
          <div style={{position:'relative',maxWidth:720}}>
            <img src={images[idx]} alt={`${post.title}-${idx+1}`} style={{width:'100%',borderRadius:12}} />
            <button onClick={prev} style={{position:'absolute',left:8,top:'50%'}}>‹</button>
            <button onClick={next} style={{position:'absolute',right:8,top:'50%'}}>›</button>
            <div style={{display:'flex',gap:6,marginTop:8,overflowX:'auto'}}>
              {images.map((u,i)=>(
                <img key={i} src={u} onClick={()=>setIdx(i)} style={{width:64,height:64,objectFit:'cover',borderRadius:8,opacity:i===idx?1:0.5,cursor:'pointer'}} />
              ))}
            </div>
          </div>
        ) : (
          images[0] ? <img src={images[0]} alt={post.title} style={{maxWidth:'100%',borderRadius:12}} /> : null
        )}

        <p>{post.description}</p>
        <p style={{color:'#6b7280'}}>{post.category}</p>

        {!isOwner && <button onClick={proposeTrade} style={{marginTop:12}}>Proponer trueque</button>}
        {isOwner && <p style={{marginTop:12,color:'#6b7280'}}>Sos el dueño de esta publicación</p>}
        {info && <p style={{color:'#0a7f2e',marginTop:8}}>{info}</p>}
      </article>
    </main>
  );
}