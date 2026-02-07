import fp from 'fastify-plugin';
import fastifySchedule from '@fastify/schedule';
import { AsyncTask, SimpleIntervalJob } from 'toad-scheduler';
import { FastifyInstance } from 'fastify';
import { refreshSingleView } from '../modules/reportes/reportes.repository.js';

// Configuracion de intervalos por vista (en minutos)
const REFRESH_INTERVALS = {
  mv_dashboard_gerente: 10,
  mv_resumen_stock: 10,
  mv_rendimiento_conductores: 30,
  mv_reporte_clientes_mensual: 120,
} as const;

// Crea una tarea de refresh para una vista especifica
function createRefreshTask(viewName: keyof typeof REFRESH_INTERVALS): AsyncTask {
  return new AsyncTask(
    `refresh-${viewName}`,
    async () => {
      const start = Date.now();
      await refreshSingleView(viewName);
      const duration = Date.now() - start;
      console.log(`[scheduler] ${viewName} refrescada en ${duration}ms`);
    },
    (error) => {
      console.error(`[scheduler] Error al refrescar ${viewName}:`, error.message);
    }
  );
}

// Plugin de refresh automatico de vistas materializadas
export default fp(async function (fastify: FastifyInstance) {
  await fastify.register(fastifySchedule);

  // Registrar jobs cuando el servidor este listo
  fastify.ready().then(() => {
    for (const [viewName, intervalMinutes] of Object.entries(REFRESH_INTERVALS)) {
      const task = createRefreshTask(viewName as keyof typeof REFRESH_INTERVALS);
      const job = new SimpleIntervalJob(
        { minutes: intervalMinutes, runImmediately: true },
        task,
        { id: `refresh-${viewName}`, preventOverrun: true }
      );

      fastify.scheduler.addSimpleIntervalJob(job);
    }

    console.log('[scheduler] Refresh automatico de vistas materializadas configurado');
    console.log(`[scheduler] Intervalos: dashboard/stock=10min, conductores=30min, clientes=120min`);
  });
});
