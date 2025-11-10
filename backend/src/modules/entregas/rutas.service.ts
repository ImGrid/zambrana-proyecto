import {
  encontrarInterseccionCercana,
  calcularRutaOptima,
  InterseccionCercana,
  RutaCalculada
} from '../../database/neo4j/queries.js';
import { pool } from '../../database/postgres/pool.js';

/**
 * Tipo para resultado de calculo de ruta
 */
export interface RutaCompleta {
  ruta_calculada: RutaCalculada;
  interseccion_destino: InterseccionCercana;
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

const PLANTA_QUILLACOLLO_ID = 'PLANTA_QUILLACOLLO';
const VELOCIDAD_PROMEDIO_KMH = 40;

/**
 * Calcula la ruta completa desde la planta hasta un cliente
 *
 * FLUJO:
 * 1. Obtener coordenadas del cliente desde PostgreSQL
 * 2. Encontrar interseccion mas cercana al cliente en Neo4j
 * 3. Calcular ruta desde planta a interseccion en Neo4j
 * 4. Calcular distancia desde interseccion al cliente (linea recta)
 * 5. Sumar distancias y calcular tiempo estimado
 *
 * @param cliente_id - ID del cliente en PostgreSQL
 * @returns Ruta completa con todos los detalles
 */
export async function calcularRutaHastaCliente(cliente_id: number): Promise<RutaCompleta> {
  // PASO 1: Obtener coordenadas del cliente desde PostgreSQL
  const clienteResult = await pool.query(
    `SELECT id, razon_social, direccion, latitud, longitud
     FROM clientes
     WHERE id = $1`,
    [cliente_id]
  );

  if (clienteResult.rows.length === 0) {
    throw new Error(`Cliente con ID ${cliente_id} no encontrado`);
  }

  const cliente = clienteResult.rows[0];

  if (!cliente.latitud || !cliente.longitud) {
    throw new Error(`Cliente ${cliente.razon_social} no tiene coordenadas GPS configuradas`);
  }

  // PASO 2: Encontrar interseccion mas cercana al cliente en Neo4j
  const interseccionDestino = await encontrarInterseccionCercana(
    cliente.latitud,
    cliente.longitud
  );

  if (!interseccionDestino) {
    throw new Error(
      `No se encontro ninguna interseccion cercana al cliente ${cliente.razon_social}. ` +
      `Verifica que el grafo Neo4j este sincronizado.`
    );
  }

  // PASO 3: Calcular ruta desde planta a interseccion en Neo4j
  const rutaCalculada = await calcularRutaOptima(
    PLANTA_QUILLACOLLO_ID,
    interseccionDestino.id
  );

  if (!rutaCalculada) {
    throw new Error(
      `No se encontro ruta desde la planta hasta ${interseccionDestino.nombre}. ` +
      `Verifica que el grafo Neo4j este conectado correctamente.`
    );
  }

  // PASO 4: Calcular distancia desde interseccion al cliente
  // Usamos formula de Haversine para distancia entre dos puntos GPS
  const distanciaInterseccionCliente = calcularDistanciaHaversine(
    interseccionDestino.latitud,
    interseccionDestino.longitud,
    cliente.latitud,
    cliente.longitud
  );

  // PASO 5: Sumar distancias totales y calcular tiempo estimado
  const distanciaTotal = rutaCalculada.distancia_total_km + distanciaInterseccionCliente;

  // Tiempo: usar tiempo_total_minutos de Neo4j + tiempo adicional al cliente
  const tiempoAdicionalMinutos = (distanciaInterseccionCliente / VELOCIDAD_PROMEDIO_KMH) * 60;
  const tiempoTotal = rutaCalculada.tiempo_total_minutos + tiempoAdicionalMinutos;

  return {
    ruta_calculada: rutaCalculada,
    interseccion_destino: interseccionDestino,
    distancia_cliente_interseccion: distanciaInterseccionCliente,
    distancia_total_km: distanciaTotal,
    tiempo_estimado_minutos: tiempoTotal,
    cliente: {
      id: cliente.id,
      razon_social: cliente.razon_social,
      direccion: cliente.direccion,
      latitud: cliente.latitud,
      longitud: cliente.longitud
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
function calcularDistanciaHaversine(
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
 * Valida si una posicion GPS esta cerca de la ruta calculada
 *
 * Uso: Detectar desviaciones del camion durante la entrega
 *
 * @param latitud - Latitud actual del GPS
 * @param longitud - Longitud actual del GPS
 * @param ruta - Ruta calculada previamente
 * @param tolerancia_km - Distancia maxima aceptable de desviacion (default: 1 km)
 * @returns true si esta dentro de la tolerancia
 */
export function validarPosicionCercaDeRuta(
  latitud: number,
  longitud: number,
  ruta: RutaCalculada,
  tolerancia_km: number = 1.0
): boolean {
  // Verificar distancia a cada nodo de la ruta
  for (const nodo of ruta.nodos) {
    const distancia = calcularDistanciaHaversine(
      latitud,
      longitud,
      nodo.latitud,
      nodo.longitud
    );

    if (distancia <= tolerancia_km) {
      return true;
    }
  }

  return false;
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

/**
 * Obtiene informacion de puntos de interes cercanos a una posicion
 *
 * Uso futuro: Detectar si el camion esta en zona de obras, trafico, etc
 * Por ahora retorna los nodos de la ruta que estan cerca
 *
 * @param latitud - Latitud de la posicion
 * @param longitud - Longitud de la posicion
 * @param ruta - Ruta calculada
 * @param radio_km - Radio de busqueda en kilometros
 * @returns Array de nodos cercanos
 */
export function obtenerPuntosInteresesCercanos(
  latitud: number,
  longitud: number,
  ruta: RutaCalculada,
  radio_km: number = 2.0
): Array<{
  nodo: {
    id: string;
    nombre: string;
    tipo: string;
    latitud: number;
    longitud: number;
  };
  distancia_km: number;
}> {
  const puntosInteres = [];

  for (const nodo of ruta.nodos) {
    const distancia = calcularDistanciaHaversine(
      latitud,
      longitud,
      nodo.latitud,
      nodo.longitud
    );

    if (distancia <= radio_km) {
      puntosInteres.push({
        nodo,
        distancia_km: distancia
      });
    }
  }

  // Ordenar por distancia ascendente
  return puntosInteres.sort((a, b) => a.distancia_km - b.distancia_km);
}
