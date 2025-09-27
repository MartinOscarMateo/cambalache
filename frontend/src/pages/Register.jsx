import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../lib/api.js';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      await registerUser({ name: form.name, email: form.email, password: form.password });
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  return (
    <main>
      <h1>Crear cuenta</h1>
      <form onSubmit={onSubmit}>
        <p><label>Nombre<br /><input name="name" value={form.name} onChange={onChange} placeholder="Tu nombre" required /></label></p>
        <p><label>Email<br /><input name="email" type="email" value={form.email} onChange={onChange} placeholder="correo@ejemplo.com" required /></label></p>
        <p><label>Contraseña<br /><input name="password" type="password" value={form.password} onChange={onChange} minLength={6} required /></label></p>
        <p><label>Repetir contraseña<br /><input name="confirm" type="password" value={form.confirm} onChange={onChange} minLength={6} required /></label></p>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <p><button type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Registrarme'}</button></p>
      </form>
    </main>
  );
}