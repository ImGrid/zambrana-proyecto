import neo4j, { Driver, Session } from 'neo4j-driver';
import { env } from '../../config/env.js';

/**
 * Driver de Neo4j
 * IMPORTANTE: 1 driver por aplicación (singleton)
 */
let driver: Driver | null = null;

/**
 * Obtener driver de Neo4j
 */
export const getDriver = (): Driver => {
  if (!driver) {
    driver = neo4j.driver(env.NEO4J_URI, neo4j.auth.basic(env.NEO4J_USER, env.NEO4J_PASSWORD), {
      // Configuración opcional
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 60000, // 60 segundos
    });
  }
  return driver;
};

/**
 * Obtener sesión de Neo4j
 * IMPORTANTE: SIEMPRE cerrar la sesión después de usarla
 *
 * Uso recomendado:
 * ```typescript
 * const session = getSession();
 * try {
 *   const result = await session.run(query, params);
 *   // procesar resultado
 * } finally {
 *   await session.close();
 * }
 * ```
 */
export const getSession = (): Session => {
  const driver = getDriver();
  return driver.session();
};

/**
 * Verificar conexión a Neo4j
 */
export const testConnection = async (): Promise<boolean> => {
  const session = getSession();
  try {
    const result = await session.run('RETURN 1 as num, datetime() as timestamp');
    const record = result.records[0];

    // Tipar explícitamente los valores de Neo4j para evitar errores de tipo 'any'
    const num = record?.get('num') as number;
    const timestamp = record?.get('timestamp') as { toString(): string };

    console.log('Neo4j conectado:', {
      num,
      timestamp: timestamp.toString(),
    });
    return true;
  } catch (error) {
    console.error('Error al conectar con Neo4j:', error);
    return false;
  } finally {
    await session.close();
  }
};

/**
 * Cerrar driver de Neo4j
 */
export const closeDriver = async (): Promise<void> => {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('Driver de Neo4j cerrado');
  }
};
