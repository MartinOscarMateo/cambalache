import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { getBarriosGeojson, getPosts } from '../lib/api.js';

const CABA_CENTER = [-34.6118, -58.4173];
const CABA_BOUNDS = [
  [-34.73, -58.55],
  [-34.53, -58.35]
];

export default function MapView() {
  const [barriosGeojson, setBarriosGeojson] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingMapData, setLoadingMapData] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState('');
  const [selectedBarrio, setSelectedBarrio] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadMapData() {
      try {
        const data = await getBarriosGeojson();
        if (!cancelled) {
          setBarriosGeojson(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Error cargando barrios en el mapa');
        }
      } finally {
        if (!cancelled) {
          setLoadingMapData(false);
        }
      }
    }

    async function loadPosts() {
      try {
        const env = await getPosts({ status: 'active', page: 1, limit: 100 });
        if (!cancelled) {
          setPosts(Array.isArray(env.items) ? env.items : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Error cargando publicaciones');
        }
      } finally {
        if (!cancelled) {
          setLoadingPosts(false);
        }
      }
    }

    loadMapData();
    loadPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  // barrios que tienen publicaciones activas
  const barriosConPosts = new Set(
    posts
      .map(p => (p.barrio || '').toString().trim().toUpperCase())
      .filter(Boolean)
  );

  // estilo de cada barrio dependiendo de si tiene publicaciones y tambien como se ve si está seleccionado con un click ! 1 !!!
  function barrioStyle(feature) {
    const nombre = (feature?.properties?.BARRIO || '').toString().trim().toUpperCase();
    const hasPosts = nombre && barriosConPosts.has(nombre);
    const isSelected = selectedBarrio && nombre === selectedBarrio;

    if (hasPosts) {
      // barrio con publicaciones,de color azul
      const base = {
        color: '#2727d1',       // contorno
        weight: 1.5,
        opacity: 1,
        fillColor: '#2727d1',   // relleno
        fillOpacity: 0.55,
        fill: true
      };
      if (isSelected) {
        return {
          ...base,
          weight: base.weight + 1,
          fillOpacity: Math.min(base.fillOpacity + 0.15, 0.9)
        };
      }
      return base;
    }

    // como se ven los barrios sin publicaciones, de color gris!! 1!
    const base = {
      color: '#555555',        // contornowo
      weight: 1,
      opacity: 1,
      fillColor: '#d9d9d9',    // rellenowo
      fillOpacity: 0.6,
      fill: true
    };

    if (isSelected) {
      return {
        ...base,
        weight: base.weight + 1,
        fillOpacity: Math.min(base.fillOpacity + 0.15, 0.9)
      };
    }

    return base;
  }

  // manejamos click en cada barrio
  function onEachBarrio(feature, layer) {
    layer.on({
      click: () => {
        const nombre = (feature?.properties?.BARRIO || '').toString().trim().toUpperCase();
        if (!nombre) return;
        setSelectedBarrio(prev => (prev === nombre ? '' : nombre));
      }
    });
  }

  // posts que se van a ver en la columna donde tienen que ir + filtro por barrio clikeado
  const postsFiltrados = selectedBarrio
    ? posts.filter(p => (p.barrio || '').toString().trim().toUpperCase() === selectedBarrio)
    : posts;

  const totalPosts = posts.length;
  const totalFiltrados = postsFiltrados.length;

  return (
    <div className="flex h-screen w-full bg-slate-50">
      {/* Columna de publis a la izquierda */}
      <aside
        className="w-full sm:w-80 md:w-96 h-full border-r border-slate-200 bg-white flex flex-col shadow-lg"
        style={{ maxWidth: '420px' }}
      >
        <header className="px-4 py-3 border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-10">
          <h2
            className="text-sm font-semibold tracking-tight"
            style={{ color: 'var(--c-text)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
          >
            Mapa de publicaciones
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {selectedBarrio
              ? `Ofertas activas en ${selectedBarrio}`
              : 'Explora ofertas activas dentro de CABA'}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
              <span className="h-2 w-2 rounded-full bg-[#2727d1]" />
              {selectedBarrio ? `Barrio seleccionado: ${selectedBarrio}` : 'Sin filtro de barrio'}
            </span>
            <span className="ml-2 whitespace-nowrap">
              {totalFiltrados} / {totalPosts || totalFiltrados} avisos
            </span>
          </div>
        </header>

        {error && (
          <div className="m-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {loadingPosts && (
            <p className="text-xs text-slate-500">Cargando publicaciones…</p>
          )}

          {!loadingPosts && !postsFiltrados.length && !error && (
            <p className="text-xs text-slate-500 leading-relaxed">
              {selectedBarrio
                ? 'No hay publicaciones activas en este barrio por ahora. Probá limpiando el filtro para ver toda CABA.'
                : 'No hay publicaciones activas en este momento. Volvé a revisar mas tarde.'}
            </p>
          )}

          {!loadingPosts && postsFiltrados.map((post) => {
            const id = post._id || post.id;
            return (
              <article
                key={id}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs shadow-sm hover:shadow-md hover:border-[#2727d1]/70 transition-all duration-150 cursor-pointer"
              >
                <h3 className="font-semibold text-[var(--c-text)] text-[13px] line-clamp-2">
                  {post.title}
                </h3>
                <p className="mt-1 text-[11px] text-slate-500 uppercase tracking-wide">
                  {post.category} · {post.barrio || 'Barrio no especificado'}
                </p>
                {post.description && (
                  <p className="mt-2 text-[11px] text-slate-600 line-clamp-3">
                    {post.description}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </aside>

      {/* Mapa a la derecha owo */}
      <div className="relative flex-1 h-full">
        <div className="pointer-events-none absolute left-4 top-4 z-[400]">
          <div className="rounded-xl bg-white/90 px-3 py-2 shadow-md text-[11px] text-slate-700 space-y-1">
            <p className="font-semibold text-[12px]" style={{ fontFamily: 'vag-rundschrift-d, sans-serif' }}>
              Vista de barrios CABA
            </p>
            <p>Azul: barrios con publicaciones activas</p>
            <p>Gris: barrios sin publicaciones activas</p>
            <p>Hace click en un barrio para filtrar la lista</p>
          </div>
        </div>

        <MapContainer
          center={CABA_CENTER}
          zoom={13}
          minZoom={13}
          maxZoom={18}
          maxBounds={CABA_BOUNDS}
          maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />
          {!loadingMapData && barriosGeojson && (
            <GeoJSON
              data={barriosGeojson}
              style={barrioStyle}
              onEachFeature={onEachBarrio}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
