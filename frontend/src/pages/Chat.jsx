import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useParams, useNavigate } from 'react-router-dom'
import { listTrades, updateTradeStatus, getMeetingPlaces, suggestTradeMeeting, acceptTradeMeeting, rejectTradeMeeting, cancelTradeMeeting } from '../lib/api.js'

export default function Chat() {
  const { otherUserId } = useParams()
  const navigate = useNavigate()

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const [socket, setSocket] = useState(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [trades, setTrades] = useState([])
  const [tradesLoading, setTradesLoading] = useState(false)
  const [meetingProcessingId, setMeetingProcessingId] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [meetingSelectorTrade, setMeetingSelectorTrade] = useState(null)
  const [meetingOptions, setMeetingOptions] = useState([])
  const [meetingOptionsLoading, setMeetingOptionsLoading] = useState(false)

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

  function normalizePlace(p, fallbackBarrio = '') {
    if (!p) return null
    const id = p._id || p.id
    if (!id) return null
    const name = p.name || p.nombre || 'Espacio publico'
    const barrio = p.barrio || fallbackBarrio || ''
    const address = p.address || p.direccion || ''
    return { id: String(id), name, barrio, address }
  }

  function isTerminalStatus(status) {
    return ['rejected', 'cancelled', 'finished'].includes(status)
  }

  function findActiveTrade() {
    if (!Array.isArray(trades) || !trades.length) return null
    const candidates = trades.filter(t => !isTerminalStatus(t.status))
    if (!candidates.length) return null
    return candidates.reduce((latest, current) => {
      const a = new Date(latest.createdAt || 0).getTime()
      const b = new Date(current.createdAt || 0).getTime()
      return b > a ? current : latest
    }, candidates[0])
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
          (proposer === myId && receiver === otherId) ||
          (proposer === otherId && receiver === myId)
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

  async function openMeetingSelector(trade) {
    if (!trade) return
    const tradeId = trade.id || trade._id
    if (!tradeId) return

    setMeetingSelectorTrade(trade)
    setMeetingOptions([])
    setMeetingOptionsLoading(true)

    try {
      const barriosSet = new Set()
      const brReq = trade.postRequestedId?.barrio
      const brOff = trade.postOfferedId?.barrio

      if (brReq) barriosSet.add(brReq)
      if (brOff) barriosSet.add(brOff)

      if (!barriosSet.size && trade.meetingArea) {
        String(trade.meetingArea)
          .split('↔')
          .map(s => s.trim())
          .filter(Boolean)
          .forEach(b => barriosSet.add(b))
      }

      const barrios = Array.from(barriosSet)
      if (!barrios.length) {
        setMeetingSelectorTrade(null)
        window.alert('No se encontraron zonas para sugerir lugares publicos.')
        return
      }

      const collected = []
      for (const barrio of barrios) {
        try {
          const places = await getMeetingPlaces(barrio)
          const arr = Array.isArray(places) ? places : []
          for (const p of arr) {
            const opt = normalizePlace(p, barrio)
            if (opt) collected.push(opt)
          }
        } catch (e) {
          console.error('Error obteniendo lugares sugeridos', barrio, e)
        }
      }

      const unique = []
      const seen = new Set()
      for (const opt of collected) {
        if (seen.has(opt.id)) continue
        seen.add(opt.id)
        unique.push(opt)
      }

      if (!unique.length) {
        setMeetingSelectorTrade(null)
        window.alert('No se encontraron espacios publicos sugeridos para estas zonas.')
        return
      }

      setMeetingOptions(unique.slice(0, 12))
    } finally {
      setMeetingOptionsLoading(false)
    }
  }

  async function handleSuggestMeeting(trade, place) {
    const tradeId = trade?.id || trade?._id
    if (!tradeId || !place) return
    try {
      setMeetingProcessingId(String(tradeId))

      const payload = {
        meetingPlaceId: place.id,
        placeName: place.name,
        placeAddress: place.address || undefined,
        barrio: place.barrio || undefined
      }

      const updated = await suggestTradeMeeting(tradeId, payload)
      setTrades(prev =>
        prev.map(t => {
          const tid = t.id || t._id
          const uid = updated.id || updated._id
          return String(tid) === String(uid) ? { ...t, ...updated } : t
        })
      )

      const text = place.name
        ? `Propusiste encontrarse en ${place.name}.`
        : 'Propusiste un punto de encuentro.'
      const localMsg = normalizeMessage({ from: myId, text })
      setMessages(prev => [...prev, localMsg])
      socket?.emit('private_message', { to: otherUserId, text })

      setMeetingSelectorTrade(null)
      setMeetingOptions([])
    } catch (err) {
      console.error('Error proponiendo punto de encuentro', err)
    } finally {
      setMeetingProcessingId('')
    }
  }

  async function handleOpenMeetingFromMenu() {
    setMenuOpen(false)
    const activeTrade = findActiveTrade()
    if (!activeTrade) {
      window.alert('No hay trueques activos en este chat para proponer un punto de encuentro.')
      return
    }
    await openMeetingSelector(activeTrade)
  }

  async function handleAcceptMeeting(tradeId) {
    if (!tradeId) return
    try {
      setMeetingProcessingId(String(tradeId))
      const updated = await acceptTradeMeeting(tradeId)
      setTrades(prev =>
        prev.map(t => {
          const tid = t.id || t._id
          const uid = updated.id || updated._id
          return String(tid) === String(uid) ? { ...t, ...updated } : t
        })
      )
      const text = 'Aceptaste el punto de encuentro.'
      const localMsg = normalizeMessage({ from: myId, text })
      setMessages(prev => [...prev, localMsg])
      socket?.emit('private_message', { to: otherUserId, text })
    } catch (err) {
      console.error('Error aceptando punto de encuentro', err)
    } finally {
      setMeetingProcessingId('')
    }
  }

  async function handleRejectMeeting(tradeId) {
    if (!tradeId) return
    const noteRaw =
      window.prompt('Podes explicar brevemente por que no te sirve este lugar (opcional):') || ''
    const note = noteRaw.trim()
    try {
      setMeetingProcessingId(String(tradeId))
      const payload = note ? { note } : {}
      const updated = await rejectTradeMeeting(tradeId, payload)
      setTrades(prev =>
        prev.map(t => {
          const tid = t.id || t._id
          const uid = updated.id || updated._id
          return String(tid) === String(uid) ? { ...t, ...updated } : t
        })
      )
      const text = 'Rechazaste el punto de encuentro propuesto.'
      const localMsg = normalizeMessage({ from: myId, text })
      setMessages(prev => [...prev, localMsg])
      socket?.emit('private_message', { to: otherUserId, text })
    } catch (err) {
      console.error('Error rechazando punto de encuentro', err)
    } finally {
      setMeetingProcessingId('')
    }
  }

  async function handleCancelMeeting(tradeId) {
    if (!tradeId) return
    const confirmCancel = window.confirm(
      'Seguro que queres cancelar el punto de encuentro acordado?'
    )
    if (!confirmCancel) return
    const noteRaw =
      window.prompt('Si queres, aclara brevemente el motivo de la cancelacion (opcional):') || ''
    const note = noteRaw.trim()
    try {
      setMeetingProcessingId(String(tradeId))
      const payload = note ? { note } : {}
      const updated = await cancelTradeMeeting(tradeId, payload)
      setTrades(prev =>
        prev.map(t => {
          const tid = t.id || t._id
          const uid = updated.id || updated._id
          return String(tid) === String(uid) ? { ...t, ...updated } : t
        })
      )
      const text = 'Cancelaste el punto de encuentro.'
      const localMsg = normalizeMessage({ from: myId, text })
      setMessages(prev => [...prev, localMsg])
      socket?.emit('private_message', { to: otherUserId, text })
    } catch (err) {
      console.error('Error cancelando punto de encuentro', err)
    } finally {
      setMeetingProcessingId('')
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

      const localMsg = normalizeMessage({
        from: myId,
        senderName: 'Tú',
        to: otherUserId,
        text: message
      })
      setMessages(prev => [...prev, localMsg])
      setMessage('')
    } catch (err) {
      console.error('Error enviando mensaje:', err)
    }
  }

  function formatTime(value) {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <main className="h-[82vh] max-w-md mx-auto my-6 px-4">
      <div className="h-full flex flex-col border rounded-xl bg-white shadow-sm">
        <div className="border-b px-4 py-2 relative flex items-center justify-center">
          <h2 className="text-xl font-semibold text-[#ff52b9] m-0">Chat</h2>
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={() => setMenuOpen(prev => !prev)}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-[#ff52b9]/40 text-[#ff52b9] text-lg leading-none hover:bg-[#ff52b9]/10"
            >
              ☰
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-56 rounded-lg border bg-white shadow-lg text-xs z-10">
                <button
                  type="button"
                  onClick={handleOpenMeetingFromMenu}
                  className="w-full text-left px-3 py-2 hover:bg-[#f6f2ff]"
                >
                  Proponer punto de encuentro
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px] bg-[#f6f2ff]">
          {tradesLoading && (
            <p className="text-xs text-gray-500 text-center mb-2">Cargando trueques...</p>
          )}

          {meetingSelectorTrade && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs">
              <p className="font-semibold text-gray-800 mb-1">
                Elegi un punto de encuentro entre las zonas de ambos
              </p>
              {meetingOptionsLoading && (
                <p className="text-[11px] text-gray-600">
                  Buscando espacios publicos cercanos...
                </p>
              )}
              {!meetingOptionsLoading && (
                <>
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                    {meetingOptions.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSuggestMeeting(meetingSelectorTrade, opt)}
                        className="text-left px-2 py-1 rounded-md border border-amber-200 bg-white hover:bg-amber-100 text-[11px]"
                      >
                        <span className="font-semibold">{opt.name}</span>
                        {opt.barrio && (
                          <span className="ml-1 text-gray-500"> · {opt.barrio}</span>
                        )}
                        {opt.address && (
                          <div className="text-[10px] text-gray-500">{opt.address}</div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMeetingSelectorTrade(null)
                        setMeetingOptions([])
                      }}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-gray-200 text-gray-800"
                    >
                      Cerrar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* burbujas de trueque */}
          {trades.map(t => {
            const id = t.id || t._id
            const proposerId = idOf(t.proposerId)
            const receiverId = idOf(t.receiverId)
            const isMine = proposerId === myId
            const isReceiver = receiverId === myId
            const requestedTitle = t.postRequestedId?.title || 'Publicación'
            const offeredTitle =
              t.postOfferedId?.title || (t.itemsText ? 'Oferta textual' : 'Sin oferta')
            const barrioRequested = t.postRequestedId?.barrio
            const barrioOffered = t.postOfferedId?.barrio
            const partnerName = isMine
              ? (t.receiverId?.name || 'Usuario')
              : (t.proposerId?.name || 'Usuario')
            const showAcceptReject = isReceiver && t.status === 'pending'
            const showCancel = isMine && t.status === 'pending'
            const showFinish = t.status === 'accepted' && (isMine || isReceiver)

            const requestedId =
              t.postRequestedId?._id || t.postRequestedId?.id || t.postRequestedId
            const offeredId =
              t.postOfferedId?._id || t.postOfferedId?.id || t.postOfferedId
            const requestedImage = Array.isArray(t.postRequestedId?.images)
              ? t.postRequestedId.images[0]
              : null
            const offeredImage = Array.isArray(t.postOfferedId?.images)
              ? t.postOfferedId.images[0]
              : null

            const time = formatTime(t.createdAt)

            return (
              <div
                key={id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <p className="text-xs text-gray-500 mb-1">
                  {isMine ? 'Tú' : partnerName}
                </p>
                <div
                  className={`px-3 py-2 rounded-2xl shadow-sm max-w-[80%] break-words ${
                    isMine
                      ? 'bg-yellow-300 text-gray-900 rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="font-semibold text-xs mb-1">
                    {isMine ? 'Propusiste un trueque' : 'Te propusieron un trueque'}
                  </p>
                  <p className="text-xs">
                    Publicacion:{' '}
                    {requestedId ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/posts/${requestedId}`)}
                        className="underline text-blue-700 hover:text-blue-900"
                      >
                        {requestedTitle}
                      </button>
                    ) : (
                      requestedTitle
                    )}
                  </p>
                  <p className="text-xs">
                    Oferta:{' '}
                    {offeredId ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/posts/${offeredId}`)}
                        className="underline text-blue-700 hover:text-blue-900"
                      >
                        {offeredTitle}
                      </button>
                    ) : (
                      offeredTitle
                    )}
                  </p>
                  {(requestedImage || offeredImage) && (
                    <div className="mt-1 flex gap-2">
                      {requestedImage && (
                        <button
                          type="button"
                          onClick={() => requestedId && navigate(`/posts/${requestedId}`)}
                          className="relative w-16 h-16 rounded-lg overflow-hidden border border-yellow-200 bg-white"
                        >
                          <img
                            src={requestedImage}
                            alt={requestedTitle}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 left-0 right-0 text-[10px] leading-[1.2] text-center bg-black/50 text-white">
                            Ver pedido
                          </span>
                        </button>
                      )}
                      {offeredImage && (
                        <button
                          type="button"
                          onClick={() => offeredId && navigate(`/posts/${offeredId}`)}
                          className="relative w-16 h-16 rounded-lg overflow-hidden border border-yellow-200 bg-white"
                        >
                          <img
                            src={offeredImage}
                            alt={offeredTitle}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 left-0 right-0 text-[10px] leading-[1.2] text-center bg-black/50 text-white">
                            Ver oferta
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                  {(barrioRequested || barrioOffered) && (
                    <p className="text-[11px] text-gray-700 mt-1">
                      Barrios: {barrioOffered || '?'} ↔ {barrioRequested || '?'}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-2">
                    {showAcceptReject && (
                      <>
                        <button
                          onClick={() => handleTradeAction(id, 'accept')}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500 text-white"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => handleTradeAction(id, 'reject')}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-red-500 text-white"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    {showCancel && (
                      <button
                        onClick={() => handleTradeAction(id, 'cancel')}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-gray-300 text-gray-800"
                      >
                        Cancelar
                      </button>
                    )}
                    {showFinish && (
                      <button
                        onClick={() => handleTradeAction(id, 'finish')}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-yellow-400 text-gray-900"
                      >
                        Marcar como realizado
                      </button>
                    )}
                  </div>

                  <p className="mt-1 text-[10px] text-gray-700 text-right">
                    {time}
                  </p>
                </div>
              </div>
            )
          })}

          {/* burbujas de punto de encuentro */}
          {trades.map(t => {
            const id = t.id || t._id
            const meeting = t.meeting || {}
            const status = meeting.status || 'none'
            if (isTerminalStatus(t.status) || status === 'none') return null

            const acceptedBy = Array.isArray(meeting.acceptedBy)
              ? meeting.acceptedBy.map(idOf)
              : []
            const iAccepted = acceptedBy.includes(myId)
            const isMeetingProposed = status === 'proposed'
            const isMeetingConfirmed = status === 'confirmed'
            const isMeetingBusy =
              meetingProcessingId && String(meetingProcessingId) === String(id)

            const baseTime =
              meeting.suggestedAt || meeting.confirmedAt || t.updatedAt || t.createdAt
            const time = formatTime(baseTime)

            return (
              <div key={`meeting-${id}`} className="flex flex-col items-center">
                <div className="max-w-[80%] px-3 py-2 rounded-2xl bg-white border border-yellow-300 text-xs shadow-sm">
                  <p className="font-semibold text-gray-800 mb-1">
                    Punto de encuentro {isMeetingConfirmed ? 'confirmado' : 'propuesto'}
                  </p>
                  {meeting.placeName && (
                    <p className="text-gray-800">{meeting.placeName}</p>
                  )}
                  {meeting.placeAddress && (
                    <p className="text-[11px] text-gray-600">{meeting.placeAddress}</p>
                  )}
                  {meeting.barrio && (
                    <p className="text-[11px] text-gray-500">Barrio: {meeting.barrio}</p>
                  )}
                  {isMeetingProposed && (
                    <>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {iAccepted
                          ? 'Ya aceptaste, esperando a la otra persona.'
                          : 'Si estan de acuerdo, ambos deben aceptar para confirmarlo.'}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1 justify-end">
                        {!iAccepted && (
                          <>
                            <button
                              onClick={() => handleAcceptMeeting(id)}
                              disabled={!!isMeetingBusy}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500 text-white disabled:opacity-60"
                            >
                              Aceptar lugar
                            </button>
                            <button
                              onClick={() => handleRejectMeeting(id)}
                              disabled={!!isMeetingBusy}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-red-500 text-white disabled:opacity-60"
                            >
                              Rechazar lugar
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openMeetingSelector(t)}
                          disabled={!!isMeetingBusy}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-200 text-gray-800 disabled:opacity-60"
                        >
                          Proponer otro lugar
                        </button>
                      </div>
                    </>
                  )}
                  {isMeetingConfirmed && (
                    <>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Punto acordado para este trueque. Si surge algo podes cancelarlo y
                        proponer otro.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1 justify-end">
                        <button
                          onClick={() => handleCancelMeeting(id)}
                          disabled={!!isMeetingBusy}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-gray-300 text-gray-800 disabled:opacity-60"
                        >
                          Cancelar punto
                        </button>
                        <button
                          onClick={() => openMeetingSelector(t)}
                          disabled={!!isMeetingBusy}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-200 text-gray-800 disabled:opacity-60"
                        >
                          Cambiar lugar
                        </button>
                      </div>
                    </>
                  )}
                  <p className="mt-1 text-[10px] text-gray-500 text-right">
                    {time}
                  </p>
                </div>
              </div>
            )
          })}

          {/* mensajes normales */}
          {messages.map((msg, i) => {
            const isMine = msg.from === myId
            const time = formatTime(msg.createdAt)
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
                  <p className="mt-1 text-[10px] text-gray-700 text-right">
                    {time}
                  </p>
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