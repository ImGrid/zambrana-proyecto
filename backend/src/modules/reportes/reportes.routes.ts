import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  getDashboardQuerySchema,
  getClienteMensualParamsSchema,
  getClienteMensualQuerySchema,
  getConductorRendimientoParamsSchema,
  getStockQuerySchema,
  getVentasQuerySchema,
  dashboardResponseSchema,
  clienteMensualResponseSchema,
  conductorRendimientoResponseSchema,
  stockResponseSchema,
  ventasResponseSchema,
  refreshViewsResponseSchema,
  errorResponseSchema
} from './reportes.schemas.js';
import {
  getDashboard,
  getClienteMensual,
  getConductorRendimiento,
  getResumenStock,
  getVentas,
  refreshViews
} from './reportes.service.js';

const reportesRoutes: FastifyPluginAsyncZod = async (fastify) => {

  // GET /reportes/dashboard - Dashboard del gerente
  fastify.route({
    method: 'GET',
    url: '/dashboard',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtener métricas del dashboard para gerente',
      tags: ['reportes'],
      querystring: getDashboardQuerySchema,
      response: {
        200: dashboardResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { dias } = request.query;

      const result = await getDashboard(dias);

      if (!result.success || !result.data) {
        return reply.code(500).send({
          error: 'Error interno',
          message: result.message || 'No se pudo obtener el dashboard'
        });
      }

      return result.data;
    }
  });

  // GET /reportes/clientes/:id/mensual - Reporte mensual de cliente
  fastify.route({
    method: 'GET',
    url: '/clientes/:id/mensual',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtener reporte mensual de actividad de un cliente',
      tags: ['reportes'],
      params: getClienteMensualParamsSchema,
      querystring: getClienteMensualQuerySchema,
      response: {
        200: clienteMensualResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const { meses } = request.query;

      const result = await getClienteMensual(id, meses);

      if (!result.success) {
        const statusCode = result.message?.includes('no encontrado') ? 404 : 500;
        return reply.code(statusCode).send({
          error: statusCode === 404 ? 'Cliente no encontrado' : 'Error interno',
          message: result.message || 'No se pudo obtener el reporte'
        });
      }

      return result.data;
    }
  });

  // GET /reportes/conductores/:id/rendimiento - Rendimiento de conductor
  fastify.route({
    method: 'GET',
    url: '/conductores/:id/rendimiento',
    onRequest: [fastify.authenticate, fastify.requireRole('admin')],
    schema: {
      description: 'Obtener métricas de rendimiento de un conductor',
      tags: ['reportes'],
      params: getConductorRendimientoParamsSchema,
      response: {
        200: conductorRendimientoResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params;

      const result = await getConductorRendimiento(id);

      if (!result.success) {
        const statusCode = result.message?.includes('no encontrado') ? 404 : 500;
        return reply.code(statusCode).send({
          error: statusCode === 404 ? 'Conductor no encontrado' : 'Error interno',
          message: result.message || 'No se pudo obtener el rendimiento'
        });
      }

      return result.data;
    }
  });

  // GET /reportes/stock - Resumen de stock de materiales
  fastify.route({
    method: 'GET',
    url: '/stock',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtener resumen de stock y movimientos de materiales',
      tags: ['reportes'],
      querystring: getStockQuerySchema,
      response: {
        200: stockResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { estado } = request.query;

      const result = await getResumenStock(estado === 'TODOS' ? undefined : estado);

      if (!result.success || !result.data) {
        return reply.code(500).send({
          error: 'Error interno',
          message: result.message || 'No se pudo obtener el resumen de stock'
        });
      }

      return result.data;
    }
  });

  // GET /reportes/ventas - Reporte detallado de ventas
  fastify.route({
    method: 'GET',
    url: '/ventas',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtener reporte detallado de ventas con filtros',
      tags: ['reportes'],
      querystring: getVentasQuerySchema,
      response: {
        200: ventasResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { limit, offset, fecha_desde, fecha_hasta, cliente_id, material_id } = request.query;

      const result = await getVentas(limit, offset, {
        fecha_desde,
        fecha_hasta,
        cliente_id,
        material_id
      });

      if (!result.success || !result.data) {
        return reply.code(500).send({
          error: 'Error interno',
          message: result.message || 'No se pudo obtener el reporte de ventas'
        });
      }

      return result.data;
    }
  });

  // POST /reportes/refresh - Refrescar vistas materializadas
  fastify.route({
    method: 'POST',
    url: '/refresh',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Refrescar todas las vistas materializadas',
      tags: ['reportes'],
      response: {
        200: refreshViewsResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const result = await refreshViews();

      if (!result.success || !result.data) {
        return reply.code(500).send({
          error: 'Error al refrescar vistas',
          message: result.message || 'No se pudieron refrescar las vistas materializadas'
        });
      }

      return {
        message: result.message || 'Vistas refrescadas exitosamente',
        refreshed: result.data.refreshed,
        errors: result.data.errors,
        duration_ms: result.data.duration_ms
      };
    }
  });
};

export default reportesRoutes;
