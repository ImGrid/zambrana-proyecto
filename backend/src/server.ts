import { buildApp } from './app.js';
import { env } from './config/env.js';
import { closePool } from './database/postgres/pool.js';
import { closeDriver } from './database/neo4j/driver.js';

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

    // Manejar cierre graceful
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, () => {
        void (async () => {
          console.log(`\nSeñal ${signal} recibida, cerrando servidor...`);
          await app.close();
          await closePool();
          await closeDriver();
          process.exit(0);
        })();
      });
    });
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
};

// Iniciar servidor
void start();
