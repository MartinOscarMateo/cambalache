import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export default function Chat({ otherUserId }) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const [socket, setSocket] = useState(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  const token = localStorage.getItem('token')
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  // conecta el socket con el token
  useEffect(() => {
    if (!token) return
    const newSocket = io(API_URL, {
      auth: { token }
    })
    setSocket(newSocket)

    newSocket.on('connect_error', err => {
      console.error('Error al conectar socket:', err.message)
    })

    // escucha los msj en tiempo real
    newSocket.on('private_message', msg => {
      setMessages(prev => [...prev, msg])
    })

    return () => newSocket.disconnect()
  }, [token])

  // obtiene el historial de los chat
  useEffect(() => {
    async function loadChat() {
      try {
        const res = await fetch(`${API_URL}/api/chat/${otherUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const data = await res.json()
        if (Array.isArray(data)) setMessages(data)
      } catch (err) {
        console.error('Error cargando mensajes:', err)
      }
    }
    if (otherUserId) loadChat()
  }, [otherUserId, token])

  // enviar mensaje
  const sendMessage = async () => {
    if (!message.trim()) return
    const msg = { to: otherUserId, text: message }

    try {
      // emite msj por socket
      socket?.emit('private_message', msg)

      // guarda en la base
      await fetch(`${API_URL}/api/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(msg)
      })

      // muestra el msj propio al instante
      setMessages(prev => [...prev, { from: currentUser.id, to: otherUserId, text: message }])
      setMessage('')
    } catch (err) {
      console.error('Error enviando mensaje:', err)
    }
  }

  return (
    <main className="max-w-md mx-auto mt-6">
      <div className="flex flex-col border rounded-xl bg-white shadow-sm">
        <h2 className="text-xl font-semibold border-b px-4 py-2">Chat</h2>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[400px]">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-3 py-2 rounded-xl ${
                  msg.from === currentUser.id
                    ? 'bg-yellow-300 text-gray-900'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 border-t p-3">
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Escribe un mensaje"
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-yellow-400 rounded-lg font-semibold hover:bg-yellow-500"
          >
            Enviar
          </button>
        </div>
      </div>
    </main>
  )
}