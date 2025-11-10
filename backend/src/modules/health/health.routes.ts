import { FastifyInstance } from 'fastify';
import { testConnection as testPostgres } from '../../database/postgres/pool.js';
import { testConnection as testNeo4j } from '../../database/neo4j/driver.js';

/**
 * Rutas de health check
 */
export const healthRoutes = async (app: FastifyInstance) => {
  // Health check simple
  app.get('/health', async (_request, reply) => {
    return reply.code(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Health check detallado (incluye bases de datos)
  app.get('/health/detailed', async (_request, reply) => {
    const postgresOk = await testPostgres();
    const neo4jOk = await testNeo4j();

    const allOk = postgresOk && neo4jOk;

    return reply.code(allOk ? 200 : 503).send({
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        postgresql: postgresOk ? 'ok' : 'error',
        neo4j: neo4jOk ? 'ok' : 'error',
      },
    });
  });
};
