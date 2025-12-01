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
  const [finishConfirmTrade, setFinishConfirmTrade] = useState(null)

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
      const newStatus = updated?.status

      if (action === 'accept') statusText = 'Aceptaste un trueque.'
      else if (action === 'reject') statusText = 'Rechazaste un trueque.'
      else if (action === 'cancel') statusText = 'Cancelaste un trueque.'
      else if (action === 'finish') {
        if (newStatus === 'finished') {
          statusText = 'El trueque se completó. Ambas partes lo marcaron como realizado.'
        } else {
          statusText = 'Marcaste un trueque como realizado. Cuando la otra persona también lo marque, quedará completo.'
        }
      }

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

  function handleOpenFinishFromMenu() {
    setMenuOpen(false)
    const activeTrade = findActiveTrade()
    if (!activeTrade) {
      window.alert('No hay trueques activos en este chat para marcar como realizados.')
      return
    }
    setFinishConfirmTrade(activeTrade)
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

  async function handleConfirmFinishTrade() {
    if (!finishConfirmTrade) return
    const tradeId = finishConfirmTrade.id || finishConfirmTrade._id
    if (!tradeId) {
      setFinishConfirmTrade(null)
      return
    }
    try {
      await handleTradeAction(tradeId, 'finish')
    } finally {
      setFinishConfirmTrade(null)
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
      console.error('Error enviando mensaje', err)
    }
  }

  function formatTime(value) {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const finishRequestedTitle = finishConfirmTrade?.postRequestedId?.title || 'Publicacion'
  const finishOfferedTitle =
    finishConfirmTrade?.postOfferedId?.title ||
    (finishConfirmTrade?.itemsText ? 'Oferta textual' : 'Sin oferta')

  return (
    <main
      className="min-h-[85vh] px-4 py-8"
      style={{ background: 'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)' }}
    >
      <section className="max-w-6xl mx-auto">
        <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-4 sm:p-6 lg:p-8 shadow-[0_24px_80px_rgba(0,0,0,.55)] border border-[color:var(--c-mid-blue)]/60">
          <header className="mb-4 sm:mb-6 flex items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--c-info)]/90">
                Conversacion de trueque
              </p>
              <h1
                className="mt-1 text-2xl sm:text-3xl font-bold"
                style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
              >
                Chat
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--c-text)' }}>
                Coordiná el intercambio, acordá el punto de encuentro y dejá todo por escrito.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg.white border border-[color:var(--c-mid-blue)]/40 px-3 py-1 text-[11px] text-[color:var(--c-text)]">
                <span className="h-2 w-2 rounded-full bg-[color:var(--c-info)]" />
                Chat activo
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen(prev => !prev)}
                  className="inline-flex items-center justify-center rounded-full border border-[color:var(--c-mid-blue)]/60 bg-white px-3 py-2 text-xs font-semibold text-[color:var(--c-text)] shadow-[0_10px_30px_rgba(0,0,0,.14)] hover:bg-[color:var(--c-mid-blue)]/5"
                >
                  Opciones
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[color:var(--c-mid-blue)]/40 bg.white shadow-[0_18px_50px_rgba(0,0,0,.35)] text-xs z-10">
                    <button
                      type="button"
                      onClick={handleOpenMeetingFromMenu}
                      className="w-full text-left px-4 py-3 hover:bg-[color:var(--c-mid-blue)]/5 text-[color:var(--c-text)]"
                    >
                      Proponer punto de encuentro
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenFinishFromMenu}
                      className="w-full text-left px-4 py-3 hover:bg-[color:var(--c-mid-blue)]/5 text-[color:var(--c-text)] border-t border-[color:var(--c-mid-blue)]/15"
                    >
                      Marcar trueque como realizado
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="rounded-2xl border border-[color:var(--c-mid-blue)]/30 bg-[color:var(--c-bg-soft,#f6f2ff)] flex flex-col max-h-[65vh]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {tradesLoading && (
                <p className="text-[11px] text-[color:var(--c-text)]/70 text-center mb-2">
                  Cargando trueques...
                </p>
              )}

              {meetingSelectorTrade && (
                <div className="rounded-2xl border border-[color:var(--c-accent)]/60 bg-[color:var(--c-accent)]/10 px-3 py-3 text-xs">
                  <p className="font-semibold mb-1" style={{ color: 'var(--c-text)' }}>
                    Elegi un punto de encuentro entre las zonas de ambos
                  </p>
                  {meetingOptionsLoading && (
                    <p className="text-[11px] text-[color:var(--c-text)]/70">
                      Buscando espacios publicos cercanos...
                    </p>
                  )}
                  {!meetingOptionsLoading && (
                    <>
                      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto mt-1">
                        {meetingOptions.map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSuggestMeeting(meetingSelectorTrade, opt)}
                            className="text-left px-3 py-2 rounded-xl border border-[color:var(--c-mid-blue)]/30 bg-white/95 hover:bg-[color:var(--c-mid-blue)]/5 text-[11px]"
                          >
                            <span className="font-semibold" style={{ color: 'var(--c-text)' }}>
                              {opt.name}
                            </span>
                            {opt.barrio && (
                              <span className="ml-1 text-[color:var(--c-text)]/70"> · {opt.barrio}</span>
                            )}
                            {opt.address && (
                              <div className="text-[10px] text-[color:var(--c-text)]/70">
                                {opt.address}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-end mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setMeetingSelectorTrade(null)
                            setMeetingOptions([])
                          }}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-white border border-[color:var(--c-mid-blue)]/30 text-[color:var(--c-text)] hover:bg-[color:var(--c-mid-blue)]/5"
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
                const nameLabel = isMine ? 'Tú' : partnerName || 'Usuario'
                const statusLabel =
                  t.status === 'pending'
                    ? 'Pendiente de respuesta'
                    : t.status === 'accepted'
                    ? 'Trueque aceptado'
                    : t.status === 'finished'
                    ? 'Trueque realizado'
                    : t.status === 'rejected'
                    ? 'Trueque rechazado'
                    : 'Actualizado'
                const statusBadgeClass =
                  t.status === 'pending'
                    ? 'bg-[color:var(--c-info)]/10 text-[color:var(--c-info)]'
                    : t.status === 'accepted'
                    ? 'bg-[color:var(--c-mid-cyan)]/15 text-[color:var(--c-mid-cyan)]'
                    : t.status === 'finished'
                    ? 'bg-[color:var(--c-accent)]/25 text-[color:var(--c-text)]'
                    : 'bg-slate-200/80 text-slate-700'

                return (
                  <div
                    key={id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex max-w-[90%] gap-3 ${
                        isMine ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className="mt-1 h-7 w-7 rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,.18)] border border-[color:var(--c-mid-blue)]/30 flex items-center justify-center text-[10px] font-semibold text-[color:var(--c-text)]/80">
                        {(nameLabel || 'U').trim()[0] || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between mb-1">
                          <div>
                            <p className="text-[11px] text-[color:var(--c-text)]/70">
                              {nameLabel}
                            </p>
                            <p className="text-[10px] text-[color:var(--c-text)]/60">
                              {isMine ? 'Propusiste un trueque' : 'Te propusieron un trueque'}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadgeClass}`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        <div
                          className={`rounded-2xl shadow-[0_14px_35px_rgba(0,0,0,.14)] border border-[color:var(--c-mid-blue)]/20 bg-white/95 px-3 py-2 ${
                            isMine ? 'rounded-br-none' : 'rounded-bl-none'
                          }`}
                        >
                          <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="rounded-xl bg-[color:var(--c-mid-blue)]/5 border border-[color:var(--c-mid-blue)]/25 px-2.5 py-2 flex gap-2">
                              {requestedImage && (
                                <button
                                  type="button"
                                  onClick={() => requestedId && navigate(`/posts/${requestedId}`)}
                                  className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-[color:var(--c-mid-blue)]/40 bg-white"
                                >
                                  <img
                                    src={requestedImage}
                                    alt={requestedTitle}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              )}
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-[0.12em] text-[color:var(--c-info)] mb-0.5">
                                  Publicacion
                                </p>
                                <p className="text-[11px] font-semibold truncate">
                                  {requestedId ? (
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/posts/${requestedId}`)}
                                      className="underline text-[color:var(--c-brand)] hover:text-[color:var(--c-mid-pink)]"
                                    >
                                      {requestedTitle}
                                    </button>
                                  ) : (
                                    requestedTitle
                                  )}
                                </p>
                                {barrioRequested && (
                                  <p className="text-[10px] text-[color:var(--c-text)]/70">
                                    Barrio: {barrioRequested}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="rounded-xl bg-[color:var(--c-accent)]/15 border border-[color:var(--c-accent)]/40 px-2.5 py-2 flex gap-2">
                              {offeredImage && (
                                <button
                                  type="button"
                                  onClick={() => offeredId && navigate(`/posts/${offeredId}`)}
                                  className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-[color:var(--c-accent)]/60 bg-white"
                                >
                                  <img
                                    src={offeredImage}
                                    alt={offeredTitle}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              )}
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-[0.12em] text-[color:var(--c-info)] mb-0.5">
                                  Tu oferta
                                </p>
                                <p className="text-[11px] font-semibold truncate">
                                  {offeredId ? (
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/posts/${offeredId}`)}
                                      className="underline text-[color:var(--c-brand)] hover:text-[color:var(--c-mid-pink)]"
                                    >
                                      {offeredTitle}
                                    </button>
                                  ) : (
                                    offeredTitle
                                  )}
                                </p>
                                {barrioOffered && (
                                  <p className="text-[10px] text-[color:var(--c-text)]/70">
                                    Barrio: {barrioOffered}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {(barrioRequested || barrioOffered) && (
                            <p className="text-[10px] text-[color:var(--c-text)]/70 mt-2">
                              Zonas del trueque: {barrioOffered || '?'} ↔ {barrioRequested || '?'}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 mt-3 justify-end">
                            {showAcceptReject && (
                              <>
                                <button
                                  onClick={() => handleTradeAction(id, 'accept')}
                                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[color:var(--c-mid-cyan)] text-white hover:bg-[color:var(--c-mid-cyan)]/90"
                                >
                                  Aceptar
                                </button>
                                <button
                                  onClick={() => handleTradeAction(id, 'reject')}
                                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-red-500 text-white hover:bg-red-600"
                                >
                                  Rechazar
                                </button>
                              </>
                            )}
                            {showCancel && (
                              <button
                                onClick={() => handleTradeAction(id, 'cancel')}
                                className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white border border-[color:var(--c-mid-blue)]/40 text-[color:var(--c-text)] hover:bg-[color:var(--c-mid-blue)]/5"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>

                          <p className="mt-2 text-[10px] text-[color:var(--c-text)]/60 text-right">
                            {time}
                          </p>
                        </div>
                      </div>
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
                  <div key={`meeting-${id}`} className="flex justify-center">
                    <div className="max-w-[80%] px-3 py-2 rounded-2xl bg-white/90 border border-[color:var(--c-mid-blue)]/40 text-xs shadow-[0_14px_35px_rgba(0,0,0,.14)]">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <p className="font-semibold text-[color:var(--c-text)]">
                          Punto de encuentro {isMeetingConfirmed ? 'confirmado' : 'propuesto'}
                        </p>
                        <span className="text-[10px] text-[color:var(--c-text)]/60">
                          {time}
                        </span>
                      </div>
                      {meeting.placeName && (
                        <p className="text-[color:var(--c-text)]">{meeting.placeName}</p>
                      )}
                      {meeting.placeAddress && (
                        <p className="text-[11px] text-[color:var(--c-text)]/70">
                          {meeting.placeAddress}
                        </p>
                      )}
                      {meeting.barrio && (
                        <p className="text-[11px] text-[color:var(--c-text)]/70">
                          Barrio: {meeting.barrio}
                        </p>
                      )}
                      {isMeetingProposed && (
                        <>
                          <p className="text-[11px] text-[color:var(--c-text)]/70 mt-1">
                            {iAccepted
                              ? 'Ya aceptaste, esperando a la otra persona.'
                              : 'Si estan de acuerdo, ambos deben aceptar para confirmarlo.'}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2 justify-end">
                            {!iAccepted && (
                              <>
                                <button
                                  onClick={() => handleAcceptMeeting(id)}
                                  disabled={!!isMeetingBusy}
                                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[color:var(--c-mid-cyan)] text-white disabled:opacity-60 hover:bg-[color:var(--c-mid-cyan)]/90"
                                >
                                  Aceptar lugar
                                </button>
                                <button
                                  onClick={() => handleRejectMeeting(id)}
                                  disabled={!!isMeetingBusy}
                                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-red-500 text.white disabled:opacity-60 hover:bg-red-600"
                                >
                                  Rechazar lugar
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => openMeetingSelector(t)}
                              disabled={!!isMeetingBusy}
                              className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg.white border border-[color:var(--c-mid-blue)]/40 text-[color:var(--c-text)] disabled:opacity-60 hover:bg-[color:var(--c-mid-blue)]/5"
                            >
                              Proponer otro lugar
                            </button>
                          </div>
                        </>
                      )}
                      {isMeetingConfirmed && (
                        <>
                          <p className="text-[11px] text-[color:var(--c-text)]/70 mt-1">
                            Punto acordado para este trueque. Si surge algo podes cancelarlo y
                            proponer otro.
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2 justify-end">
                            <button
                              onClick={() => handleCancelMeeting(id)}
                              disabled={!!isMeetingBusy}
                              className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg.white border border-[color:var(--c-mid-blue)]/40 text-[color:var(--c-text)] disabled:opacity-60 hover:bg-[color:var(--c-mid-blue)]/5"
                            >
                              Cancelar punto
                            </button>
                            <button
                              onClick={() => openMeetingSelector(t)}
                              disabled={!!isMeetingBusy}
                              className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[color:var(--c-mid-blue)]/5 text-[color:var(--c-text)] disabled:opacity-60 hover:bg-[color:var(--c-mid-blue)]/10"
                            >
                              Cambiar lugar
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* mensajes normales */}
              {messages.map((msg, i) => {
                const isMine = msg.from === myId
                const time = formatTime(msg.createdAt)
                const nameLabel = isMine ? 'Tú' : msg.senderName || 'Usuario'

                return (
                  <div
                    key={i}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex max-w-[75%] gap-3 ${
                        isMine ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className="mt-1 h-7 w-7 rounded-full bg.white shadow-[0_8px_20px_rgba(0,0,0,.18)] border border-[color:var(--c-mid-blue)]/30 flex items-center justify-center text-[10px] font-semibold text-[color:var(--c-text)]/80">
                        {(nameLabel || 'U').trim()[0] || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between mb-1">
                          <p className="text-[11px] text-[color:var(--c-text)]/70">
                            {nameLabel}
                          </p>
                          <p className="text-[10px] text-[color:var(--c-text)]/60">
                            {time}
                          </p>
                        </div>
                        <div
                          className={`px-4 py-2 rounded-2xl shadow-[0_14px_35px_rgba(0,0,0,.14)] border border-[color:var(--c-mid-blue)]/15 max-w-full break-words ${
                            isMine
                              ? 'bg-[color:var(--c-brand)] text.white rounded-br-none'
                              : 'bg.white text-[color:var(--c-text)] rounded-bl-none'
                          }`}
                        >
                          <p className="text-[13px] leading-snug">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2 border-t border-[color:var(--c-mid-blue)]/30 bg.white/90 px-3 py-3 items-center">
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Escribi un mensaje"
                className="flex-1 rounded-xl border border-slate-200 bg.white px-4 py-2.5 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)] focus:border-[color:var(--c-info)] text-sm text-[color:var(--c-text)] placeholder:text-slate-400"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2.5 rounded-xl bg-[color:var(--c-brand)] text.white text-sm font-semibold shadow-[0_14px_35px_rgba(0,0,0,.18)] hover:bg-[color:var(--c-mid-pink)] transition focus:outline-none focus:ring-2 focus:ring-[color:var(--c-info)] focus:ring-offset-1 focus:ring-offset-white"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>

        {finishConfirmTrade && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="w-[92%] max-w-sm rounded-2xl bg-white p-6 border border-[color:var(--c-mid-blue)]/60 shadow-[0_20px_60px_rgba(0,0,0,.25)]">
              <h2
                className="text-lg font-bold text-center"
                style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
              >
                Marcar trueque como realizado
              </h2>
              <p className="text-sm mt-3 text-center" style={{ color: 'var(--c-text)' }}>
                Seguro que queres marcar este trueque como realizado?
              </p>
              <p className="text-xs mt-2 text-center" style={{ color: 'var(--c-text)' }}>
                Se va a completar recien cuando la otra persona tambien lo marque como realizado.
              </p>
              <div className="mt-4 text-xs text-center" style={{ color: 'var(--c-text)' }}>
                <p><strong>Publicacion:</strong> {finishRequestedTitle}</p>
                <p><strong>Tu oferta:</strong> {finishOfferedTitle}</p>
              </div>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setFinishConfirmTrade(null)}
                  className="px-4 py-2 rounded-xl font-semibold border border-[color:var(--c-mid-blue)]/60 hover:bg-[color:var(--c-mid-blue)]/15 transition"
                  style={{ color: 'var(--c-text)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmFinishTrade}
                  className="px-4 py-2 rounded-xl font-semibold text-white hover:brightness-110 transition"
                  style={{ background: 'var(--c-brand)' }}
                >
                  Marcar como realizado
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}