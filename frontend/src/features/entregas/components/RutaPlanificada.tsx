import { Polyline } from 'react-leaflet';
import { MAPA_COLORES, POLYLINE_CONFIG } from '../constants/mapa.constants';
import type { RutaCalculada } from '../types/entregas.types';

interface RutaPlanificadaProps {
  ruta: RutaCalculada;
}

// Componente para mostrar la ruta planificada calculada por Neo4j
// Dibuja una polyline con los nodos de la ruta calculada
export function RutaPlanificada({ ruta }: RutaPlanificadaProps) {
  // Convertir nodos a posiciones [lat, lng]
  const posiciones: [number, number][] = ruta.nodos
    .sort((a, b) => a.orden - b.orden)
    .map((nodo) => [nodo.latitud, nodo.longitud]);

  // Si no hay suficientes nodos, no renderizar nada
  if (posiciones.length < 2) {
    return null;
  }

  return (
    <Polyline
      positions={posiciones}
      pathOptions={{
        color: MAPA_COLORES.rutaPlanificada,
        weight: POLYLINE_CONFIG.peso,
        opacity: POLYLINE_CONFIG.opacidad,
        lineJoin: POLYLINE_CONFIG.lineJoin,
        lineCap: POLYLINE_CONFIG.lineCap,
        dashArray: '15, 8', // Línea punteada más visible (líneas largas, espacios cortos)
      }}
    />
  );
}
