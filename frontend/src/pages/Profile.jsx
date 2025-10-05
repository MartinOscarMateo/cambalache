import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getMe } from '../lib/api.js'

export default function Profile() {
  const params = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchUser() {
      try {
        if (!params.id) {
          const me = await getMe()
          setUser(me)
        } else {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${params.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
          if (!res.ok) throw new Error('Usuario no encontrado')
          const other = await res.json()
          setUser(other)
        }
      } catch (err) {
        setError(err.message || 'Error cargando perfil')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [params.id])

  if (loading) return <main className="container p-6"><p>Cargando…</p></main>
  if (error) return <main className="container p-6"><p className="text-red-600">{error}</p></main>
  if (!user) return null

  const myId = JSON.parse(localStorage.getItem('user') || '{}').id
  const viewingOwn = !params.id || String(params.id) === String(myId)

  return (
    <main className="flex justify-center p-6">
      <div className="flex gap-6 max-w-4xl w-full">
        {viewingOwn && (
          <aside className="w-48 shrink-0">
            <div className="flex flex-col gap-3 p-4 border rounded-xl border-yellow-400 bg-white shadow-sm">
              <button onClick={() => navigate('/profile/edit')} className="text-left hover:text-yellow-600">Editar perfil</button>
              <button onClick={() => navigate('/posts/manage')} className="text-left hover:text-yellow-600">Gestionar publicaciones</button>
              <button onClick={() => navigate('/trades/manage')} className="text-left hover:text-yellow-600">Gestionar trueques</button>
            </div>
          </aside>
        )}

        <section className="flex-1">
          <div className="border border-yellow-400 rounded-xl bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-16">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
                {user.avatar && (
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                )}
              </div>

              <div className="flex flex-col pl-6">
                <h1 className="text-2xl font-bold text-gray-900">{user.name || user.email}</h1>
                <p className="text-gray-500">{user.email}</p>

                <div className="flex gap-10 mt-4 text-center">
                  <button onClick={() => navigate(`/users/${params.id || myId}/followers`)}>
                    <span className="block font-semibold text-gray-900">{user.followersCount ?? 0}</span>
                    <span className="text-sm text-gray-600">Seguidores</span>
                  </button>

                  <button onClick={() => navigate(`/users/${params.id || myId}/following`)}>
                    <span className="block font-semibold text-gray-900">{user.followingCount ?? 0}</span>
                    <span className="text-sm text-gray-600">Seguidos</span>
                  </button>

                  <div>
                    <span className="block font-semibold text-gray-900">{user.tradesCount ?? 0}</span>
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