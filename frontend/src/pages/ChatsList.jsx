import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ChatsList() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const navigate = useNavigate()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    <main className="flex justify-center p-6">
      <div className="w-full max-w-2xl border border-yellow-400 rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Mis chats</h1>

        {chats.length === 0 ? (
          <p className="text-gray-500">No tienes conversaciones activas.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {chats.map((chat) => {
              const other = chat.otherUser
              return (
                <li
                  key={chat._id}
                  className="flex items-center justify-between py-3 cursor-pointer hover:bg-yellow-50"
                  onClick={() => navigate(`/chat/${other._id}`)}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={other.avatar}
                      alt={other.name}
                      className="w-12 h-12 rounded-full object-cover bg-gray-200"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{other.name}</p>
                      <p className="text-sm text-gray-600 truncate max-w-[220px]">
                        {chat.lastMessage?.text || 'Sin mensajes'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {chat.lastMessage
                      ? new Date(chat.lastMessage.createdAt).toLocaleDateString()
                      : ''}
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