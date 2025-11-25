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

  return (
    <div className="flex h-screen w-full">
      {/* Mapita a la izquiedra uwu*/}
      <div className="flex-1 h-full">
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

      {/* Columna de publis*/}
      <aside
        className="w-full sm:w-80 md:w-96 h-full border-l border-slate-200 bg-white flex flex-col"
        style={{ maxWidth: '400px' }}
      >
        <header className="px-4 py-3 border-b border-slate-200">
          <h2
            className="text-sm font-semibold tracking-tight"
            style={{ color: 'var(--c-text)', fontFamily: 'vag-rundschrift-d, sans-serif' }}
          >
            Publicaciones disponibles
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {selectedBarrio
              ? `Mostrando publicaciones activas en ${selectedBarrio}.`
              : 'Mostrando publicaciones activas dentro de CABA.'}
          </p>
        </header>

        {error && (
          <div className="m-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {loadingPosts && (
            <p className="text-xs text-slate-500">Cargando publicaciones…</p>
          )}

          {!loadingPosts && !postsFiltrados.length && !error && (
            <p className="text-xs text-slate-500">
              {selectedBarrio
                ? 'No hay publicaciones activas en este barrio.'
                : 'No hay publicaciones activas en este momento.'}
            </p>
          )}

          {!loadingPosts && postsFiltrados.map((post) => {
            const id = post._id || post.id;
            return (
              <article
                key={id}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm"
              >
                <h3 className="font-semibold text-[var(--c-text)] line-clamp-2">
                  {post.title}
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500 uppercase tracking-wide">
                  {post.category} · {post.barrio || 'Barrio no especificado'}
                </p>
                {post.description && (
                  <p className="mt-1 text-[11px] text-slate-600 line-clamp-3">
                    {post.description}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </aside>
    </div>
  );
}