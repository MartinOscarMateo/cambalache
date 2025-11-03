// frontend/src/pages/PostEdit.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPostById, updatePost } from '../lib/api.js'
import { uploadMany } from '../lib/upload.js'

export default function PostEdit() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    hasDetails: 'no',
    detailsText: '',
    location: '',
    openToOffers: 'yes',
    interestsText: ''
  })
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // cargar datos existentes
  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true)
        const data = await getPostById(id)
        setForm({
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          condition: data.condition || '',
          hasDetails: data.hasDetails ? 'yes' : 'no',
          detailsText: data.detailsText || '',
          location: data.location || '',
          openToOffers: data.openToOffers ? 'yes' : 'no',
          interestsText: data.interestsText || ''
        })
        setPreviews(Array.isArray(data.images) ? data.images : [])
      } catch (e) {
        setError(e.message || 'Error al cargar la publicación')
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function onFiles(e) {
    const arr = Array.from(e.target.files || [])
    setFiles(arr)
    setPreviews(arr.map(f => URL.createObjectURL(f)))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const title = form.title.trim()
    const description = form.description.trim()
    const category = form.category.trim().toLowerCase()
    const condition = form.condition
    const location = form.location.trim()
    const hasDetails = form.hasDetails === 'yes'
    const detailsText = hasDetails ? form.detailsText.trim() : ''
    const openToOffers = form.openToOffers === 'yes'
    const interestsText = !openToOffers ? form.interestsText.trim() : ''

    if (title.length < 5) return setError('Título mínimo 5 caracteres')
    if (description.length < 10) return setError('Descripción mínima 10 caracteres')
    if (!category) return setError('Categoría requerida')
    if (!condition) return setError('Seleccioná el estado del artículo')

    setLoading(true)
    try {
      let images = previews
      if (files.length > 0) {
        images = await uploadMany(files.slice(0, 6))
      }

      await updatePost(id, {
        title,
        description,
        category,
        condition,
        hasDetails,
        detailsText,
        location,
        openToOffers,
        interestsText,
        images
      })

      setSuccess('Publicación actualizada con éxito')
      setTimeout(() => navigate(`/posts/${id}`), 1200)
    } catch (err) {
      setError(err.message || 'Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <main className='min-h-screen flex items-center justify-center px-4 py-10' style={{ background: 'var(--c-text)' }}>
      <p className='text-white'>Cargando…</p>
    </main>
  )

  return (
    <main
      className='min-h-screen flex items-center justify-center px-4 py-10'
      style={{ background: 'var(--c-text)' }}
    >
      <section className='w-full max-w-2xl'>
        <div className='rounded-2xl bg-white p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,.25)] border border-[color:var(--c-mid-blue)]/60'>
          <header className='mb-4'>
            <h1
              className='text-2xl font-bold tracking-tight'
              style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
            >
              Editar publicación
            </h1>
            <p className='mt-1 text-sm' style={{ color: 'var(--c-text)' }}>
              Actualizá tu publicación antes de proponer un trueque.
            </p>
          </header>

          <form onSubmit={onSubmit} className='space-y-5'>

            {/* Fotos */}
            <section>
              <label className='text-sm font-medium' style={{ color: 'var(--c-text)' }}>Imágenes</label>
              <div className='mt-2 rounded-xl border-2 border-dashed border-[color:var(--c-mid-blue)]/70 p-4'>
                <input type='file' accept='image/*' multiple onChange={onFiles} disabled={loading} />
                {!!previews.length && (
                  <div className='mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2'>
                    {previews.map((src,i)=>(
                      <img key={i} src={src} alt={`p${i}`} className='w-full h-24 object-cover rounded-lg' />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Datos principales */}
            <section className='grid gap-4'>
              <div className='grid gap-1'>
                <label htmlFor='title' className='text-sm font-medium' style={{ color: 'var(--c-text)' }}>Título</label>
                <input
                  id='title'
                  name='title'
                  value={form.title}
                  onChange={onChange}
                  disabled={loading}
                  className='w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]'
                  placeholder='Ej: Bicicleta urbana rodado 28'
                />
              </div>

              <div className='grid gap-1'>
                <label htmlFor='description' className='text-sm font-medium' style={{ color: 'var(--c-text)' }}>Descripción</label>
                <textarea
                  id='description'
                  name='description'
                  value={form.description}
                  onChange={onChange}
                  disabled={loading}
                  className='w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]'
                  rows={4}
                  placeholder='Contá el estado y qué incluye…'
                />
              </div>

              <div className='grid sm:grid-cols-2 gap-4'>
                <div className='grid gap-1'>
                  <label htmlFor='category' className='text-sm font-medium' style={{ color: 'var(--c-text)' }}>Categoría</label>
                  <input
                    id='category'
                    name='category'
                    value={form.category}
                    onChange={onChange}
                    disabled={loading}
                    className='w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]'
                    placeholder='Ej: bicicletas'
                  />
                </div>

                <div className='grid gap-1'>
                  <label htmlFor='condition' className='text-sm font-medium' style={{ color: 'var(--c-text)' }}>Estado</label>
                  <select
                    id='condition'
                    name='condition'
                    value={form.condition}
                    onChange={onChange}
                    disabled={loading}
                    className='w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]'
                  >
                    <option value=''>Seleccionar…</option>
                    <option value='nuevo'>Nuevo</option>
                    <option value='usado'>Usado</option>
                    <option value='no-funciona'>No funciona</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Detalles */}
            <section className='grid gap-3 rounded-xl bg-[color:var(--c-mid-blue)]/10 border border-[color:var(--c-mid-blue)]/40 p-4'>
              <h2
                className='text-base font-semibold'
                style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
              >
                Detalles del artículo
              </h2>

              <div>
                <span className='text-sm font-medium' style={{ color: 'var(--c-text)' }}>¿Tiene detalles?</span>
                <div className='mt-1 flex gap-4 text-sm' style={{ color: 'var(--c-text)' }}>
                  <label className='inline-flex items-center gap-2'>
                    <input type='radio' name='hasDetails' value='yes' checked={form.hasDetails === 'yes'} onChange={onChange} />
                    Sí
                  </label>
                  <label className='inline-flex items-center gap-2'>
                    <input type='radio' name='hasDetails' value='no' checked={form.hasDetails === 'no'} onChange={onChange} />
                    No
                  </label>
                </div>
              </div>

              {form.hasDetails === 'yes' && (
                <textarea
                  name='detailsText'
                  value={form.detailsText}
                  onChange={onChange}
                  disabled={loading}
                  className='w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]'
                  placeholder='Describí rayas, golpes o faltantes…'
                />
              )}

              <div className='grid gap-1'>
                <label htmlFor='location' className='text-sm font-medium' style={{ color: 'var(--c-text)' }}>Zona</label>
                <input
                  id='location'
                  name='location'
                  value={form.location}
                  onChange={onChange}
                  disabled={loading}
                  className='w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]'
                  placeholder='Ej: Palermo, Buenos Aires'
                />
              </div>
            </section>

            {/* Intercambio */}
            <section className='grid gap-3 rounded-xl bg-[color:var(--c-mid-cyan)]/10 border border-[color:var(--c-mid-cyan)]/40 p-4'>
              <h2
                className='text-base font-semibold'
                style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
              >
                Preferencias de intercambio
              </h2>

              <div>
                <span className='text-sm font-medium' style={{ color: 'var(--c-text)' }}>¿Abierto a ofertas?</span>
                <div className='mt-1 flex gap-4 text-sm' style={{ color: 'var(--c-text)' }}>
                  <label className='inline-flex items-center gap-2'>
                    <input type='radio' name='openToOffers' value='yes' checked={form.openToOffers === 'yes'} onChange={onChange} />
                    Sí
                  </label>
                  <label className='inline-flex items-center gap-2'>
                    <input type='radio' name='openToOffers' value='no' checked={form.openToOffers === 'no'} onChange={onChange} />
                    No
                  </label>
                </div>
              </div>

              {form.openToOffers === 'no' && (
                <textarea
                  name='interestsText'
                  value={form.interestsText}
                  onChange={onChange}
                  disabled={loading}
                  className='w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]'
                  placeholder='Indicá qué buscás a cambio…'
                />
              )}
            </section>

            {error && (
              <p className='rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm'>
                {error}
              </p>
            )}
            {success && (
              <p className='rounded-lg bg-green-50 border border-green-200 text-green-700 px-3 py-2 text-sm'>
                {success}
              </p>
            )}

            <button
              type='submit'
              disabled={loading}
              className='w-full rounded-xl bg-[color:var(--c-text)] px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60'
            >
              {loading ? 'Actualizando…' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}