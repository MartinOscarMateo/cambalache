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

  // manejar cambios de texto
  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // seleccion de archivo para avatar
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

    // solo actualizamos campos modificados
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
    <main
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'var(--c-text)' }}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,.25)] border border-[color:var(--c-mid-blue)]/60"
      >
        {/* encabezado */}
        <header className="mb-6">
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
          >
            Editar perfil
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--c-text)' }}>
            Actualiza tus datos y foto de perfil.
          </p>
        </header>

        {/* fila avatar + accion */}
        <div className="flex items-center gap-4 sm:gap-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4" style={{ ringColor: 'var(--c-brand)' }}>
              {form.avatar ? (
                <img src={form.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full grid place-items-center text-sm font-bold"
                  style={{
                    color: 'var(--c-text)',
                    background:
                      'radial-gradient(60% 60% at 30% 30%, var(--c-accent), transparent 70%), radial-gradient(60% 60% at 70% 70%, var(--c-info), transparent 70%), #f6f6ff'
                  }}
                >
                  Foto
                </div>
              )}
            </div>
          </div>

          <label className="inline-flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer border border-[color:var(--c-mid-blue)]/60 hover:bg-[color:var(--c-mid-blue)]/15 transition text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
            Cambiar foto
            <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </label>
        </div>

        {/* grupo: datos basicos */}
        <section className="grid gap-4 sm:grid-cols-2 mb-6">
          <div className="grid gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>Nombre</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
              placeholder="Tu nombre"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>Correo electronico</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
              placeholder="correo@ejemplo.com"
            />
          </div>
        </section>

        {/* grupo: contrasena */}
        <section className="grid gap-4 sm:grid-cols-2 mb-6">
          <div className="grid gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>Nueva contrasena</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
              placeholder="Minimo 6 caracteres"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>Confirmar contrasena</label>
            <input
              type="password"
              name="confirm"
              value={form.confirm}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
              placeholder="Repite la contrasena"
            />
          </div>
        </section>

        {/* acciones */}
        <div className="pt-4 border-t flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
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
              className="px-4 py-3 rounded-xl border border-[color:var(--c-mid-blue)]/60 hover:bg-[color:var(--c-mid-blue)]/15 transition font-semibold"
              style={{ color: 'var(--c-text)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-3 rounded-xl font-semibold text-white hover:brightness-110 transition"
              style={{ background: 'var(--c-text)' }}
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </form>
    </main>
  )
}