import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { divIcon, LatLng } from 'leaflet';
import { MAPA_CONFIG } from '@/features/entregas/constants/mapa.constants';
import 'leaflet/dist/leaflet.css';

interface MapaPickerProps {
  latitud: number;
  longitud: number;
  onLocationChange: (lat: number, lng: number) => void;
}

// Componente interno para manejar los clicks en el mapa
function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Componente para seleccionar ubicación en el mapa con un click
export function MapaPicker({ latitud, longitud, onLocationChange }: MapaPickerProps) {
  const [position, setPosition] = useState<[number, number]>([latitud, longitud]);

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationChange(lat, lng);
  }, [onLocationChange]);

  // Icono personalizado para el marcador de ubicación seleccionada
  const locationIcon = divIcon({
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: #ef4444;
          border: 4px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
          <div style="
            width: 12px;
            height: 12px;
            background-color: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      </div>
    `,
    className: 'custom-location-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  return (
    <div className="space-y-3">
      <div className="bg-info-50 border border-info-200 rounded-lg p-3">
        <p className="text-sm text-info-800">
          <strong>Haz clic en el mapa</strong> para seleccionar tu ubicación de entrega.
          Puedes mover el mapa y hacer zoom para encontrar tu dirección exacta.
        </p>
      </div>

      <div className="rounded-lg overflow-hidden border-2 border-piedra-300 shadow-md">
        <MapContainer
          center={position}
          zoom={MAPA_CONFIG.zoomInicial}
          style={{ height: '400px', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url={MAPA_CONFIG.tileLayerUrl}
            attribution={MAPA_CONFIG.attribution}
          />
          <MapClickHandler onLocationChange={handleLocationChange} />
          <Marker position={position} icon={locationIcon} />
        </MapContainer>
      </div>

      <div className="bg-cemento-50 rounded-lg p-3 border border-piedra-200">
        <p className="text-xs text-cemento-600 mb-1">Ubicación seleccionada:</p>
        <div className="flex gap-4 text-sm font-mono">
          <div>
            <span className="text-cemento-500">Lat:</span>{' '}
            <span className="text-cemento-900 font-semibold">{position[0].toFixed(6)}</span>
          </div>
          <div>
            <span className="text-cemento-500">Lng:</span>{' '}
            <span className="text-cemento-900 font-semibold">{position[1].toFixed(6)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
