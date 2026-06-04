import { useEffect, useState, useRef } from 'react'
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
  const [selectedPlaceId, setSelectedPlaceId] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [meetingSelectorTrade, setMeetingSelectorTrade] = useState(null)
  const [meetingOptions, setMeetingOptions] = useState([])
  const [meetingOptionsLoading, setMeetingOptionsLoading] = useState(false)
  const [finishConfirmTrade, setFinishConfirmTrade] = useState(null)

  const token = localStorage.getItem('token')
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const myId = String(currentUser._id || currentUser.id || '')
  const menuRef = useRef(null);



  function normalizeMessage(m) {
    const rawFrom = m.from ?? m.senderId ?? m.sender?._id ?? m.sender ?? m.authorId
    const from = String(rawFrom || '')
    const name = m.senderName ?? m.sender?.name ?? 'Usuario'
    return {
      from,
      senderName: from === myId ? 'Yo' : name,
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

      if (action === 'accept') statusText = 'Acepté tu propuesta de trueque.'
      else if (action === 'reject') statusText = 'Rechacé tu propuesta de trueque.'
      else if (action === 'cancel') statusText = 'Cancelé tu propuesta de trueque.'
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
    const activeTrade = findActiveTrade()
    if (!activeTrade) {
      setMenuOpen(false)
      window.alert('No hay trueques activos en este chat para proponer un punto de encuentro.')
      return
    }
    setMenuOpen(true)
    await openMeetingSelector(activeTrade)
  }

  function handleOpenFinishFromMenu() {
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

  {/* Para cerrar presionando fuera del menu ;) */}
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [menuOpen])

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
        senderName: 'Yo',
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
      className="px-4 py-8"
      style={{ background: 'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)' }}
    >
      {meetingSelectorTrade && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-1000"
          onClick={() => setMeetingSelectorTrade(null)}
        >
          <div 
            className='bg-white p-4 rounded-xl'
            onClick={e => e.stopPropagation()}
          >
            <h3 className='text-center mb-1'>Seleccionar lugar de encuentro</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault()

                const chosenPlace = meetingOptions.find(opt => opt.id === selectedPlaceId)

                if (!chosenPlace) {
                  window.alert('Por favor, selecciona un lugar antes de proponer.')
                  return
                }

                await handleSuggestMeeting(meetingSelectorTrade, chosenPlace)
                
                setMeetingSelectorTrade(null)
                setSelectedPlaceId('')
                console.log('Lugar Propuesto:', chosenPlace)
              }}
            >
              <div className="flex flex-col gap-1 overflow-y-auto max-h-60">
                {meetingOptionsLoading ? (
                  <p className="text-[11px] text-[color:var(--c-text)]/70 text-center py-2">
                    Cargando lugares...
                  </p>
                ) : meetingOptions.length ? (
                  meetingOptions.map((option) => (
                    <label 
                    htmlFor={option.id}
                    key={option.id} 
                    className="py-2 px-3 border border-slate-200 rounded-xl cursor-pointer transition-all bg-white has-[:checked]:border-[color:var(--c-brand)] has-[:checked]:bg-[color:var(--c-brand)]/5"
                    >
                      <input 
                        type="radio"
                        id={option.id}
                        name="meeting-option"
                        value={option.id}
                        className="sr-only"
                        checked={String(selectedPlaceId) === String(option.id)}
                        onChange={e => {setSelectedPlaceId(e.target.value)}}
                        />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-[color:var(--c-text)]">
                          {option.name}
                        </span>
                        {option.address && (
                          <span className="text-xs text-[color:var(--c-text)]/60">
                            {option.address}
                          </span>
                        )}
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-[11px] text-[color:var(--c-text)]/70 text-center py-2">
                    No hay lugares disponibles
                  </p>
                )}
              </div>
              <div>
                <button
                  type="submit"
                  className='mt-3 py-1 bg-[color:var(--c-brand)] hover:bg-[color:var(--c-brand)]/80 text-white rounded-xl w-100'
                >
                  Proponer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="max-w-6xl mx-auto">
        <div className="backdrop-blur-sm">
          <header className="px-4 mb-3">
            <div className="flex justify-between px-4 py-3 w-[100%] rounded-2xl bg-white/95 text-left">
              <div className='flex gap-2'>
                <button className='px-3 hover:bg-gray-200 rounded-xl' onClick={() => navigate(-1)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path fill-rule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
                  </svg>
                </button>
                <h1
                  className="m-0! text-[1.7rem]! font-bold"
                  style={{ color: 'var(--c-brand)' }}
                >
                  {trades.length > 0 && trades[0].proposerId?.name
                    ? trades[0].proposerId._id === myId
                      ? trades[0].receiverId?.name || 'Usuario'
                      : trades[0].proposerId?.name || 'Usuario'
                    : 'Chat'}
                </h1>
              </div>
              <button 
                className='px-3 hover:bg-gray-200 rounded-xl'
                onClick={(e) => {
                  setMenuOpen(prev => !prev)
                  e.stopPropagation()
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                  <path fill-rule="evenodd" d="M10.5 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clip-rule="evenodd" />
                </svg>
              </button>
              {menuOpen && (
                <div 
                  ref={menuRef}
                  className="absolute right-7 top-11 mt-2 w-56 rounded-xl bg-gray-200 text-xs z-1000"
                >
                  <button
                    type="button"
                    onClick={handleOpenFinishFromMenu}
                    className="w-full text-left px-4 py-3 hover:bg-[color:var(--c-mid-blue)]/5 text-[color:var(--c-text)]"
                  >
                    Marcar trueque como realizado
                  </button>
                </div>
              )}
            </div>
          </header>
          <div className="flex flex-col max-h-[71vh]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {tradesLoading && (
                <p className="text-[11px] text-[color:var(--c-text)]/70 text-center mb-2">
                  Cargando trueques...
                </p>
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
                const nameLabel = isMine ? 'Yo' : partnerName || 'Usuario'
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
                  <>
                    <div className='flex flex-col gap-3 bg-white rounded-2xl'>
                      <div className='flex justify-between items-center border-b border-[color:var(--c-mid-blue)]/30 px-3 py-2'>
                        <div className='flex gap-1 items-center'>
                          <div className="h-7 w-7 rounded-full bg-white shadow border border-[color:var(--c-mid-blue)]/30 flex items-center justify-center text-[10px] font-semibold text-[color:var(--c-text)]/80">
                            {(nameLabel || 'U').trim()[0] || 'U'}
                          </div>
                          <p className="text-[11px] text-[color:var(--c-text)]/70 align-middle h-4 items-center">
                            {nameLabel}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold h-5 ${statusBadgeClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 px-3'>
                        <a href={`/posts/${requestedId}`} className="flex gap-2 border rounded-xl bg-[color:var(--c-mid-blue)]/5 hover:bg-[color:var(--c-mid-blue)]/15 border-[color:var(--c-mid-blue)]/30 p-3">
                          <div className='h-[80px] md:h-[100px] w-[80px] md:w-[100px]'>
                            <img
                              src={requestedImage}
                              alt={requestedTitle}
                              className="w-full h-full object-cover rounded border border-[color:var(--c-mid-blue)]/30 bg-white" />
                          </div>
                          <div>
                            <p className="text-[0.7rem] md:text-[1rem] uppercase tracking-[0.12em] text-[color:var(--c-info)] mb-0.5">
                              Publicación
                            </p>
                            <p className="text-[0.7rem] md:text-[1rem] font-semibold truncate">
                              {requestedId ? (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/posts/${requestedId}`)}
                                  className="underline text-[color:var(--c-brand)] hover:text-[color:var(--c-mid-pink)]"
                                >
                                  {requestedTitle}
                                </button>
                              ) : (
                                offeredTitle
                              )}
                            </p>
                            {barrioRequested && (
                              <p className="text-[0.6rem] md:text-[0.7rem] text-[color:var(--c-text)]/70 mt-1">
                                Barrio: {barrioRequested}
                              </p>
                            )}
                          </div>
                        </a>
                        <a href={`/posts/${offeredId}`} className="flex gap-2 bg-[color:var(--c-accent)]/15 border hover:bg-[color:var(--c-accent)]/20 border-[color:var(--c-accent)]/30 rounded-xl p-3">
                          <div className='h-[80px] md:h-[100px] w-[80px] md:w-[100px]'>
                            <img
                              src={offeredImage}
                              alt={offeredTitle}
                              className="w-full h-full object-cover rounded border border-[color:var(--c-mid-blue)]/30 bg-white" />
                          </div>
                          <div>
                            <p className="text-[0.7rem] md:text-[1rem] uppercase tracking-[0.12em] text-[color:var(--c-info)] mb-0.5">
                              {isMine ? 'Tu oferta' : 'Oferta'}
                            </p>
                            <p className="text-[0.7rem] md:text-[1rem] font-semibold truncate">
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
                              <p className="text-[0.6rem] md:text-[0.7rem] text-[color:var(--c-text)]/70 mt-1">
                                Barrio: {barrioOffered}
                              </p>
                            )}
                          </div>
                        </a>
                      </div>
                      <div className='px-3'>
                        {(barrioRequested || barrioOffered) && (
                          <p className="text-[0.7rem] text-[color:var(--c-text)]/70">
                            Zonas del trueque: {barrioOffered || '?'} ↔ {barrioRequested || '?'}
                          </p>
                        )}
                      </div>
                      <div className='px-3 pb-3 flex justify-between'>
                        <div className='flex gap-1'>
                          {showAcceptReject && (
                            <>
                              <button
                                onClick={() => handleTradeAction(id, 'accept')}
                                className="px-3 py-2 rounded-xl text-[0.8rem] font-semibold bg-green-500 text-white hover:bg-green-600"
                              >
                                Aceptar
                              </button>
                              <button
                                onClick={() => handleTradeAction(id, 'reject')}
                                className="px-3 py-2 rounded-xl text-[0.8rem] font-semibold bg-red-500 text-white hover:bg-red-600"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          {showCancel && (
                            <button
                              onClick={() => handleTradeAction(id, 'cancel')}
                              className="px-3 py-2 rounded-xl text-[0.8rem] font-semibold bg-white border border-[color:var(--c-mid-blue)]/40 text-[color:var(--c-text)] hover:bg-[color:var(--c-mid-blue)]/5"
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
                  </>
                )
              })}

              {/* Burbuja de punto de encuentro */}
              {trades.map(t => {
                t
              })


              }

              {/* mensajes normales */}
              {messages.map((msg, i) => {
                const isMine = msg.from === myId
                const time = formatTime(msg.createdAt)
                const nameLabel = isMine ? 'Yo' : msg.senderName || 'Usuario'

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
                      <div className="mt-1 h-7 w-7 rounded-full bg-white/95 flex items-center justify-center text-[10px] font-semibold text-[color:var(--c-text)]/80">
                        {(nameLabel || 'U').trim()[0] || 'U'}
                      </div>
                      <div className="flex-1">
                        <div
                          className={`px-4 py-2 rounded-2xl max-w-full break-words ${
                            isMine
                              ? 'bg-[color:var(--c-brand)] text-white rounded-br-none'
                              : 'bg-white text-[color:var(--c-text)] rounded-bl-none'
                          }`}
                        >
                          <p className="text-[11px]">
                            {nameLabel}
                          </p>
                          <p className="text-[13px] leading-snug">
                            {msg.text}
                          </p>
                          <p className="text-[10px]">
                            {time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2 bg.white/90 px-3 py-3 items-center">
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Escribi un mensaje"
                className="flex-1 bg-white/95 rounded-xl border border-slate-200 bg.white px-4 py-2.5 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)] focus:border-[color:var(--c-info)] text-sm text-[color:var(--c-text)] placeholder:text-slate-400"
              />

              {/* Boton de Punto de Encuentro */}
              <button
                onClick={handleOpenMeetingFromMenu}
                className='px-3 py-2.5 rounded-xl border bg-white/95'
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                  <path fill-rule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" />
                </svg>
              </button>

              
              <button
                onClick={sendMessage}
                className="px-3 py-2.5 rounded-xl bg-[color:var(--c-brand)] text-sm font-semibold shadow-[0_14px_35px_rgba(0,0,0,.18)] hover:bg-[color:var(--c-mid-pink)] transition focus:outline-none focus:ring-2 focus:ring-[color:var(--c-info)] focus:ring-offset-1 focus:ring-offset-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" class="size-6">
                  <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {finishConfirmTrade && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-999">
            <div className="w-[92%] max-w-sm rounded-2xl bg-white p-6 border border-[color:var(--c-mid-blue)]/60 shadow-[0_20px_60px_rgba(0,0,0,.25)]">
              <h2
                className="text-lg font-bold text-center"
                style={{ color: 'var(--c-brand)' }}
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