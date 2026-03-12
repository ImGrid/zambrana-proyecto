import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  sugerirParamsSchema,
  sugerenciaResponseSchema,
  reglasResponseSchema,
  errorResponseSchema,
} from './sistema-experto.schemas.js';
import { generarSugerencia, obtenerReglas } from './sistema-experto.service.js';

const sistemaExpertoRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /sistema-experto/sugerir/:pedido_id - Generar sugerencia para un pedido
  fastify.route({
    method: 'GET',
    url: '/sugerir/:pedido_id',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Generar sugerencia de asignacion de recursos para un pedido pendiente',
      tags: ['sistema-experto'],
      params: sugerirParamsSchema,
      response: {
        200: sugerenciaResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { pedido_id } = request.params;

      try {
        const sugerencia = await generarSugerencia(pedido_id);
        return sugerencia;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';

        if (message.includes('no encontrado')) {
          return reply.code(404).send({
            error: 'Pedido no encontrado',
            message,
          });
        }

        if (message.includes('PENDIENTE')) {
          return reply.code(400).send({
            error: 'Estado invalido',
            message,
          });
        }

        return reply.code(500).send({
          error: 'Error interno',
          message,
        });
      }
    },
  });

  // GET /sistema-experto/reglas - Listar reglas del sistema experto
  fastify.route({
    method: 'GET',
    url: '/reglas',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Listar todas las reglas del sistema experto',
      tags: ['sistema-experto'],
      response: {
        200: reglasResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (_request, reply) => {
      try {
        const reglas = await obtenerReglas();
        return { reglas };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({
          error: 'Error interno',
          message,
        });
      }
    },
  });
};

export default sistemaExpertoRoutes;
