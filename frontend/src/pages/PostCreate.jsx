import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost, getBarrios } from '../lib/api.js';
import { uploadMany } from '../lib/upload.js';

export default function PostCreate() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    hasDetails: 'no',
    detailsText: '',
    barrio: '',
    openToOffers: 'yes',
    interestsText: ''
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [barrios, setBarrios] = useState([]);
  const [barriosLoading, setBarriosLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // límites
  const LIMITS = {
    titleMax: 80,
    titleMin: 5,
    descMax: 800,
    descMin: 10,
    catMax: 40,
    detailsMax: 300,
    interestsMax: 300,
    imagesMax: 6
  };

  useEffect(() => {
    let cancelled = false;
    async function loadBarrios() {
      try {
        const list = await getBarrios();
        if (!cancelled) {
          setBarrios(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Error cargando barrios');
        }
      } finally {
        if (!cancelled) {
          setBarriosLoading(false);
        }
      }
    }
    loadBarrios();
    return () => { cancelled = true; };
  }, []);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function onFiles(e) {
    const arr = Array.from(e.target.files || []);
    const kept = arr.slice(0, LIMITS.imagesMax);
    setFiles(kept);
    setPreviews(kept.map(f => URL.createObjectURL(f)));
    if (arr.length > LIMITS.imagesMax) {
      setError(`Máximo ${LIMITS.imagesMax} imágenes. Se tomaron las primeras ${LIMITS.imagesMax}.`);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    const title = form.title.trim();
    const description = form.description.trim();
    const category = form.category.trim().toLowerCase();
    const condition = form.condition;
    const barrio = form.barrio.trim();
    const hasDetails = form.hasDetails === 'yes';
    const detailsText = hasDetails ? form.detailsText.trim() : '';
    const openToOffers = form.openToOffers === 'yes';
    const interestsText = !openToOffers ? form.interestsText.trim() : '';

    if (title.length < LIMITS.titleMin) return setError(`Título mínimo ${LIMITS.titleMin} caracteres`);
    if (description.length < LIMITS.descMin) return setError(`Descripción mínima ${LIMITS.descMin} caracteres`);
    if (!category) return setError('Categoría requerida');
    if (!condition) return setError('Seleccioná el estado del artículo');
    if (!barrio) return setError('Seleccioná un barrio');
    if (!files.length) return setError('Subí al menos una imagen');

    setLoading(true);
    try {
      const images = await uploadMany(files.slice(0, LIMITS.imagesMax));
      const post = await createPost({
        title,
        description,
        category,
        condition,
        hasDetails,
        detailsText,
        barrio,
        openToOffers,
        interestsText,
        images
      });
      const id = post.id || post._id;
      navigate(`/posts/${id}`);
    } catch (err) {
      setError(err.message || 'Error al crear la publicación');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'var(--c-text)' }}
    >
      <section className="w-full max-w-2xl">
        <div className="rounded-2xl bg-white p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,.25)] border border-[color:var(--c-mid-blue)]/60">
          <header className="mb-4">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
            >
              Crear publicación
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--c-text)' }}>
              Mostrá qué ofrecés y qué te interesa recibir a cambio.
            </p>
          </header>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Imgensess */}
            <section>
              <label className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>Imágenes</label>
              <div className="mt-2 rounded-xl border-2 border-dashed border-[color:var(--c-mid-blue)]/70 p-4">
                <input className='w-full hidden sm:block' type="file" accept="image/*" multiple onChange={onFiles} disabled={loading} />
                <label className="block w-full cursor-pointer sm:hidden">
                  <input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onFiles}
                    disabled={loading}
                    className="sr-only"
                  />
                  
                  <div className="w-full rounded-md bg-white text-slate-700 border border-transparent">
                    <div className="text-sm text-[var(--c-text)]">Hacé click para elegir archivos</div>
                    <div className="mt-2 text-sm text-slate-700 whitespace-normal break-words max-h-20 overflow-auto">
                      {files && files.length > 0 ? (
                        files.map((f, i) => (
                          <div key={i} className="mb-1">
                            {f.name}
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">Ningún archivo seleccionado</span>
                      )}
                    </div>
                  </div>
                </label>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Máximo {LIMITS.imagesMax} imágenes.</span>
                  <span>{previews.length}/{LIMITS.imagesMax}</span>
                </div>
                {!!previews.length && (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {previews.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`p${i}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Datos principales */}
            <section className="grid gap-4">
              <div className="grid gap-1">
                <label htmlFor="title" className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>Título</label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  disabled={loading}
                  maxLength={LIMITS.titleMax}
                  aria-describedby="title-help"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
                  placeholder="Ej: Bicicleta urbana rodado 28"
                />
                <div id="title-help" className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Mínimo {LIMITS.titleMin}, máximo {LIMITS.titleMax}.</span>
                  <span>{form.title.length}/{LIMITS.titleMax}</span>
                </div>
              </div>

              <div className="grid gap-1">
                <label htmlFor="description" className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>Descripción</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  disabled={loading}
                  maxLength={LIMITS.descMax}
                  aria-describedby="desc-help"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
                  rows={4}
                  placeholder="Contá el estado y qué incluye…"
                />
                <div id="desc-help" className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Mínimo {LIMITS.descMin}, máximo {LIMITS.descMax}.</span>
                  <span>{form.description.length}/{LIMITS.descMax}</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <label htmlFor="category" className="text-sm font-medium h-[20px]" style={{ color: 'var(--c-text)' }}>Categoría</label>
                  <input
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={onChange}
                    disabled={loading}
                    maxLength={LIMITS.catMax}
                    aria-describedby="cat-help"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
                    placeholder="Ej: bicicletas"
                  />
                  <div id="cat-help" className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Máximo {LIMITS.catMax}.</span>
                    <span>{form.category.length}/{LIMITS.catMax}</span>
                  </div>
                </div>

                <div className="grid grid-rows-[20px_1fr] gap-1 sm:grid-rows-[20px_1fr_20px]">
                  <label htmlFor="condition" className="text-sm font-medium h-[20px]" style={{ color: 'var(--c-text)' }}>Estado</label>
                  <select
                    id="condition"
                    name="condition"
                    value={form.condition}
                    onChange={onChange}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
                  >
                    <option value="">Seleccionar…</option>
                    <option value="nuevo">Nuevo</option>
                    <option value="usado">Usado</option>
                    <option value="no-funciona">No funciona</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Detalles */}
            <section className="grid gap-3 rounded-xl bg-[color:var(--c-mid-blue)]/10 border border-[color:var(--c-mid-blue)]/40 p-4">
              <h2
                className="text-base font-semibold"
                style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
              >
                Detalles del artículo
              </h2>

              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>¿Tiene detalles?</span>
                <div className="mt-1 flex gap-4 text-sm" style={{ color: 'var(--c-text)' }}>
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="hasDetails" value="yes" checked={form.hasDetails === 'yes'} onChange={onChange} />
                    Sí
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="hasDetails" value="no" checked={form.hasDetails === 'no'} onChange={onChange} />
                    No
                  </label>
                </div>
              </div>

              {form.hasDetails === 'yes' && (
                <>
                  <textarea
                    name="detailsText"
                    value={form.detailsText}
                    onChange={onChange}
                    disabled={loading}
                    maxLength={LIMITS.detailsMax}
                    aria-describedby="details-help"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
                    placeholder="Describí rayas, golpes o faltantes…"
                  />
                  <div id="details-help" className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Máximo {LIMITS.detailsMax}.</span>
                    <span>{form.detailsText.length}/{LIMITS.detailsMax}</span>
                  </div>
                </>
              )}

              <div className="grid gap-3">
                <div className="grid gap-1">
                  <label htmlFor="barrio" className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>Barrio</label>
                  <select
                    id="barrio"
                    name="barrio"
                    value={form.barrio}
                    onChange={onChange}
                    disabled={loading || barriosLoading}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
                  >
                    <option value="">{barriosLoading ? 'Cargando barrios…' : 'Seleccionar barrio…'}</option>
                    {!barriosLoading && barrios.map((b, i) => (
                      <option key={i} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Preferencias de intercambio */}
            <section className="grid gap-3 rounded-xl bg-[color:var(--c-mid-cyan)]/10 border border-[color:var(--c-mid-cyan)]/40 p-4">
              <h2
                className="text-base font-semibold"
                style={{ color: 'var(--c-brand)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
              >
                Preferencias de intercambio
              </h2>

              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>¿Abierto a ofertas?</span>
                <div className="mt-1 flex gap-4 text-sm" style={{ color: 'var(--c-text)' }}>
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="openToOffers" value="yes" checked={form.openToOffers === 'yes'} onChange={onChange} />
                    Sí
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="openToOffers" value="no" checked={form.openToOffers === 'no'} onChange={onChange} />
                    No
                  </label>
                </div>
              </div>

              {form.openToOffers === 'no' && (
                <>
                  <textarea
                    name="interestsText"
                    value={form.interestsText}
                    onChange={onChange}
                    disabled={loading}
                    maxLength={LIMITS.interestsMax}
                    aria-describedby="interests-help"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)]"
                    placeholder="Indicá qué buscás a cambio…"
                  />
                  <div id="interests-help" className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Máximo {LIMITS.interestsMax}.</span>
                    <span>{form.interestsText.length}/{LIMITS.interestsMax}</span>
                  </div>
                </>
              )}
            </section>

            {error && (
              <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[color:var(--c-text)] px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? 'Creando…' : 'Publicar'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}