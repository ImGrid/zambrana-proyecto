import { buildApp } from './app.js';
import { env } from './config/env.js';
import { closePool } from './database/postgres/pool.js';
import { closeDriver } from './database/neo4j/driver.js';
import type { FastifyInstance } from 'fastify';

// Variable para prevenir múltiples cierres
let isShuttingDown = false;

// Timeout para graceful shutdown (30 segundos)
const SHUTDOWN_TIMEOUT = 30000;

/**
 * Graceful Shutdown
 * Cierra el servidor de forma ordenada:
 * 1. Deja de aceptar nuevos requests
 * 2. Espera a que terminen los requests en curso
 * 3. Cierra conexiones a bases de datos
 * 4. Sale del proceso
 */
const gracefulShutdown = async (signal: string, app: FastifyInstance): Promise<void> => {
  // Prevenir múltiples cierres simultáneos
  if (isShuttingDown) {
    console.log('Ya se está cerrando el servidor...');
    return;
  }

  isShuttingDown = true;
  console.log(`\n[${new Date().toISOString()}] Señal ${signal} recibida`);
  console.log('Iniciando graceful shutdown...\n');

  // Timeout de seguridad: si no termina en 30s, fuerza el cierre
  const shutdownTimeout = setTimeout(() => {
    console.error('⚠️  Timeout alcanzado, forzando cierre del servidor');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    // Paso 1: Cerrar servidor HTTP (no acepta nuevos requests, espera requests en curso)
    console.log('1/3 Cerrando servidor HTTP...');
    await app.close();
    console.log('✓ Servidor HTTP cerrado exitosamente');

    // Paso 2: Cerrar pool de PostgreSQL
    console.log('2/3 Cerrando conexiones a PostgreSQL...');
    await closePool();
    console.log('✓ PostgreSQL cerrado exitosamente');

    // Paso 3: Cerrar driver de Neo4j
    console.log('3/3 Cerrando conexiones a Neo4j...');
    await closeDriver();
    console.log('✓ Neo4j cerrado exitosamente');

    // Limpiar timeout
    clearTimeout(shutdownTimeout);

    console.log('\n✓ Graceful shutdown completado exitosamente');
    console.log(`[${new Date().toISOString()}] Servidor cerrado\n`);

    // Salir con código 0 (éxito)
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error durante graceful shutdown:', error);

    // Limpiar timeout
    clearTimeout(shutdownTimeout);

    // Intentar cerrar conexiones DB de todas formas
    try {
      await closePool().catch(() => {});
      await closeDriver().catch(() => {});
    } catch {
      // Ignorar errores en el cierre de emergencia
    }

    // Salir con código 1 (error)
    process.exit(1);
  }
};

// Iniciar servidor
const start = async () => {
  try {
    const app = await buildApp();

    // Escuchar en el puerto configurado
    await app.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });

    console.log('\nServidor iniciado correctamente');
    console.log(`Dirección: http://localhost:${env.PORT}`);
    console.log(`Entorno: ${env.NODE_ENV}`);
    console.log(`Health Check: http://localhost:${env.PORT}/api/health`);
    console.log(`Health Detailed: http://localhost:${env.PORT}/api/health/detailed\n`);

    // Configurar graceful shutdown para múltiples señales
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

    signals.forEach((signal) => {
      process.on(signal, () => {
        void gracefulShutdown(signal, app);
      });
    });

    // Manejar errores no capturados
    process.on('uncaughtException', (error) => {
      console.error('Error no capturado:', error);
      void gracefulShutdown('uncaughtException', app);
    });

    process.on('unhandledRejection', (reason) => {
      console.error('Promise rechazada no manejada:', reason);
      void gracefulShutdown('unhandledRejection', app);
    });
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
};

// Iniciar servidor
void start();
