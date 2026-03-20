import { pool } from '../../database/postgres/pool.js';

/**
 * Tipos para posiciones GPS
 */
export interface PosicionGPS {
  id: number;
  entrega_id: number;
  conductor_id: number;
  camion_id: number;
  latitud: number;
  longitud: number;
  velocidad_kmh: number | null;
  direccion_grados: number | null;
  precision_metros: number | null;
  timestamp: Date;
}

/**
 * Inserta una nueva posición GPS en la tabla particionada
 *
 * IMPORTANTE: Esta funcion se ejecuta cada 10 segundos por cada camion
 * Debe ser MUY eficiente
 *
 * @param entrega_id - ID de la entrega
 * @param conductor_id - ID del conductor
 * @param camion_id - ID del camion
 * @param latitud - Latitud del GPS
 * @param longitud - Longitud del GPS
 * @param velocidad_kmh - Velocidad en km/h (opcional)
 * @param direccion_grados - Dirección en grados (opcional)
 * @param precision_metros - Precisión del GPS en metros (opcional)
 * @param timestamp - Timestamp del GPS (opcional, usa NOW() si no se proporciona)
 */
export async function insertarPosicionGPS(
  entrega_id: number,
  conductor_id: number,
  camion_id: number,
  latitud: number,
  longitud: number,
  velocidad_kmh?: number,
  direccion_grados?: number,
  precision_metros?: number,
  timestamp?: Date
): Promise<void> {
  await pool.query(
    `INSERT INTO posiciones_gps (
      entrega_id,
      conductor_id,
      camion_id,
      latitud,
      longitud,
      velocidad_kmh,
      direccion_grados,
      precision_metros,
      timestamp
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW()))`,
    [
      entrega_id,
      conductor_id,
      camion_id,
      latitud,
      longitud,
      velocidad_kmh ?? null,
      direccion_grados ?? null,
      precision_metros ?? null,
      timestamp ?? null,
    ]
  );
}

/**
 * Obtiene la última posición GPS de una entrega
 *
 * Uso: Saber dónde está el camión AHORA
 *
 * @param entrega_id - ID de la entrega
 * @returns Última posición GPS o null si no hay
 */
export async function obtenerUltimaPosicion(entrega_id: number): Promise<PosicionGPS | null> {
  const result = await pool.query<PosicionGPS>(
    `SELECT
      id,
      entrega_id,
      conductor_id,
      camion_id,
      latitud,
      longitud,
      velocidad_kmh,
      direccion_grados,
      precision_metros,
      timestamp
    FROM posiciones_gps
    WHERE entrega_id = $1
    ORDER BY timestamp DESC
    LIMIT 1`,
    [entrega_id]
  );

  return result.rows[0] ?? null;
}

/**
 * Obtiene las posiciones GPS de una entrega con paginación
 *
 * Uso: Historial de tracking, mostrar ruta completa
 *
 * @param entrega_id - ID de la entrega
 * @param limite - Número máximo de posiciones (default: 100)
 * @param offset - Offset para paginación (default: 0)
 * @returns Array de posiciones GPS
 */
export async function obtenerPosicionesEntrega(
  entrega_id: number,
  limite: number = 100,
  offset: number = 0
): Promise<PosicionGPS[]> {
  const result = await pool.query<PosicionGPS>(
    `SELECT
      id,
      entrega_id,
      conductor_id,
      camion_id,
      latitud,
      longitud,
      velocidad_kmh,
      direccion_grados,
      precision_metros,
      timestamp
    FROM posiciones_gps
    WHERE entrega_id = $1
    ORDER BY timestamp DESC
    LIMIT $2
    OFFSET $3`,
    [entrega_id, limite, offset]
  );

  return result.rows;
}

/**
 * Cuenta el total de posiciones GPS de una entrega
 *
 * Uso: Para paginación
 *
 * @param entrega_id - ID de la entrega
 * @returns Total de posiciones registradas
 */
export async function contarPosicionesEntrega(entrega_id: number): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count
    FROM posiciones_gps
    WHERE entrega_id = $1`,
    [entrega_id]
  );

  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Calcula la distancia total recorrida por el camión
 * Suma las distancias entre puntos GPS consecutivos
 *
 * Uso: Métricas al finalizar entrega
 *
 * @param entrega_id - ID de la entrega
 * @returns Distancia total en kilómetros
 */
export async function calcularDistanciaRecorrida(entrega_id: number): Promise<number> {
  const result = await pool.query<{ distancia_total_km: number }>(
    `SELECT
      COALESCE(SUM(distancia_segmento) / 1000, 0) as distancia_total_km
    FROM (
      SELECT
        ST_Distance(
          ST_MakePoint(longitud, latitud)::geography,
          ST_MakePoint(
            LAG(longitud) OVER (ORDER BY timestamp),
            LAG(latitud) OVER (ORDER BY timestamp)
          )::geography
        ) as distancia_segmento
      FROM posiciones_gps
      WHERE entrega_id = $1
    ) AS segmentos
    WHERE distancia_segmento IS NOT NULL`,
    [entrega_id]
  );

  return result.rows[0]?.distancia_total_km || 0;
}

/**
 * Obtiene la velocidad promedio de los últimos N minutos
 *
 * Uso: Detectar si el camión está atascado (velocidad muy baja)
 *
 * @param entrega_id - ID de la entrega
 * @param minutos - Ventana de tiempo en minutos (default: 10)
 * @returns Velocidad promedio en km/h
 */
export async function calcularVelocidadPromedio(
  entrega_id: number,
  minutos: number = 10
): Promise<number> {
  const result = await pool.query<{ velocidad_promedio: number }>(
    `SELECT
      COALESCE(AVG(velocidad_kmh), 0) as velocidad_promedio
    FROM posiciones_gps
    WHERE entrega_id = $1
      AND velocidad_kmh IS NOT NULL
      AND timestamp >= NOW() - $2 * INTERVAL '1 minute'`,
    [entrega_id, minutos]
  );

  return result.rows[0]?.velocidad_promedio || 0;
}

/**
 * Obtiene las posiciones GPS en un rango de fechas
 *
 * Uso: Análisis histórico, reportes
 *
 * @param entrega_id - ID de la entrega
 * @param fecha_desde - Fecha inicio
 * @param fecha_hasta - Fecha fin
 * @returns Array de posiciones GPS en el rango
 */
export async function obtenerPosicionesPorRango(
  entrega_id: number,
  fecha_desde: Date,
  fecha_hasta: Date
): Promise<PosicionGPS[]> {
  const result = await pool.query<PosicionGPS>(
    `SELECT
      id,
      entrega_id,
      conductor_id,
      camion_id,
      latitud,
      longitud,
      velocidad_kmh,
      direccion_grados,
      precision_metros,
      timestamp
    FROM posiciones_gps
    WHERE entrega_id = $1
      AND timestamp BETWEEN $2 AND $3
    ORDER BY timestamp ASC`,
    [entrega_id, fecha_desde, fecha_hasta]
  );

  return result.rows;
}
