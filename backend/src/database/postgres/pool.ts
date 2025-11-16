import { Pool, types } from 'pg';
import { env } from '../../config/env.js';

/**
 * Pool de conexiones a PostgreSQL
 * IMPORTANTE: 1 pool por aplicación (no crear múltiples instancias)
 */
export const pool = new Pool({
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,

  // Parámetros optimizados según investigación
  max: 20, // Máximo 20 conexiones simultáneas
  idleTimeoutMillis: 30000, // Cerrar conexiones inactivas después de 30s
  connectionTimeoutMillis: 2000, // Timeout al obtener conexión del pool
});

// Configurar parser para tipo NUMERIC (OID 1700)
// Por defecto pg retorna NUMERIC como string para preservar precisión
// Como nuestros valores numéricos están dentro del rango seguro de JavaScript,
// configuramos el parser para convertir automáticamente a number
types.setTypeParser(1700, (val: string) => parseFloat(val));

// Manejar errores del pool
pool.on('error', (err) => {
  console.error('Error inesperado en pool de PostgreSQL:', err);
  process.exit(-1);
});

/**
 * Verificar conexión a PostgreSQL
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, current_database() as database');
    console.log('PostgreSQL conectado:', {
      database: result.rows[0]?.database,
      timestamp: result.rows[0]?.now,
    });
    client.release();
    return true;
  } catch (error) {
    console.error('Error al conectar con PostgreSQL:', error);
    return false;
  }
};

/**
 * Cerrar el pool de conexiones
 */
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('Pool de PostgreSQL cerrado');
};
