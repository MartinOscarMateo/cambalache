const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function registerUser(payload) {
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Request failed');
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
  if (!token) {
    const e = new Error('No hay token');
    e.status = 401;
    throw e;
  }
  const res = await fetch(`${API}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const e = new Error('No autorizado');
    e.status = res.status;
    throw e;
  }
  return res.json();
}

export async function followUser(userId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API}/api/follows/${userId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

export async function unfollowUser(userId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API}/api/follows/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok && res.status !== 204) throw new Error(String(res.status));
  return true;
}

export async function getFollowers(userId, limit = 20, cursor = '') {
  const token = localStorage.getItem('token');
  const q = new URLSearchParams({ limit: String(limit), ...(cursor ? { cursor } : {}) });
  const res = await fetch(`${API}/api/users/${userId}/followers?${q}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

export async function getFollowing(userId, limit = 20, cursor = '') {
  const token = localStorage.getItem('token');
  const q = new URLSearchParams({ limit: String(limit), ...(cursor ? { cursor } : {}) });
  const res = await fetch(`${API}/api/users/${userId}/following?${q}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}


export async function createPost(data) {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const token = localStorage.getItem('token') || '';
  const res = await fetch(`${API}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Error al crear publicación');
  return json;
}


export async function listTrades({ role = 'inbox', page = 1, limit = 10 } = {}) {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const token = localStorage.getItem('token') || '';
  const url = new URL(`${API}/api/trades`);
  url.searchParams.set('role', role);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', limit);
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Error listando trueques');
  return Array.isArray(json.items) ? json : { page: 1, limit: json.length || 0, total: json.length || 0, items: json };
}
