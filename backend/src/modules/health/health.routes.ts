import { FastifyInstance } from 'fastify';
import { testConnection as testPostgres } from '../../database/postgres/pool.js';
import { testConnection as testNeo4j } from '../../database/neo4j/driver.js';
import { env } from '../../config/env.js';
import os from 'os';

// Helper: Medir tiempo de ejecución de una función
const measureTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> => {
  const start = Date.now();
  const result = await fn();
  const time = Date.now() - start;
  return { result, time };
};

// Helper: Formatear bytes a formato legible
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

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

  // Health check detallado (incluye bases de datos, memoria, sistema)
  app.get('/health/detailed', async (_request, reply) => {
    // Medir tiempo de conexión a bases de datos
    const postgresCheck = await measureTime(testPostgres);
    const neo4jCheck = await measureTime(testNeo4j);

    const allOk = postgresCheck.result && neo4jCheck.result;

    // Métricas de memoria
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Métricas de sistema
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    return reply.code(allOk ? 200 : 503).send({
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: env.NODE_ENV,
      uptime: {
        process: Math.floor(process.uptime()),
        system: Math.floor(os.uptime()),
      },
      services: {
        postgresql: {
          status: postgresCheck.result ? 'ok' : 'error',
          responseTime: postgresCheck.time,
        },
        neo4j: {
          status: neo4jCheck.result ? 'ok' : 'error',
          responseTime: neo4jCheck.time,
        },
      },
      memory: {
        process: {
          rss: formatBytes(memUsage.rss),
          heapTotal: formatBytes(memUsage.heapTotal),
          heapUsed: formatBytes(memUsage.heapUsed),
          external: formatBytes(memUsage.external),
        },
        system: {
          total: formatBytes(totalMem),
          free: formatBytes(freeMem),
          used: formatBytes(usedMem),
          usagePercentage: Math.round((usedMem / totalMem) * 100),
        },
      },
      cpu: {
        cores: cpus.length,
        model: cpus[0]?.model || 'unknown',
        loadAverage: {
          '1min': loadAvg[0].toFixed(2),
          '5min': loadAvg[1].toFixed(2),
          '15min': loadAvg[2].toFixed(2),
        },
      },
    });
  });
};
