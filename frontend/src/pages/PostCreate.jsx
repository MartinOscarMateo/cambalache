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
    if (!form.title.trim() || !form.description.trim() || !form.category.trim()) {
      setError('Completá título, descripción y categoría');
      return;
    }
    setLoading(true);
    try {
      let images = [];
      if (file) {
        const up = await uploadToCloudinary(file);
        images = [up.url];
      }
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        images
      };
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
        <input name="category" value={form.category} onChange={onChange} disabled={loading} />
        <label>Imagen</label>
        <input type="file" accept="image/*" onChange={onFile} disabled={loading} />
        {preview && <img src={preview} alt="preview" style={{maxWidth:240, display:'block', margin:'8px 0'}} />}
        {error && <p style={{color:'crimson'}}>{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Publicar'}</button>
      </form>
    </main>
  );
}