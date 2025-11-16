import { MapContainer, TileLayer } from 'react-leaflet';
import { MAPA_CONFIG } from '../constants/mapa.constants';
import type { ReactNode } from 'react';

interface MapaBaseProps {
  children?: ReactNode;
  className?: string;
}

// Componente base del mapa con configuración de Leaflet
// Contiene el MapContainer y TileLayer de OpenStreetMap
export function MapaBase({ children, className = 'h-[600px] w-full rounded-lg' }: MapaBaseProps) {
  return (
    <MapContainer
      center={MAPA_CONFIG.centro}
      zoom={MAPA_CONFIG.zoomInicial}
      minZoom={MAPA_CONFIG.zoomMin}
      maxZoom={MAPA_CONFIG.zoomMax}
      className={className}
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution={MAPA_CONFIG.attribution}
        url={MAPA_CONFIG.tileLayerUrl}
      />
      {children}
    </MapContainer>
  );
}
