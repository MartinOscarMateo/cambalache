import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function Profile() {
  const params = useParams();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    if (!u?.id && !u?._id) {
      setError('No autenticado');
      setLoading(false);
      return;
    }
    setMe(u);
    setLoading(false);
  }, []);

  if (loading) return <main className="container"><p>Cargando…</p></main>;
  if (error) return <main className="container"><p style={{color:'crimson'}}>{error}</p></main>;

  const myId = me.id || me._id;
  const viewingOwn = !params.id || String(params.id) === String(myId);

  return (
    <main className="container">
      <section style={{display:'grid',gap:12,maxWidth:720}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:'#e5e7eb'}} />
          <div>
            <h1 style={{margin:0}}>{me.name || me.email}</h1>
            <p style={{margin:'4px 0',color:'#6b7280'}}>{me.email}</p>
          </div>
        </div>

        {viewingOwn && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
            <button onClick={()=>navigate('/posts/create')}>Crear publicación</button>
            <button onClick={()=>navigate('/trades')}>Mis trueques</button>
            <button onClick={()=>navigate(`/users/${myId}/followers`)}>Mis seguidores</button>
            <button onClick={()=>navigate(`/users/${myId}/following`)}>Seguidos</button>
            <button onClick={()=>navigate('/profile/edit')}>Editar perfil</button>
          </div>
        )}

        {!viewingOwn && (
          <div style={{display:'flex',gap:12}}>
            <button onClick={()=>navigate(`/users/${params.id}/followers`)}>Ver seguidores</button>
            <button onClick={()=>navigate(`/users/${params.id}/following`)}>Ver seguidos</button>
          </div>
        )}
      </section>
    </main>
  );
}