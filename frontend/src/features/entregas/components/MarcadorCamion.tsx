import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { MAPA_COLORES, VELOCIDAD_DETENIDO_THRESHOLD } from '../constants/mapa.constants';
import type { PosicionGPS } from '../types/gps.types';

interface MarcadorCamionProps {
  posicion: PosicionGPS;
  camionPlaca: string;
  conductorNombre: string;
  clienteNombre: string;
  velocidadPromedio?: number;
  destacado?: boolean;
  estaDesviado?: boolean;
}

// Componente para mostrar marcador de camión en el mapa
// Cambia de color según si está en movimiento o detenido
// Puede ser destacado cuando está seleccionado en la lista
export function MarcadorCamion({
  posicion,
  camionPlaca,
  conductorNombre,
  clienteNombre,
  velocidadPromedio = 0,
  destacado = false,
  estaDesviado = false,
}: MarcadorCamionProps) {
  // Determinar si el camión está detenido
  const estaDetenido = velocidadPromedio < VELOCIDAD_DETENIDO_THRESHOLD;

  // Prioridad de color: desviado (rojo) > detenido (naranja) > movimiento (azul)
  const color = estaDesviado
    ? MAPA_COLORES.camionDesviado
    : estaDetenido
      ? MAPA_COLORES.camionDetenido
      : MAPA_COLORES.camionMovimiento;

  // Tamaño del marcador (más grande si está destacado)
  const size = destacado ? 50 : 40;
  const iconSize = destacado ? 24 : 20;

  // Crear icono personalizado usando DivIcon
  const iconoCamion = divIcon({
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
      ">
        ${
          destacado
            ? `<div style="
                position: absolute;
                top: -5px;
                left: -5px;
                width: calc(100% + 10px);
                height: calc(100% + 10px);
                background-color: #ff6b35;
                border-radius: 50%;
                opacity: 0.3;
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              "></div>`
            : ''
        }
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="white">
            <path d="M18 18.5a1.5 1.5 0 0 1-1.5-1.5a1.5 1.5 0 0 1 1.5-1.5a1.5 1.5 0 0 1 1.5 1.5a1.5 1.5 0 0 1-1.5 1.5m1.5-9l1.96 2.5H17V9.5M6 18.5A1.5 1.5 0 0 1 4.5 17A1.5 1.5 0 0 1 6 15.5A1.5 1.5 0 0 1 7.5 17A1.5 1.5 0 0 1 6 18.5M20 8h-3V4H3c-1.11 0-2 .89-2 2v11h2a3 3 0 0 0 3 3a3 3 0 0 0 3-3h6a3 3 0 0 0 3 3a3 3 0 0 0 3-3h2v-5l-3-4Z"/>
          </svg>
        </div>
        ${
          estaDesviado
            ? `<div style="
                position: absolute;
                top: -10px;
                right: -10px;
                width: 20px;
                height: 20px;
                background-color: #ef4444;
                border: 2px solid white;
                border-radius: 50%;
                animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              "></div>`
            : estaDetenido
              ? `<div style="
                  position: absolute;
                  top: -8px;
                  right: -8px;
                  width: 16px;
                  height: 16px;
                  background-color: #ef4444;
                  border: 2px solid white;
                  border-radius: 50%;
                  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                "></div>`
              : ''
        }
      </div>
    `,
    className: 'custom-camion-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });

  return (
    <Marker position={[posicion.latitud, posicion.longitud]} icon={iconoCamion}>
      <Popup>
        <div className="min-w-[200px]">
          <div className="font-bold text-lg mb-2">Camión {camionPlaca}</div>
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-semibold">Conductor:</span> {conductorNombre}
            </div>
            <div>
              <span className="font-semibold">Destino:</span> {clienteNombre}
            </div>
            <div>
              <span className="font-semibold">Velocidad:</span> {velocidadPromedio.toFixed(1)} km/h
            </div>
            <div>
              <span className="font-semibold">Estado:</span>{' '}
              <span className={
                estaDesviado ? 'text-red-600 font-semibold'
                  : estaDetenido ? 'text-orange-600 font-semibold'
                    : 'text-blue-600 font-semibold'
              }>
                {estaDesviado ? 'DESVIADO' : estaDetenido ? 'Detenido' : 'En movimiento'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {new Date(posicion.timestamp).toLocaleString('es-BO', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
