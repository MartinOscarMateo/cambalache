import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useParams } from 'react-router-dom'
import { listTrades, updateTradeStatus } from '../lib/api.js'

export default function Chat() {
  const { otherUserId } = useParams()

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const [socket, setSocket] = useState(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [trades, setTrades] = useState([])
  const [tradesLoading, setTradesLoading] = useState(false)

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

  function idOf(user) {
    if (!user) return ''
    if (typeof user === 'string') return user
    return user._id || user.id || user.userId || ''
  }

  async function loadTradesForConversation(myUserId, otherId) {
    if (!myUserId || !otherId) return
    try {
      setTradesLoading(true)
      const [inbox, sent] = await Promise.all([
        listTrades({ role: 'inbox', page: 1, limit: 50 }),
        listTrades({ role: 'sent', page: 1, limit: 50 })
      ])
      const all = [
        ...(Array.isArray(inbox.items) ? inbox.items : []),
        ...(Array.isArray(sent.items) ? sent.items : [])
      ]
      const filtered = all.filter(t => {
        const proposer = idOf(t.proposerId)
        const receiver = idOf(t.receiverId)
        return (
          (proposer === myUserId && receiver === otherId) ||
          (proposer === otherId && receiver === myUserId)
        )
      })
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      setTrades(filtered)
    } catch (err) {
      console.error('Error cargando trueques del chat', err)
    } finally {
      setTradesLoading(false)
    }
  }

  async function handleTradeAction(tradeId, action) {
    if (!tradeId || !action) return
    try {
      const updated = await updateTradeStatus(tradeId, action)
      setTrades(prev =>
        prev.map(t => {
          const tid = t.id || t._id
          const uid = updated.id || updated._id
          return String(tid) === String(uid) ? { ...t, ...updated } : t
        })
      )
      let statusText = ''
      if (action === 'accept') statusText = 'Aceptaste un trueque.'
      else if (action === 'reject') statusText = 'Rechazaste un trueque.'
      else if (action === 'cancel') statusText = 'Cancelaste un trueque.'
      else if (action === 'finish') statusText = 'Marcaste un trueque como finalizado.'

      if (statusText) {
        const localMsg = normalizeMessage({ from: myId, text: statusText })
        setMessages(prev => [...prev, localMsg])
        socket?.emit('private_message', { to: otherUserId, text: statusText })
      }
    } catch (err) {
      console.error('Error actualizando trueque', err)
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

        await loadTradesForConversation(myId, String(otherUserId))
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
    <main className="h-[82vh] max-w-md mx-auto my-6 px-4">
      <div className="h-full flex flex-col border rounded-xl bg-white shadow-sm">
        <h2 className="text-xl font-semibold text-[#ff52b9] border-b px-4 py-2 m-0! text-center">Chat</h2>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px] bg-[#f6f2ff]">
          {tradesLoading && (
            <p className="text-xs text-gray-500 text-center mb-2">Cargando trueques...</p>
          )}

          {trades.map(t => {
            const id = t.id || t._id
            const proposerId = idOf(t.proposerId)
            const receiverId = idOf(t.receiverId)
            const isMine = proposerId === myId
            const isReceiver = receiverId === myId
            const requestedTitle = t.postRequestedId?.title || 'Publicación'
            const offeredTitle = t.postOfferedId?.title || (t.itemsText ? 'Oferta textual' : 'Sin oferta')
            const barrioRequested = t.postRequestedId?.barrio
            const barrioOffered = t.postOfferedId?.barrio
            const partnerName = isMine
              ? (t.receiverId?.name || 'Usuario')
              : (t.proposerId?.name || 'Usuario')
            const showAcceptReject = isReceiver && t.status === 'pending'
            const showCancel = isMine && t.status === 'pending'
            const showFinish = t.status === 'accepted' && (isMine || isReceiver)

            return (
              <div
                key={id}
                className="border border-yellow-300/60 bg-yellow-50 rounded-xl p-3 text-xs space-y-1"
              >
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {isMine ? 'Trueque enviado a ' : 'Trueque recibido de '}{partnerName}
                    </p>
                    <p className="text-gray-700">Por: {requestedTitle}</p>
                    <p className="text-gray-700">Oferta: {offeredTitle}</p>
                    {(barrioRequested || barrioOffered) && (
                      <p className="text-gray-600">
                        Barrios: {barrioOffered || '?'} ↔ {barrioRequested || '?'}
                      </p>
                    )}
                    {t.meetingArea && (
                      <p className="text-gray-800">
                        Zona sugerida: <span className="font-semibold">{t.meetingArea}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right text-gray-600">
                    <p>Estado: <span className="font-semibold">{t.status}</span></p>
                    <p>{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {showAcceptReject && (
                    <>
                      <button
                        onClick={() => handleTradeAction(id, 'accept')}
                        className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-500 text-white"
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => handleTradeAction(id, 'reject')}
                        className="px-2 py-1 rounded-lg text-xs font-semibold bg-red-500 text-white"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  {showCancel && (
                    <button
                      onClick={() => handleTradeAction(id, 'cancel')}
                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-gray-300 text-gray-800"
                    >
                      Cancelar
                    </button>
                  )}
                  {showFinish && (
                    <button
                      onClick={() => handleTradeAction(id, 'finish')}
                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-yellow-400 text-gray-900"
                    >
                      Marcar como realizado
                    </button>
                  )}
                </div>
              </div>
            )
          })}

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