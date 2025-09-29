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