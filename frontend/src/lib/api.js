const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function registerUser(payload) {
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || 'Request failed';
    throw new Error(msg);
  }
  return data;
}

export async function loginUser(payload) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Credenciales inválidas');
  return data;
}

export async function getMe() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token');

  const res = await fetch(`${API}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = new Error('No autorizado');
    err.status = res.status;
    throw err;
  }

  return res.json();
}