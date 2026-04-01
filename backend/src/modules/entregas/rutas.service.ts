import type { RutaCalculada, NodoRuta, SegmentoRuta } from '../../database/neo4j/queries.js';
import { pool } from '../../database/postgres/pool.js';

/**
 * Tipo para resultado de calculo de ruta
 */
export interface RutaCompleta {
  ruta_calculada: RutaCalculada;
  interseccion_destino: {
    id: string;
    nombre: string;
    latitud: number;
    longitud: number;
  };
  distancia_cliente_interseccion: number;
  distancia_total_km: number;
  tiempo_estimado_minutos: number;
  cliente: {
    id: number;
    razon_social: string;
    direccion: string;
    latitud: number;
    longitud: number;
  };
}

const OSRM_URL = 'http://localhost:5000';
const VELOCIDAD_PROMEDIO_KMH = 40;
const PLANTA_LAT = -17.38375972482226;
const PLANTA_LON = -66.15733157342568;

/**
 * Calcula la ruta completa desde la planta hasta la ubicacion de entrega de un pedido
 *
 * FLUJO:
 * 1. Obtener coordenadas de entrega del pedido desde PostgreSQL
 * 2. Encontrar interseccion mas cercana a la ubicacion de entrega en Neo4j
 * 3. Calcular ruta desde planta a interseccion en Neo4j
 * 4. Calcular distancia desde interseccion al destino final (linea recta)
 * 5. Sumar distancias y calcular tiempo estimado
 *
 * @param pedido_id - ID del pedido en PostgreSQL
 * @returns Ruta completa con todos los detalles
 */
export async function calcularRutaHastaPedido(pedido_id: number): Promise<RutaCompleta> {
  // PASO 1: Obtener coordenadas de entrega del pedido desde PostgreSQL
  const pedidoResult = await pool.query(
    `SELECT p.id, p.direccion_entrega, p.latitud_entrega, p.longitud_entrega,
            c.razon_social, c.id as cliente_id
     FROM pedidos p
     JOIN clientes c ON p.cliente_id = c.id
     WHERE p.id = $1`,
    [pedido_id]
  );

  if (pedidoResult.rows.length === 0) {
    throw new Error(`Pedido con ID ${pedido_id} no encontrado`);
  }

  const pedido = pedidoResult.rows[0];

  if (!pedido.latitud_entrega || !pedido.longitud_entrega) {
    throw new Error(`Pedido ${pedido_id} no tiene coordenadas de entrega configuradas`);
  }

  // Convertir coordenadas a numeros (PostgreSQL NUMERIC retorna strings)
  const latitud = parseFloat(pedido.latitud_entrega);
  const longitud = parseFloat(pedido.longitud_entrega);

  // PASO 2: Calcular ruta usando OSRM (respeta sentidos, geometria real de calles)
  // OSRM usa formato longitud,latitud (inverso a lat,lon)
  const osrmUrl = `${OSRM_URL}/route/v1/driving/${PLANTA_LON},${PLANTA_LAT};${longitud},${latitud}?overview=full&geometries=geojson&steps=true`;

  const osrmResponse = await fetch(osrmUrl);

  if (!osrmResponse.ok) {
    throw new Error(`Error al calcular ruta con OSRM: ${osrmResponse.statusText}`);
  }

  const osrmData = await osrmResponse.json() as any;

  if (osrmData.code !== 'Ok' || !osrmData.routes || osrmData.routes.length === 0) {
    throw new Error(`OSRM no encontro ruta hacia: ${pedido.direccion_entrega}`);
  }

  const route = osrmData.routes[0];
  const coordinates = route.geometry.coordinates as [number, number][];

  // PASO 3: Convertir respuesta OSRM a estructura RutaCalculada compatible
  // OSRM devuelve [longitud, latitud], convertimos a nuestro formato
  const nodos: NodoRuta[] = coordinates.map((coord, index) => ({
    id: `OSRM_${index}`,
    nombre: index === 0 ? 'Planta Agregados Zambrana' : index === coordinates.length - 1 ? 'Destino' : `Punto ${index}`,
    tipo: index === 0 ? 'planta' : index === coordinates.length - 1 ? 'cliente' : 'interseccion',
    latitud: coord[1],
    longitud: coord[0]
  }));

  // Construir segmentos entre nodos consecutivos
  const segmentos: SegmentoRuta[] = [];
  for (let i = 0; i < nodos.length - 1; i++) {
    const nodoA = nodos[i]!;
    const nodoB = nodos[i + 1]!;
    const distKm = calcularDistanciaHaversine(
      nodoA.latitud, nodoA.longitud,
      nodoB.latitud, nodoB.longitud
    );
    segmentos.push({
      origen: nodoA.id,
      destino: nodoB.id,
      distancia_km: distKm,
      tiempo_minutos: (distKm / VELOCIDAD_PROMEDIO_KMH) * 60
    });
  }

  // OSRM devuelve distancia en metros y duracion en segundos
  const distanciaTotalKm = route.distance / 1000;
  const tiempoTotalMinutos = route.duration / 60;

  const rutaCalculada: RutaCalculada = {
    nodos,
    segmentos,
    distancia_total_km: distanciaTotalKm,
    tiempo_total_minutos: tiempoTotalMinutos
  };

  return {
    ruta_calculada: rutaCalculada,
    interseccion_destino: {
      id: 'OSRM_DESTINO',
      nombre: pedido.direccion_entrega,
      latitud: latitud,
      longitud: longitud
    },
    distancia_cliente_interseccion: 0,
    distancia_total_km: distanciaTotalKm,
    tiempo_estimado_minutos: tiempoTotalMinutos,
    cliente: {
      id: pedido.cliente_id,
      razon_social: pedido.razon_social,
      direccion: pedido.direccion_entrega,
      latitud: latitud,
      longitud: longitud
    }
  };
}

/**
 * Calcula la distancia entre dos puntos GPS usando la formula de Haversine
 *
 * Formula matematica para calcular distancia en superficie esferica
 * Mas precisa que calcular distancia euclidiana
 *
 * @param lat1 - Latitud del punto 1
 * @param lon1 - Longitud del punto 1
 * @param lat2 - Latitud del punto 2
 * @param lon2 - Longitud del punto 2
 * @returns Distancia en kilometros
 */
export function calcularDistanciaHaversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km

  const dLat = gradosARadianes(lat2 - lat1);
  const dLon = gradosARadianes(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(gradosARadianes(lat1)) *
    Math.cos(gradosARadianes(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convierte grados a radianes
 */
function gradosARadianes(grados: number): number {
  return grados * (Math.PI / 180);
}

/**
 * Calcula la distancia recorrida vs distancia esperada
 *
 * Uso: Detectar rutas sospechosas (ej: distancia recorrida >> distancia esperada)
 *
 * @param distancia_recorrida_km - Distancia real recorrida segun GPS
 * @param distancia_esperada_km - Distancia de la ruta calculada
 * @returns Porcentaje de desviacion (0.0 = sin desviacion, 0.5 = 50% mas largo)
 */
export function calcularDesviacionRuta(
  distancia_recorrida_km: number,
  distancia_esperada_km: number
): number {
  if (distancia_esperada_km === 0) {
    return 0;
  }

  const desviacion = (distancia_recorrida_km - distancia_esperada_km) / distancia_esperada_km;

  return Math.max(0, desviacion);
}

/**
 * Calcula el tiempo estimado de llegada basado en la posicion actual
 *
 * Uso: Actualizar ETA en tiempo real mientras el camion se mueve
 *
 * @param latitud_actual - Latitud actual del GPS
 * @param longitud_actual - Longitud actual del GPS
 * @param latitud_destino - Latitud del destino final (cliente)
 * @param longitud_destino - Longitud del destino final (cliente)
 * @param velocidad_promedio_kmh - Velocidad promedio del camion (default: 40 km/h)
 * @returns Tiempo estimado en minutos
 */
export function calcularTiempoEstimadoLlegada(
  latitud_actual: number,
  longitud_actual: number,
  latitud_destino: number,
  longitud_destino: number,
  velocidad_promedio_kmh: number = VELOCIDAD_PROMEDIO_KMH
): number {
  const distanciaRestante = calcularDistanciaHaversine(
    latitud_actual,
    longitud_actual,
    latitud_destino,
    longitud_destino
  );

  const tiempoHoras = distanciaRestante / velocidad_promedio_kmh;

  return tiempoHoras * 60;
}

/**
 * Detecta si el camion esta detenido en base a las ultimas posiciones GPS
 *
 * Uso: Alertar si el camion lleva mucho tiempo sin moverse
 *
 * @param velocidad_promedio_kmh - Velocidad promedio de las ultimas posiciones
 * @param umbral_kmh - Umbral para considerar detenido (default: 5 km/h)
 * @returns true si esta detenido
 */
export function estaDetenido(
  velocidad_promedio_kmh: number,
  umbral_kmh: number = 5
): boolean {
  return velocidad_promedio_kmh < umbral_kmh;
}

// Factores de conversion a metros para latitud de Cochabamba (~-17.39)
const METROS_POR_GRADO_LAT = 111139;
const METROS_POR_GRADO_LON = 111139 * Math.cos((-17.39 * Math.PI) / 180); // ~106100m

// Calcula distancia perpendicular de un punto a un segmento (A->B)
// Usa aproximacion plana (flat-earth) valida para distancias cortas en Cochabamba
// Retorna distancia en kilometros
function distanciaPuntoASegmento(
  puntoLat: number,
  puntoLon: number,
  segALat: number,
  segALon: number,
  segBLat: number,
  segBLon: number
): number {
  // Convertir a metros locales
  const px = (puntoLon - segALon) * METROS_POR_GRADO_LON;
  const py = (puntoLat - segALat) * METROS_POR_GRADO_LAT;
  const bx = (segBLon - segALon) * METROS_POR_GRADO_LON;
  const by = (segBLat - segALat) * METROS_POR_GRADO_LAT;

  // Longitud del segmento al cuadrado
  const segLenSq = bx * bx + by * by;

  // Si el segmento es un punto, retornar distancia directa
  if (segLenSq === 0) {
    const dist = Math.sqrt(px * px + py * py);
    return dist / 1000;
  }

  // Proyeccion del punto sobre el segmento, clampeado a [0,1]
  const t = Math.max(0, Math.min(1, (px * bx + py * by) / segLenSq));

  // Punto mas cercano en el segmento
  const closestX = t * bx;
  const closestY = t * by;

  // Distancia al punto mas cercano
  const dx = px - closestX;
  const dy = py - closestY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  return dist / 1000;
}

/**
 * Calcula la distancia minima desde un punto GPS a la ruta planificada
 *
 * @param lat - Latitud del punto GPS
 * @param lon - Longitud del punto GPS
 * @param nodos - Array de nodos de la ruta con latitud y longitud
 * @returns Distancia minima en kilometros
 */
export function calcularDistanciaDesdeRuta(
  lat: number,
  lon: number,
  nodos: Array<{ latitud: number; longitud: number }>
): number {
  if (nodos.length < 2) return 0;

  let distanciaMinima = Infinity;

  for (let i = 0; i < nodos.length - 1; i++) {
    const nodoA = nodos[i]!;
    const nodoB = nodos[i + 1]!;
    const dist = distanciaPuntoASegmento(
      lat,
      lon,
      nodoA.latitud,
      nodoA.longitud,
      nodoB.latitud,
      nodoB.longitud
    );
    if (dist < distanciaMinima) {
      distanciaMinima = dist;
    }
  }

  return distanciaMinima;
}

