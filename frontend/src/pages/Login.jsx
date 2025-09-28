import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../lib/api.js';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await loginUser(form);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Error de inicio de sesión');
    } finally {
      setLoading(false);
    }
  }

   return (
    <main>
      <h1>Iniciar sesión</h1>
      <form onSubmit={onSubmit}>
        <p><label>Email<br /><input name="email" type="email" value={form.email} onChange={onChange} placeholder="correo@ejemplo.com" required /></label></p>
        <p><label>Contraseña<br /><input name="password" type="password" value={form.password} onChange={onChange} placeholder="••••••••" required /></label></p>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <p><button type="submit" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button></p>
      </form>
      <p><Link to="/forgot-password">¿Olvidaste tu contraseña?</Link></p>
    </main>
  );
}