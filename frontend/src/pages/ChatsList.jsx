import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ChatsList() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const navigate = useNavigate()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const currentUserId = String(currentUser.id || currentUser._id || '')

  useEffect(() => {
    async function loadChats() {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_URL}/api/chats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Error al obtener los chats')
        const data = await res.json()
        setChats(data)
      } catch (err) {
        setError(err.message || 'Error cargando chats')
      } finally {
        setLoading(false)
      }
    }
    loadChats()
  }, [])

  if (loading) return <main className="p-6"><p>Cargando chats...</p></main>
  if (error) return <main className="p-6"><p className="text-red-600">{error}</p></main>

  return (
    <main className="flex justify-center p-6 bg-[#f6f2ff] min-h-screen">
      <div className="w-full max-w-2xl border border-yellow-400 rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#ff52b9] mb-4 text-center">Mis chats</h1>

        {chats.length === 0 ? (
          <p className="text-gray-500 text-center">No tienes conversaciones activas.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {chats.map(chat => {
              const other = chat.participants?.find?.(
                p => p && String(p._id) !== currentUserId
              )
              if (!other) return null

              return (
                <li
                  key={chat._id}
                  className="flex items-center justify-between py-3 cursor-pointer hover:bg-[#ffdb3e]/10 transition rounded-lg px-2"
                  onClick={() => navigate(`/chat/${other._id}`)}
                >
                  <div className="flex items-center gap-4">
                    {other.avatar ? (
                      <img
                        src={other.avatar}
                        alt={other.name || 'Usuario'}
                        className="w-12 h-12 rounded-full object-cover bg-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-500">
                        <span className="text-sm">👤</span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-[#2727d1]">{other.name || 'Usuario'}</p>
                      <p className="text-sm text-gray-600 truncate max-w-[220px]">
                        {chat.lastMessage || 'Sin mensajes'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 whitespace-nowrap">
                    {chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString() : ''}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}