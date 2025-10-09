import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useParams } from 'react-router-dom'

export default function Chat() {
  const { otherUserId } = useParams()

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const [socket, setSocket] = useState(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  const token = localStorage.getItem('token')
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const myId = String(currentUser._id || currentUser.id || '')

  function normalizeMessage(m) {
    const rawFrom = m.from ?? m.senderId ?? m.sender?._id ?? m.sender ?? m.authorId
    const from = String(rawFrom || '')
    const name = m.senderName ?? m.sender?.name ?? 'Usuario'
    return {
      from,
      senderName: from === myId ? 'Tú' : name,
      text: m.text ?? '',
      createdAt: m.createdAt ?? new Date().toISOString()
    }
  }

  useEffect(() => {
    if (!token) return
    const newSocket = io(API_URL, { auth: { token } })
    setSocket(newSocket)

    newSocket.on('connect_error', err => {
      console.error('Error al conectar socket:', err.message)
    })

    newSocket.on('private_message', msg => {
      setMessages(prev => [...prev, normalizeMessage(msg)])
    })

    return () => newSocket.disconnect()
  }, [token])

  useEffect(() => {
    async function loadChat() {
      if (!otherUserId) {
        console.error('No se detecto otherUserId, no se puede cargar el chat')
        return
      }
      try {
        const res = await fetch(`${API_URL}/api/chats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ userId: otherUserId })
        })
        if (!res.ok) throw new Error(`Error creando chat: ${res.status}`)
        const chat = await res.json()

        const messagesRes = await fetch(`${API_URL}/api/chats/${chat._id}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!messagesRes.ok) throw new Error(`Error obteniendo mensajes: ${messagesRes.status}`)
        const messagesData = await messagesRes.json()

        const normalized = messagesData.map(m => normalizeMessage(m))
        setMessages(normalized)
      } catch (err) {
        console.error('Error cargando mensajes:', err)
      }
    }

    if (otherUserId) loadChat()
  }, [otherUserId, token])

  const sendMessage = async () => {
    if (!message.trim() || !otherUserId) return
    try {
      const chatRes = await fetch(`${API_URL}/api/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId: otherUserId })
      })
      if (!chatRes.ok) throw new Error('Error creando chat')
      const chat = await chatRes.json()

      await fetch(`${API_URL}/api/chats/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ chatId: chat._id, text: message })
      })

      socket?.emit('private_message', { to: otherUserId, text: message })

      const localMsg = normalizeMessage({ from: myId, senderName: 'Tú', to: otherUserId, text: message })
      setMessages(prev => [...prev, localMsg])
      setMessage('')
    } catch (err) {
      console.error('Error enviando mensaje:', err)
    }
  }

  return (
    <main className="max-w-md mx-auto mt-6">
      <div className="flex flex-col border rounded-xl bg-white shadow-sm">
        <h2 className="text-xl font-semibold text-[#ff52b9] border-b px-4 py-2 text-center">Chat</h2>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px] bg-[#f6f2ff] rounded-b-xl">
          {messages.map((msg, i) => {
            const isMine = msg.from === myId
            return (
              <div
                key={i}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <p className="text-xs text-gray-500 mb-1">
                  {isMine ? 'Tú' : msg.senderName}
                </p>
                <div
                  className={`px-4 py-2 rounded-2xl shadow-sm max-w-[75%] break-words ${
                    isMine
                      ? 'bg-yellow-300 text-gray-900 rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-2 border-t p-3 bg-white rounded-b-xl">
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Escribe un mensaje"
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-yellow-400 rounded-lg font-semibold hover:bg-yellow-500 transition"
          >
            Enviar
          </button>
        </div>
      </div>
    </main>
  )
}