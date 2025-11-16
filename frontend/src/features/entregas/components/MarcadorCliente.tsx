import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { MAPA_COLORES } from '../constants/mapa.constants';

interface MarcadorClienteProps {
  latitud: number;
  longitud: number;
  razonSocial: string;
  direccion: string;
}

// Componente para mostrar el marcador del cliente (destino de la entrega)
export function MarcadorCliente({ latitud, longitud, razonSocial, direccion }: MarcadorClienteProps) {
  // Crear icono personalizado para el cliente
  const iconoCliente = divIcon({
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
          background-color: ${MAPA_COLORES.cliente};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      </div>
    `,
    className: 'custom-cliente-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  return (
    <Marker position={[latitud, longitud]} icon={iconoCliente}>
      <Popup>
        <div className="min-w-[200px]">
          <div className="font-bold text-lg mb-2 text-red-600">Destino</div>
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-semibold">Cliente:</span> {razonSocial}
            </div>
            <div>
              <span className="font-semibold">Dirección:</span> {direccion}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
