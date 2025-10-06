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
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      category: data.category,
      condition: data.condition,
      hasDetails: data.hasDetails,
      detailsText: data.detailsText,
      location: data.location,
      openToOffers: data.openToOffers,
      interestsText: data.interestsText,
      images: data.images || []
    })
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || json?.message || 'Error al crear publicación');
  return json;
}


export async function uploadToCloudinary(file) {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', preset);
  form.append('folder', 'cambalache');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/upload`, { method: 'POST', body: form });
  const json = await res.json();
  if (!res.ok || !json.secure_url) throw new Error(json.error?.message || 'Error subiendo imagen');
  return json.secure_url;
}
export async function uploadMany(files) {
  const arr = Array.from(files || []);
  if (!arr.length) throw new Error('Sin archivos');
  const urls = await Promise.all(arr.map(uploadToCloudinary));
  return urls;
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


export async function getPostById(id) {
  const token = localStorage.getItem('token') || '';
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API}/api/posts/${id}`, { headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Error obteniendo la publicación');
  return json;
}

export async function getPostsByUser(userId, { page = 1, limit = 12 } = {}) {
  const token = localStorage.getItem('token') || '';
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const uid = typeof userId === 'object' ? (userId._id || userId.id || userId.userId) : String(userId);
  if (!uid) throw new Error('userId inválido');

  const url = new URL(`${API}/api/posts`);
  url.searchParams.set('ownerId', uid);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url, { headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || json?.message || 'Error listando publicaciones');
  return Array.isArray(json) ? { page: 1, limit: json.length || 0, total: json.length || 0, items: json } : json;
}


export async function updatePost(id, data) {
  const token = localStorage.getItem('token') || '';
  const res = await fetch(`${API}/api/posts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || json?.message || 'Error al actualizar la publicación');
  return json;
}

export async function deletePost(id) {
  const token = localStorage.getItem('token') || '';
  const res = await fetch(`${API}/api/posts/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || json?.message || 'Error al eliminar la publicación');
  return json;
}



// chat automatico tras propuesta de trueque
export async function createChatWithMessage(receiverId, text) {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const token = localStorage.getItem('token') || '';
  if (!receiverId) throw new Error('receiverId faltante');

  // crea o recupera un chat entre usuarios
  const chatRes = await fetch(`${API}/api/chats`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ userId: receiverId })
  });

  const chatJson = await chatRes.json().catch(() => ({}));
  if (!chatRes.ok) throw new Error(chatJson?.error || 'Error creando chat');

  const chatId = chatJson._id || chatJson.id;
  if (!chatId) throw new Error('Chat no válido');

  // envía mensaje inicial (usa la ruta correcta)
  if (text && text.trim()) {
    const msgRes = await fetch(`${API}/api/chats/messages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ chatId, text })
    });

    const msgJson = await msgRes.json().catch(() => ({}));
    if (!msgRes.ok) throw new Error(msgJson?.error || 'Error enviando mensaje');
  }

  return chatJson;
}