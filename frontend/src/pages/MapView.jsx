import { MapContainer, TileLayer } from 'react-leaflet';

const CABA_CENTER = [-34.6118, -58.4173];
const CABA_BOUNDS = [
  [-34.73, -58.55],
  [-34.53, -58.35]
];

export default function MapView() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer
        center={CABA_CENTER}
        zoom={12}
        minZoom={10}
        maxZoom={18}
        maxBounds={CABA_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
      </MapContainer>
    </div>
  );
}