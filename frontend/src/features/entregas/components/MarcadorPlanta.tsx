import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { MAPA_COLORES, PLANTA_COORDENADAS } from '../constants/mapa.constants';

// Componente para mostrar el marcador de Planta Agregados Zambrana
export function MarcadorPlanta() {
  // Crear icono personalizado para la planta
  const iconoPlanta = divIcon({
    html: `
      <div style="
        position: relative;
        width: 48px;
        height: 48px;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: ${MAPA_COLORES.planta};
          border: 4px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 3L2 12h3v8h14v-8h3L12 3m0 2.5L18.5 11H17v7h-4v-5h-2v5H7v-7H5.5L12 5.5Z"/>
          </svg>
        </div>
      </div>
    `,
    className: 'custom-planta-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });

  return (
    <Marker position={[PLANTA_COORDENADAS.latitud, PLANTA_COORDENADAS.longitud]} icon={iconoPlanta}>
      <Popup>
        <div className="min-w-[180px]">
          <div className="font-bold text-lg mb-2 text-green-600">Planta Agregados Zambrana</div>
          <div className="text-sm text-gray-600">
            Punto de salida de todas las entregas
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
