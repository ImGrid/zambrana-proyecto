import { Polyline } from 'react-leaflet';
import { MAPA_COLORES, POLYLINE_CONFIG } from '../constants/mapa.constants';
import type { PosicionGPS } from '../types/gps.types';

interface RutaRecorridaProps {
  posiciones: PosicionGPS[];
}

// Componente para mostrar la ruta que ha recorrido el camión
// Dibuja una polyline con las posiciones GPS registradas
export function RutaRecorrida({ posiciones }: RutaRecorridaProps) {
  // Ordenar posiciones por timestamp
  const posicionesOrdenadas = [...posiciones].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Convertir a formato [lat, lng]
  const coordenadas: [number, number][] = posicionesOrdenadas.map((pos) => [
    pos.latitud,
    pos.longitud,
  ]);

  // Si no hay suficientes posiciones, no renderizar nada
  if (coordenadas.length < 2) {
    return null;
  }

  return (
    <Polyline
      positions={coordenadas}
      pathOptions={{
        color: MAPA_COLORES.rutaRecorrida,
        weight: POLYLINE_CONFIG.peso,
        opacity: POLYLINE_CONFIG.opacidad,
        lineJoin: POLYLINE_CONFIG.lineJoin,
        lineCap: POLYLINE_CONFIG.lineCap,
      }}
    />
  );
}
