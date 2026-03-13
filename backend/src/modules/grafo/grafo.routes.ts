import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  pedidoIdParamSchema,
  clienteIdParamSchema,
  operacionesQuerySchema,
  grafoResponseSchema,
  grafoStatsResponseSchema,
  errorResponseSchema
} from './grafo.schemas.js';
import {
  obtenerGrafoPedido,
  obtenerGrafoOperaciones,
  obtenerGrafoCliente,
  obtenerEstadisticasGrafo,
  sincronizarTodo
} from './grafo.service.js';

const grafoRoutes: FastifyPluginAsyncZod = async (fastify) => {

  // GET /grafo/pedido/:pedido_id - Grafo de un pedido especifico
  fastify.route({
    method: 'GET',
    url: '/pedido/:pedido_id',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtener grafo de operaciones de un pedido especifico',
      tags: ['grafo'],
      params: pedidoIdParamSchema,
      response: {
        200: grafoResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { pedido_id } = request.params;

      try {
        const grafo = await obtenerGrafoPedido(pedido_id);

        if (grafo.nodos.length === 0) {
          return reply.code(404).send({
            error: 'No encontrado',
            message: 'No se encontro el grafo para este pedido. Ejecute la sincronizacion primero.'
          });
        }

        return grafo;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({
          error: 'Error interno',
          message
        });
      }
    }
  });

  // GET /grafo/operaciones - Grafo general de operaciones
  fastify.route({
    method: 'GET',
    url: '/operaciones',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtener grafo general de todas las operaciones',
      tags: ['grafo'],
      querystring: operacionesQuerySchema,
      response: {
        200: grafoResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { estado, limite } = request.query;

      try {
        const grafo = await obtenerGrafoOperaciones(estado, limite);
        return grafo;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({
          error: 'Error interno',
          message
        });
      }
    }
  });

  // GET /grafo/cliente/:cliente_id - Grafo de un cliente
  fastify.route({
    method: 'GET',
    url: '/cliente/:cliente_id',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtener grafo de operaciones de un cliente especifico',
      tags: ['grafo'],
      params: clienteIdParamSchema,
      response: {
        200: grafoResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const { cliente_id } = request.params;

      try {
        const grafo = await obtenerGrafoCliente(cliente_id);

        if (grafo.nodos.length === 0) {
          return reply.code(404).send({
            error: 'No encontrado',
            message: 'No se encontro el grafo para este cliente.'
          });
        }

        return grafo;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({
          error: 'Error interno',
          message
        });
      }
    }
  });

  // GET /grafo/stats - Estadisticas del grafo
  fastify.route({
    method: 'GET',
    url: '/stats',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtener estadisticas del grafo de operaciones',
      tags: ['grafo'],
      response: {
        200: grafoStatsResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (_request, reply) => {
      try {
        const stats = await obtenerEstadisticasGrafo();
        return stats;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({
          error: 'Error interno',
          message
        });
      }
    }
  });

  // POST /grafo/sincronizar - Sincronizar datos de PostgreSQL a Neo4j
  fastify.route({
    method: 'POST',
    url: '/sincronizar',
    onRequest: [fastify.authenticate, fastify.requireRole('admin')],
    schema: {
      description: 'Sincronizar todos los datos de PostgreSQL a Neo4j (solo admin)',
      tags: ['grafo'],
      response: {
        200: z.object({
          mensaje: z.string(),
          detalles: z.object({
            clientes: z.number(),
            materiales: z.number(),
            conductores: z.number(),
            camiones: z.number(),
            zonas: z.number(),
            pedidos: z.number(),
            entregas: z.number()
          })
        }),
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (_request, reply) => {
      try {
        const resultado = await sincronizarTodo();
        return resultado;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({
          error: 'Error interno',
          message
        });
      }
    }
  });
};

export default grafoRoutes;
