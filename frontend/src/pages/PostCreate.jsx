import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../lib/api.js';
import { uploadToCloudinary } from '../lib/upload.js';

export default function PostCreate() {
  const [form, setForm] = useState({ title: '', description: '', category: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }
  function onFile(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : '');
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
    if (!file) return setError('Subí al menos una imagen');

    setLoading(true);
    try {
      const up = await uploadToCloudinary(file);
      const payload = { title, description, category, images: [up.url] };
      const post = await createPost(payload);
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
        <label>Imagen</label>
        <input type="file" accept="image/*" onChange={onFile} disabled={loading} />
        {preview && <img src={preview} alt="preview" style={{maxWidth:240, display:'block', margin:'8px 0'}} />}
        {error && <p style={{color:'crimson'}}>{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Publicar'}</button>
      </form>
    </main>
  );
}