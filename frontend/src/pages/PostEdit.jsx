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

  if (loading) return <main className='p-6'><p>Cargando…</p></main>

  return (
    <main className='max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md'>
      <h1 className='text-2xl font-bold mb-6'>Editar publicación</h1>
      <form onSubmit={onSubmit} className='space-y-6'>

        {/* Fotos */}
        <section>
          <label className='block font-semibold mb-2'>Imágenes</label>
          <input type='file' accept='image/*' multiple onChange={onFiles} disabled={loading} />
          {!!previews.length && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8,margin:'8px 0'}}>
              {previews.map((src,i)=>(
                <img key={i} src={src} alt={`p${i}`} style={{width:'100%',height:120,objectFit:'cover',borderRadius:8}} />
              ))}
            </div>
          )}
        </section>

        {/* Datos principales */}
        <section>
          <label className='block font-semibold'>Título</label>
          <input name='title' value={form.title} onChange={onChange} disabled={loading} className='w-full border rounded p-2' />
          
          <label className='block font-semibold mt-4'>Descripción</label>
          <textarea name='description' value={form.description} onChange={onChange} disabled={loading} className='w-full border rounded p-2' />
          
          <label className='block font-semibold mt-4'>Categoría</label>
          <input name='category' value={form.category} onChange={onChange} disabled={loading} className='w-full border rounded p-2' placeholder='Ej: bicicletas' />
        </section>

        {/* Detalles */}
        <section>
          <h2 className='font-semibold text-lg mb-2'>Detalles del artículo</h2>
          
          <label className='block'>Estado</label>
          <select name='condition' value={form.condition} onChange={onChange} disabled={loading} className='w-full border rounded p-2'>
            <option value=''>Seleccionar...</option>
            <option value='nuevo'>Nuevo</option>
            <option value='usado'>Usado</option>
            <option value='no-funciona'>No funciona</option>
          </select>

          <label className='block mt-4'>¿Tiene detalles?</label>
          <div className='flex gap-4'>
            <label><input type='radio' name='hasDetails' value='yes' checked={form.hasDetails === 'yes'} onChange={onChange} /> Sí</label>
            <label><input type='radio' name='hasDetails' value='no' checked={form.hasDetails === 'no'} onChange={onChange} /> No</label>
          </div>
          {form.hasDetails === 'yes' && (
            <textarea name='detailsText' value={form.detailsText} onChange={onChange} disabled={loading} className='w-full border rounded p-2 mt-2' placeholder='Describí los detalles...' />
          )}

          <label className='block mt-4'>Zona</label>
          <input name='location' value={form.location} onChange={onChange} disabled={loading} className='w-full border rounded p-2' placeholder='Ej: Palermo, Buenos Aires' />
        </section>

        {/* Intercambio */}
        <section>
          <h2 className='font-semibold text-lg mb-2'>Preferencias de intercambio</h2>
          
          <label className='block'>¿Abierto a ofertas?</label>
          <div className='flex gap-4'>
            <label><input type='radio' name='openToOffers' value='yes' checked={form.openToOffers === 'yes'} onChange={onChange} /> Sí</label>
            <label><input type='radio' name='openToOffers' value='no' checked={form.openToOffers === 'no'} onChange={onChange} /> No</label>
          </div>

          {form.openToOffers === 'no' && (
            <textarea name='interestsText' value={form.interestsText} onChange={onChange} disabled={loading} className='w-full border rounded p-2 mt-2' placeholder='Contanos qué cosas te interesan o qué buscás a cambio...' />
          )}
        </section>

        {error && <p className='text-red-600'>{error}</p>}
        {success && <p className='text-green-600'>{success}</p>}
        <button type='submit' disabled={loading} className='w-full py-3 bg-yellow-500 text-white font-semibold rounded hover:bg-yellow-600 transition'>
          {loading ? 'Actualizando…' : 'Guardar cambios'}
        </button>
      </form>
    </main>
  )
}