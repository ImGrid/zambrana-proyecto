import { getSession } from './driver.js';

/**
 * Tipos de retorno de las consultas Neo4j
 */

export interface InterseccionCercana {
  id: string;
  nombre: string;
  tipo: string;
  latitud: number;
  longitud: number;
  distancia_metros: number;
}

export interface NodoRuta {
  id: string;
  nombre: string;
  tipo: string;
  latitud: number;
  longitud: number;
}

export interface SegmentoRuta {
  origen: string;
  destino: string;
  distancia_km: number;
  tiempo_minutos: number;
}

export interface RutaCalculada {
  nodos: NodoRuta[];
  segmentos: SegmentoRuta[];
  distancia_total_km: number;
  tiempo_total_minutos: number;
}

/**
 * Encuentra la intersección más cercana a unas coordenadas dadas
 *
 * Uso: Cuando un cliente está en (lat, lng), encontrar qué nodo del grafo está más cerca
 *
 * @param latitud - Latitud del punto de destino (cliente)
 * @param longitud - Longitud del punto de destino (cliente)
 * @returns Intersección más cercana con su distancia en metros
 */
export async function encontrarInterseccionCercana(
  latitud: number,
  longitud: number
): Promise<InterseccionCercana | null> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (n:Ubicacion {tipo: 'interseccion'})
      WITH n, point.distance(
        point({latitude: $lat, longitude: $lng}),
        point({latitude: n.latitud, longitude: n.longitud})
      ) as dist
      RETURN
        n.id as id,
        n.nombre as nombre,
        n.tipo as tipo,
        n.latitud as latitud,
        n.longitud as longitud,
        dist as distancia_metros
      ORDER BY dist ASC
      LIMIT 1
      `,
      { lat: latitud, lng: longitud }
    );

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    return {
      id: record.get('id'),
      nombre: record.get('nombre'),
      tipo: record.get('tipo'),
      latitud: record.get('latitud'),
      longitud: record.get('longitud'),
      distancia_metros: record.get('distancia_metros')
    };
  } finally {
    await session.close();
  }
}

/**
 * Calcula la ruta óptima (más corta) entre dos nodos del grafo
 *
 * Uso: Calcular ruta de Planta Agregados Zambrana a Intersección cercana al cliente
 *
 * @param origenId - ID del nodo origen (ej: "PLANTA_AGREGADOS_ZAMBRANA")
 * @param destinoId - ID del nodo destino (ej: "INTER_BLANCO_GALINDO")
 * @returns Ruta calculada con nodos, segmentos y totales
 */
export async function calcularRutaOptima(
  origenId: string,
  destinoId: string
): Promise<RutaCalculada | null> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (origen:Ubicacion {id: $origenId}),
            (destino:Ubicacion {id: $destinoId}),
            path = shortestPath((origen)-[:CONECTA_CON*]-(destino))
      WITH path,
           nodes(path) as nodos,
           relationships(path) as relaciones
      RETURN
        nodos,
        relaciones,
        reduce(dist = 0, r in relaciones | dist + r.distancia_km) as distancia_total,
        reduce(tiempo = 0, r in relaciones | tiempo + r.tiempo_minutos) as tiempo_total
      `,
      { origenId, destinoId }
    );

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    const nodosRaw = record.get('nodos');
    const relacionesRaw = record.get('relaciones');

    // Convertir nodos a formato tipado
    const nodos: NodoRuta[] = nodosRaw.map((nodo: any) => ({
      id: nodo.properties.id,
      nombre: nodo.properties.nombre,
      tipo: nodo.properties.tipo,
      latitud: nodo.properties.latitud,
      longitud: nodo.properties.longitud
    }));

    // Convertir relaciones a segmentos
    const segmentos: SegmentoRuta[] = [];
    for (let i = 0; i < relacionesRaw.length; i++) {
      const rel = relacionesRaw[i];
      const nodoOrigen = nodosRaw[i];
      const nodoDestino = nodosRaw[i + 1];

      segmentos.push({
        origen: nodoOrigen.properties.id,
        destino: nodoDestino.properties.id,
        distancia_km: rel.properties.distancia_km,
        tiempo_minutos: rel.properties.tiempo_minutos
      });
    }

    return {
      nodos,
      segmentos,
      distancia_total_km: record.get('distancia_total'),
      tiempo_total_minutos: record.get('tiempo_total')
    };
  } finally {
    await session.close();
  }
}

/**
 * Obtiene información completa de un nodo por su ID
 *
 * Uso: Para debugging o mostrar información detallada
 *
 * @param nodoId - ID del nodo a buscar
 * @returns Información del nodo o null si no existe
 */
export async function obtenerInformacionNodo(
  nodoId: string
): Promise<NodoRuta | null> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (n:Ubicacion {id: $nodoId})
      RETURN
        n.id as id,
        n.nombre as nombre,
        n.tipo as tipo,
        n.latitud as latitud,
        n.longitud as longitud
      `,
      { nodoId }
    );

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    return {
      id: record.get('id'),
      nombre: record.get('nombre'),
      tipo: record.get('tipo'),
      latitud: record.get('latitud'),
      longitud: record.get('longitud')
    };
  } finally {
    await session.close();
  }
}

/**
 * Calcula rutas alternativas entre dos nodos
 *
 * Uso: Si hay desviación, mostrar rutas alternativas
 * OPCIONAL: No es crítico para MVP
 *
 * @param origenId - ID del nodo origen
 * @param destinoId - ID del nodo destino
 * @param limite - Número máximo de rutas a devolver (default: 3)
 * @returns Array de rutas calculadas ordenadas por distancia
 */
export async function calcularRutasAlternativas(
  origenId: string,
  destinoId: string,
  limite: number = 3
): Promise<RutaCalculada[]> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (origen:Ubicacion {id: $origenId}),
            (destino:Ubicacion {id: $destinoId}),
            path = allShortestPaths((origen)-[:CONECTA_CON*]-(destino))
      WITH path,
           nodes(path) as nodos,
           relationships(path) as relaciones,
           reduce(dist = 0, r in relationships(path) | dist + r.distancia_km) as distancia
      ORDER BY distancia ASC
      LIMIT $limite
      RETURN
        nodos,
        relaciones,
        distancia as distancia_total,
        reduce(tiempo = 0, r in relaciones | tiempo + r.tiempo_minutos) as tiempo_total
      `,
      { origenId, destinoId, limite }
    );

    const rutas: RutaCalculada[] = [];

    for (const record of result.records) {
      const nodosRaw = record.get('nodos');
      const relacionesRaw = record.get('relaciones');

      const nodos: NodoRuta[] = nodosRaw.map((nodo: any) => ({
        id: nodo.properties.id,
        nombre: nodo.properties.nombre,
        tipo: nodo.properties.tipo,
        latitud: nodo.properties.latitud,
        longitud: nodo.properties.longitud
      }));

      const segmentos: SegmentoRuta[] = [];
      for (let i = 0; i < relacionesRaw.length; i++) {
        const rel = relacionesRaw[i];
        const nodoOrigen = nodosRaw[i];
        const nodoDestino = nodosRaw[i + 1];

        segmentos.push({
          origen: nodoOrigen.properties.id,
          destino: nodoDestino.properties.id,
          distancia_km: rel.properties.distancia_km,
          tiempo_minutos: rel.properties.tiempo_minutos
        });
      }

      rutas.push({
        nodos,
        segmentos,
        distancia_total_km: record.get('distancia_total'),
        tiempo_total_minutos: record.get('tiempo_total')
      });
    }

    return rutas;
  } finally {
    await session.close();
  }
}

/**
 * Obtiene todos los nodos de un tipo específico
 *
 * Uso: Para listados o debugging
 *
 * @param tipo - Tipo de nodo: 'planta', 'interseccion', 'cliente'
 * @returns Array de nodos del tipo especificado
 */
export async function obtenerNodosPorTipo(
  tipo: string
): Promise<NodoRuta[]> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (n:Ubicacion {tipo: $tipo})
      RETURN
        n.id as id,
        n.nombre as nombre,
        n.tipo as tipo,
        n.latitud as latitud,
        n.longitud as longitud
      ORDER BY n.nombre
      `,
      { tipo }
    );

    return result.records.map(record => ({
      id: record.get('id'),
      nombre: record.get('nombre'),
      tipo: record.get('tipo'),
      latitud: record.get('latitud'),
      longitud: record.get('longitud')
    }));
  } finally {
    await session.close();
  }
}

/**
 * Verifica si existe conectividad entre dos nodos
 *
 * Uso: Validar que es posible calcular ruta antes de intentarlo
 *
 * @param origenId - ID del nodo origen
 * @param destinoId - ID del nodo destino
 * @returns true si existe al menos un camino entre los nodos
 */
export async function existeRutaEntre(
  origenId: string,
  destinoId: string
): Promise<boolean> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (origen:Ubicacion {id: $origenId}),
            (destino:Ubicacion {id: $destinoId})
      RETURN EXISTS((origen)-[:CONECTA_CON*]-(destino)) as existe
      `,
      { origenId, destinoId }
    );

    if (result.records.length === 0) {
      return false;
    }

    return result.records[0].get('existe');
  } finally {
    await session.close();
  }
}
