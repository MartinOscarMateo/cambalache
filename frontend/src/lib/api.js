// frontend/src/lib/api.js
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
      barrio: data.barrio,
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

// normaliza ids sueltos o objetos a string
function toUid(userId) {
  if (!userId) return '';
  if (typeof userId === 'object') return userId._id || userId.id || userId.userId || '';
  return String(userId);
}

// normaliza la respuesta
function normalizePostsEnvelope(j, fallbackPage = 1, fallbackLimit = 0) {
  // simple array
  if (Array.isArray(j)) {
    const items = j;
    return { page: 1, limit: items.length || 0, total: items.length || 0, items };
  }
  // objetos comunes
  const items = j?.items || j?.posts || j?.data || (Array.isArray(j?.results) ? j.results : []);
  if (Array.isArray(items)) {
    return {
      page: Number(j.page || fallbackPage || 1),
      limit: Number(j.limit || fallbackLimit || items.length || 0),
      total: Number(j.total || items.length || 0),
      items
    };
  }
  return null;
}

// obtiene lista de publicaciones con filtros, incluyendo barrio
export async function getPosts({ q = '', category = '', ownerId = '', status = '', sort = 'recent', page = 1, limit = 12, barrio = '' } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  if (ownerId) params.set('ownerId', ownerId);
  if (status) params.set('status', status);
  if (sort) params.set('sort', sort);
  if (page != null) params.set('page', String(page));
  if (limit != null) params.set('limit', String(limit));
  if (barrio) params.set('barrio', barrio);

  const token = localStorage.getItem('token') || '';
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API}/api/posts?${params.toString()}`, { headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || json?.message || 'Error obteniendo publicaciones');
  const env = normalizePostsEnvelope(json, page, limit) || { page: 1, limit: 0, total: 0, items: [] };
  return env;
}

// obtiene publis de usuario probando varios endpoints
export async function fetchUserPosts(userId, { page = 1, limit = 12 } = {}) {
  const token = localStorage.getItem('token') || '';
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const uid = toUid(userId);
  if (!uid) throw new Error('userId invalido');

  // endpoints
  const urls = [
    `${API}/api/posts?ownerId=${encodeURIComponent(uid)}&page=${page}&limit=${limit}`,
    // fallback por si se usa userId en vez de ownerId
    `${API}/api/posts?userId=${encodeURIComponent(uid)}&page=${page}&limit=${limit}`
  ];


  for (const url of urls) {
    try {
      const res = await fetch(url, { headers });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) continue;
      const env = normalizePostsEnvelope(j, page, limit);
      if (env) return env;
    } catch (err) {
      // ignore, try next URL
      console.debug('fetchUserPosts fallback URL failed', err);
    }
  }

  throw new Error('Error listando publicaciones del usuario');
}

export async function getPostsByUser(userId, { page = 1, limit = 12 } = {}) {
  // delega en la funcion central con fallback
  return fetchUserPosts(userId, { page, limit });
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

  // envia mensaje inicial
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

export async function updateTradeStatus(id, action) {
  const token = localStorage.getItem('token') || '';

  const res = await fetch(`${API}/api/trades/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || json?.message || 'Error actualizando estado del trueque');

  return json;
}
export async function rateTrade(tradeId, rating) {
  const token = localStorage.getItem('token') || '';

  const res = await fetch(`${API}/api/trades/${tradeId}/rate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ rating }),
  });

  let parsedJson = {};
  try {
    parsedJson = await res.json();
  } catch (e) {
    // parsing error fallback — keep minimal logging to help debugging
    console.debug('rateTrade parse error', e);
  }

  if (!res.ok) throw new Error(parsedJson?.error || parsedJson?.message || 'No se pudo enviar la calificación');

  return parsedJson;
}

export async function getBarrios() {
  const res = await fetch(`${API}/api/barrios`);
  const json = await res.json().catch(() => ([]));
  if (!res.ok) throw new Error(json?.message || 'Error obteniendo barrios');
  return json;
}

export async function getBarriosGeojson() {
  const res = await fetch(`${API}/api/barrios/geojson`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Error obteniendo barrios (geojson)');
  return json;
}

export async function getMeetingPlaces(barrio = '') {
  const params = new URLSearchParams();
  if (barrio) params.set('barrio', barrio);
  const res = await fetch(`${API}/api/meeting-places?${params.toString()}`);
  const json = await res.json().catch(() => ([]));
  if (!res.ok) throw new Error(json?.message || 'Error obteniendo espacios públicos');
  return json;
}

export async function getNotifications() {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${API}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const json = await res.json().catch(() => ([]));
  if (!res.ok) throw new Error(json?.message || "Error obteniendo notificaciones");

  return json;
}

export async function markNotificationAsRead(id) {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${API}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || "No se pudo marcar como leída");

  return json;
}
