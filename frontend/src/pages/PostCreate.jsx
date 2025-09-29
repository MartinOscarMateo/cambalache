import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../lib/api.js';
import { uploadMany } from '../lib/upload.js';

export default function PostCreate() {
  const [form, setForm] = useState({ title: '', description: '', category: '' });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }
  function onFiles(e) {
    const arr = Array.from(e.target.files || []);
    setFiles(arr);
    setPreviews(arr.map(f => URL.createObjectURL(f)));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const title = form.title.trim();
    const description = form.description.trim();
    const category = form.category.trim().toLowerCase();
    if (title.length < 5) return setError('Título mínimo 5 caracteres');
    if (description.length < 10) return setError('Descripción mínima 10 caracteres');
    if (!category) return setError('Categoría requerida');
    if (!files.length) return setError('Subí al menos una imagen');

    setLoading(true);
    try {
      const images = await uploadMany(files.slice(0, 6));
      const post = await createPost({ title, description, category, images });
      const id = post.id || post._id;
      navigate(`/posts/${id}`);
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>Crear publicación</h1>
      <form onSubmit={onSubmit}>
        <label>Título</label>
        <input name="title" value={form.title} onChange={onChange} disabled={loading} />
        <label>Descripción</label>
        <textarea name="description" value={form.description} onChange={onChange} disabled={loading} />
        <label>Categoría</label>
        <input name="category" value={form.category} onChange={onChange} disabled={loading} placeholder="ej: bicicletas" />
        <label>Imágenes</label>
        <input type="file" accept="image/*" multiple onChange={onFiles} disabled={loading} />
        {!!previews.length && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8,margin:'8px 0'}}>
            {previews.map((src,i)=>(<img key={i} src={src} alt={`p${i}`} style={{width:'100%',height:120,objectFit:'cover',borderRadius:8}} />))}
          </div>
        )}
        {error && <p style={{color:'crimson'}}>{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Creando…' : 'Publicar'}</button>
      </form>
    </main>
  );
}