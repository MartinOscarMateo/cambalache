import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPost, getBarrios, createTrade } from '../lib/api.js';
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
  const location = useLocation();
  const offerForPostId = location.state?.offerForPostId || '';
  const isTradeOfferMode = !!offerForPostId;

  // limites
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
      const newPostId = post.id || post._id;

      if (!newPostId) {
        throw new Error('Publicación creada pero sin id válido');
      }
      if (isTradeOfferMode && offerForPostId) {
        try {
          await createTrade({
            postRequestedId: offerForPostId,
            postOfferedId: newPostId
          });
          navigate(`/posts/${offerForPostId}`);
        } catch (tradeErr) {
          setError(tradeErr.message || 'La publicación se creó, pero hubo un problema al proponer el trueque.');
        }
      } else {
        navigate(`/posts/${newPostId}`);
      }
    } catch (err) {
      setError(err.message || 'Error al crear la publicación');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background: 'linear-gradient(180deg, var(--c-text) 0%, #15158f 55%, #05004c 100%)'
      }}
    >
      <section className="w-full max-w-5xl">
        {isTradeOfferMode && (
          <div className="mb-3 rounded-2xl bg-white/95 border border-[color:var(--c-info)]/50 px-4 py-3 text-sm text-[color:var(--c-text)]">
            <p className="font-semibold text-[color:var(--c-info)]">
              Estás creando una publicación para ofrecer en un trueque.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Al publicar, vamos a enviar esta publicación como oferta para otra publicación.
            </p>
          </div>
        )}
        <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-6 sm:p-8 shadow-[0_24px_80px_rgba(5,0,76,.55)] border border-[color:var(--c-mid-blue)]/60">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--c-info)]/90">
                Publicaciones · Nuevo aviso
              </p>
              <h1
                className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight"
                style={{ color: 'var(--c-brand)' }}
              >
                Crear publicación
              </h1>

            </div>
            <div className="flex flex-col items-end text-xs sm:text-sm text-[color:var(--c-text)]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-[color:var(--c-info)]/60 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-[color:var(--c-info)]" />
                Paso único · Completar publicación
              </span>
              <span className="mt-1 hidden sm:block text-[11px] text-slate-500">
                Podés editarla luego desde “Mis publicaciones”.
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(260px,1fr)] lg:items-start">
            {/* Columna formulario */}
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Imágenes xd */}
              <section
                className="rounded-2xl border border-dashed p-4 sm:p-5 bg-white/95"
                style={{
                  borderColor: 'rgba(0,175,231,0.45)'
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--c-info)]">
                      Paso 1 · Imágenes
                    </p>
                    <label className="block text-sm font-medium mt-1" style={{ color: 'var(--c-text)' }}>
                      Fotos del artículo
                    </label>
                    <p className="mt-1 text-xs text-slate-500 max-w-md">
                      Sumá entre 3 y 6 fotos en buena luz. La primera se usa como portada en el listado.
                    </p>
                  </div>
                  <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-[color:var(--c-info)]/60 text-[color:var(--c-text)] text-lg">
                    📷
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-white/90 px-4 py-3 border border-dashed border-[color:var(--c-info)]/60">
                  <div className="hidden sm:block">
                    <input
                      className="w-full cursor-pointer"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={onFiles}
                      disabled={loading}
                    />
                  </div>

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

                    <div className="w-full rounded-lg bg-white/90 text-slate-700 border border-[color:var(--c-info)]/60 px-3 py-2">
                      <div className="text-sm text-[var(--c-text)] font-medium">
                        Tocá para elegir archivos
                      </div>
                      <div className="mt-2 text-xs text-slate-700 whitespace-normal break-words max-h-24 overflow-auto">
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

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Máximo {LIMITS.imagesMax} imágenes.</span>
                    <span>{previews.length}/{LIMITS.imagesMax}</span>
                  </div>
                </div>

                {!!previews.length && (
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {previews.map((src, i) => (
                      <div
                        key={i}
                        className={`relative overflow-hidden rounded-xl border ${
                          i === 0
                            ? 'border-[color:var(--c-brand)] ring-2 ring-[color:var(--c-brand)]/60'
                            : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={src}
                          alt={`p${i}`}
                          className="w-full h-24 object-cover"
                        />
                        {i === 0 && (
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-[color:var(--c-brand)] text-[10px] font-semibold uppercase tracking-[0.16em] text-white px-2 py-0.5">
                            Portada
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Datos principales */}
              <section className="grid gap-4 rounded-2xl bg-slate-50/70 border border-slate-200 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--c-brand)] mb-1">
                  Paso 2 · Información básica
                </p>

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
                    className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)] focus:border-[color:var(--c-info)] text-sm"
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
                    className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)] focus:border-[color:var(--c-info)] text-sm"
                    rows={4}
                    placeholder="Contá el estado, usos, qué incluye y si tiene algo para revisar…"
                  />
                  <div id="desc-help" className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Mínimo {LIMITS.descMin}, máximo {LIMITS.descMax}.</span>
                    <span>{form.description.length}/{LIMITS.descMax}</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-1">
                    <label htmlFor="category" className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>Categoría</label>
                    <input
                      id="category"
                      name="category"
                      value={form.category}
                      onChange={onChange}
                      disabled={loading}
                      maxLength={LIMITS.catMax}
                      aria-describedby="cat-help"
                      className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)] focus:border-[color:var(--c-info)] text-sm"
                      placeholder="Ej: bicicletas"
                    />
                    <div id="cat-help" className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <span>Máximo {LIMITS.catMax}.</span>
                      <span>{form.category.length}/{LIMITS.catMax}</span>
                    </div>
                  </div>

                  <div className="grid grid-rows-[20px_1fr] gap-1 sm:grid-rows-[20px_1fr_20px]">
                    <label htmlFor="condition" className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>Estado</label>
                    <select
                      id="condition"
                      name="condition"
                      value={form.condition}
                      onChange={onChange}
                      disabled={loading}
                      className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)] focus:border-[color:var(--c-info)] text-sm"
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
              <section
                className="grid gap-4 rounded-2xl border p-4 sm:p-5"
                style={{
                  background: 'rgba(39,39,209,0.04)',
                  borderColor: 'rgba(39,39,209,0.22)'
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2
                    className="text-base font-semibold"
                    style={{ color: 'var(--c-brand)' }}
                  >
                    Detalles del artículo
                  </h2>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--c-text)]/70">
                    Paso 3 · Estado real
                  </span>
                </div>

                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>¿Tiene detalles?</span>
                  <div className="flex gap-4 text-sm mt-3" style={{ color: 'var(--c-text)' }}>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="hasDetails" value="yes" checked={form.hasDetails === 'yes'} onChange={onChange} />
                      Sí, tiene marcas / fallas
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="hasDetails" value="no" checked={form.hasDetails === 'no'} onChange={onChange} />
                      No, está en buen estado
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
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)] focus:border-[color:var(--c-info)] text-sm"
                      placeholder="Describí rayas, golpes, piezas faltantes o cualquier cosa que te gustaría saber si fueras vos quien la recibe…"
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
                      className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)] focus:border-[color:var(--c-info)] text-sm"
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
              <section className="grid gap-4 rounded-2xl border p-4 sm:p-5 bg-[var(--c-info)]/5 border-[var(--c-info)]/30">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-[var(--c-brand)]">
                    Preferencias de intercambio
                  </h2>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--c-info)]/90">
                    Paso 4 · Qué esperás a cambio
                  </span>
                </div>

                <div>
                  <span className="text-sm font-medium text-[var(--c-text)]">¿Abierto a ofertas?</span>
                  <div className="flex flex-wrap gap-4 text-sm mt-3 text-[var(--c-text)]">
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="openToOffers" value="yes" checked={form.openToOffers === 'yes'} onChange={onChange} />
                      Sí, escucho propuestas
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="openToOffers" value="no" checked={form.openToOffers === 'no'} onChange={onChange} />
                      No, busco algo específico
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
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none ring-2 ring-transparent focus:ring-[color:var(--c-info)] focus:border-[color:var(--c-info)] text-sm"
                      placeholder="Indicá qué buscás a cambio (ej: otra bici urbana, notebook, clases de guitarra, etc.)"
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

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500 sm:max-w-xs">
                  Al publicar aceptás las reglas de convivencia de Cambalache y nuestro código de buenas prácticas de intercambio.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center items-center rounded-xl bg-[color:var(--c-text)] px-6 py-3 font-semibold text-white text-sm shadow-sm shadow-[rgba(0,0,0,.25)] transition hover:brightness-110 disabled:opacity-60"
                >
                  {loading ? 'Creando…' : 'Publicar'}
                </button>
              </div>
            </form>

            {/* Columna lateral */}
            <aside className="mt-6 lg:mt-0 lg:pl-4">
              <div className="sticky top-4">
                <div className="rounded-2xl bg-white/90 border border-[color:var(--c-brand)]/40 px-4 py-4 sm:px-5 sm:py-5">
                  <h4 className="text-sm font-semibold text-[color:var(--c-text)]">
                    Tip rápido para un buen trueque
                  </h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                    <li>• Mostrá bien el estado real: fotos claras y sin filtros raros.</li>
                    <li>• Contá si tiene detalles antes: evita malos entendidos después.</li>
                    <li>• Sé flexible con el barrio de encuentro si podés.</li>
                    <li>• Cuanto más claro el texto, más chances de match.</li>
                  </ul>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </section>
    </main>
  );
}