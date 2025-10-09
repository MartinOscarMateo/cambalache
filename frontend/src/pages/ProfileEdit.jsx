// frontend/src/pages/ProfileEdit.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ProfileEdit() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    avatar: ''
  })

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}')
    if (u?.email) {
      setForm(prev => ({
        ...prev,
        name: u.name || '',
        email: u.email || '',
        avatar: u.avatar || ''
      }))
    }
  }, [])

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function onFileChange(e) {
    const file = e.target.files[0]
    if (file) {
      const preview = URL.createObjectURL(file)
      setForm(prev => ({ ...prev, avatar: preview, avatarFile: file }))
    }
  }

  async function onSubmit(e) {
  e.preventDefault()
  const current = JSON.parse(localStorage.getItem('user') || '{}')
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const token = localStorage.getItem('token')

    // Solo actualizamos campos modificados
    const updated = { ...current }
    if (form.name && form.name !== current.name) updated.name = form.name
    if (form.email && form.email !== current.email) updated.email = form.email
    if (form.password && form.password === form.confirm) updated.password = form.password
    if (form.avatar && form.avatar !== current.avatar) updated.avatar = form.avatar

  try {
  const userId = current._id || current.id
  const res = await fetch(`${API}/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updated)
  })
  if (!res.ok) throw new Error('Error al actualizar usuario')

  const updatedUser = await res.json()
  localStorage.setItem('user', JSON.stringify(updatedUser))
  navigate('/profile')
} catch (err) {
  alert(err.message || 'Error al guardar cambios')
}
}

async function onDelete() {
  if (confirm('¿Seguro que querés eliminar tu cuenta? Esta acción no se puede deshacer.')) {
    const current = JSON.parse(localStorage.getItem('user') || '{}')
    const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    const token = localStorage.getItem('token')

    try {
      const res = await fetch(`${API}/api/users/${current._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Error al eliminar cuenta')

      localStorage.clear()
      navigate('/register')
    } catch (err) {
      alert(err.message || 'Error al eliminar cuenta')
    }
  }
}

  return (
    <main className="flex justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg border border-yellow-400 rounded-xl bg-white p-6 shadow-sm space-y-6"
      >
        <h1 className="text-2xl font-bold text-gray-900">Editar perfil</h1>

        {/* Foto */}
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
            {form.avatar && <img src={form.avatar} alt="avatar" className="w-full h-full object-cover" />}
          </div>
          <label className="cursor-pointer text-yellow-600 hover:underline">
            Cambiar foto
            <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </label>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm text-gray-600">Nombre</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={onChange}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-gray-600">Correo electrónico</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Contraseña */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Nueva contraseña</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Confirmar contraseña</label>
            <input
              type="password"
              name="confirm"
              value={form.confirm}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-between items-center pt-4 border-t">
          <button
            type="button"
            onClick={onDelete}
            className="text-red-600 hover:underline"
          >
            Eliminar cuenta
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-4 py-2 border rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-400 rounded-lg font-semibold hover:bg-yellow-500"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </form>
    </main>
  )
}