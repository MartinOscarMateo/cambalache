// frontend/src/pages/Profile.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function Profile() {
  const params = useParams()
  const navigate = useNavigate()
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}')
    if (!u?.id && !u?._id) {
      setError('No autenticado')
      setLoading(false)
      return
    }
    setMe(u)
    setLoading(false)
  }, [])

  if (loading) return <main className="container p-6"><p>Cargando…</p></main>
  if (error) return <main className="container p-6"><p className="text-red-600">{error}</p></main>

  const myId = me.id || me._id
  const viewingOwn = !params.id || String(params.id) === String(myId)

  return (
    <main className="flex justify-center p-6">
      <div className="flex gap-6 max-w-4xl w-full">
        {/* Panel lateral */}
        {viewingOwn && (
          <aside className="w-48 shrink-0">
            <div className="flex flex-col gap-3 p-4 border rounded-xl border-yellow-400 bg-white shadow-sm">
              <button onClick={() => navigate('/profile/edit')} className="text-left hover:text-yellow-600">Editar perfil</button>
              <button onClick={() => navigate('/posts/manage')} className="text-left hover:text-yellow-600">Gestionar publicaciones</button>
              <button onClick={() => navigate('/trades/manage')} className="text-left hover:text-yellow-600">Gestionar trueques</button>
            </div>
          </aside>
        )}

        {/* Contenido principal */}
        <section className="flex-1">
          <div className="border border-yellow-400 rounded-xl bg-white p-6 shadow-sm space-y-6">
            {/* Cabecera con avatar y nombre */}
            <div className="flex items-center gap-16">
              <div className="w-24 h-24 rounded-full bg-gray-200" />
              <div className="flex flex-col pl-6">
                <h1 className="text-2xl font-bold text-gray-900">{me.name || me.email}</h1>
                <p className="text-gray-500">{me.email}</p>
                {/* Contadores estilo Instagram */}
                <div className="flex gap-10 mt-4 text-center">
                  <button onClick={() => navigate(`/users/${viewingOwn ? myId : params.id}/followers`)}>
                    <span className="block font-semibold">120</span>
                    <span className="text-sm text-gray-600">Seguidores</span>
                  </button>
                  <button onClick={() => navigate(`/users/${viewingOwn ? myId : params.id}/following`)}>
                    <span className="block font-semibold">85</span>
                    <span className="text-sm text-gray-600">Seguidos</span>
                  </button>
                  <div>
                    <span className="block font-semibold">34</span>
                    <span className="text-sm text-gray-600">Trueques</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
