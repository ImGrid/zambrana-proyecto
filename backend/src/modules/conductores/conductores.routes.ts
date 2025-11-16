import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  listConductoresSchema,
  getConductorByIdSchema,
  createConductorSchema,
  updateConductorSchema,
  conductorResponseSchema,
  conductoresListResponseSchema,
  licenciasVencerResponseSchema,
  errorResponseSchema,
  estadisticasConductoresResponseSchema,
} from './conductores.schemas.js';
import {
  listConductores,
  getConductorById,
  createConductor,
  updateConductor,
  toggleActivo,
  getLicenciasProximasVencer,
  getEstadisticas,
} from './conductores.service.js';

const conductoresRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /conductores - Listar conductores (todos los usuarios autenticados)
  fastify.route({
    method: 'GET',
    url: '/',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Listar todos los conductores',
      tags: ['conductores'],
      querystring: listConductoresSchema,
      response: {
        200: conductoresListResponseSchema,
        401: z.object({
          error: z.string(),
          message: z.string(),
        }),
        500: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { limit, offset, soloActivos } = request.query;

      const result = await listConductores(limit, offset, soloActivos);

      if (!result.success) {
        return reply.code(500).send({
          error: 'Error interno',
          message: result.message || 'Error al listar conductores',
        });
      }

      return {
        conductores: result.conductores || [],
        total: result.total || 0,
        limit: result.limit || 20,
        offset: result.offset || 0,
      };
    },
  });

  // GET /conductores/:id - Obtener conductor por ID (todos los usuarios autenticados)
  fastify.route({
    method: 'GET',
    url: '/:id',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Obtener información detallada de un conductor',
      tags: ['conductores'],
      params: getConductorByIdSchema,
      response: {
        200: conductorResponseSchema,
        401: z.object({
          error: z.string(),
          message: z.string(),
        }),
        404: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;

      const result = await getConductorById(id);

      if (!result.success || !result.conductor) {
        return reply.code(404).send({
          error: 'Conductor no encontrado',
          message: result.message || 'El conductor no existe',
        });
      }

      return result.conductor;
    },
  });

  // POST /conductores - Crear nuevo conductor (admin o gerente)
  fastify.route({
    method: 'POST',
    url: '/',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Crear un nuevo conductor',
      tags: ['conductores'],
      body: createConductorSchema,
      response: {
        201: z.object({
          message: z.string(),
          conductor: conductorResponseSchema,
        }),
        400: z.object({
          error: z.string(),
          message: z.string(),
        }),
        401: z.object({
          error: z.string(),
          message: z.string(),
        }),
        403: z.object({
          error: z.string(),
          message: z.string(),
        }),
        500: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const result = await createConductor(request.body);

      if (!result.success || !result.conductor) {
        return reply.code(400).send({
          error: 'Error al crear conductor',
          message: result.message || 'No se pudo crear el conductor',
        });
      }

      return reply.code(201).send({
        message: result.message || 'Conductor creado exitosamente',
        conductor: result.conductor,
      });
    },
  });

  // PUT /conductores/:id - Actualizar conductor (admin o gerente)
  fastify.route({
    method: 'PUT',
    url: '/:id',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Actualizar información de un conductor',
      tags: ['conductores'],
      params: getConductorByIdSchema,
      body: updateConductorSchema,
      response: {
        200: z.object({
          message: z.string(),
          conductor: conductorResponseSchema,
        }),
        400: z.object({
          error: z.string(),
          message: z.string(),
        }),
        401: z.object({
          error: z.string(),
          message: z.string(),
        }),
        403: z.object({
          error: z.string(),
          message: z.string(),
        }),
        404: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const data = request.body;

      const result = await updateConductor(id, data);

      if (!result.success || !result.conductor) {
        const statusCode = result.message?.includes('no encontrado') ? 404 : 400;
        return reply.code(statusCode).send({
          error: 'Error al actualizar conductor',
          message: result.message || 'No se pudo actualizar el conductor',
        });
      }

      return {
        message: result.message || 'Conductor actualizado exitosamente',
        conductor: result.conductor,
      };
    },
  });

  // PATCH /conductores/:id/toggle-activo - Activar/desactivar conductor (admin o gerente)
  fastify.route({
    method: 'PATCH',
    url: '/:id/toggle-activo',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Activar o desactivar un conductor',
      tags: ['conductores'],
      params: getConductorByIdSchema,
      response: {
        200: z.object({
          message: z.string(),
          conductor: conductorResponseSchema,
        }),
        401: z.object({
          error: z.string(),
          message: z.string(),
        }),
        403: z.object({
          error: z.string(),
          message: z.string(),
        }),
        404: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;

      const result = await toggleActivo(id);

      if (!result.success || !result.conductor) {
        return reply.code(404).send({
          error: 'Conductor no encontrado',
          message: result.message || 'El conductor no existe',
        });
      }

      return {
        message: result.message || 'Estado actualizado',
        conductor: result.conductor,
      };
    },
  });

  // GET /conductores/licencias/proximas-vencer - Licencias próximas a vencer (admin o gerente)
  fastify.route({
    method: 'GET',
    url: '/licencias/proximas-vencer',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtener conductores con licencias próximas a vencer',
      tags: ['conductores'],
      querystring: z.object({
        dias: z
          .string()
          .optional()
          .transform((val) => (val ? parseInt(val, 10) : 30)),
      }),
      response: {
        200: licenciasVencerResponseSchema,
        401: z.object({
          error: z.string(),
          message: z.string(),
        }),
        403: z.object({
          error: z.string(),
          message: z.string(),
        }),
        500: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { dias } = request.query;

      const result = await getLicenciasProximasVencer(dias);

      if (!result.success) {
        return reply.code(500).send({
          error: 'Error interno',
          message: result.message || 'Error al obtener licencias',
        });
      }

      return {
        conductores: result.conductores || [],
      };
    },
  });

  // GET /conductores/estadisticas - Obtener estadísticas de conductores (admin, gerente)
  fastify.route({
    method: 'GET',
    url: '/estadisticas',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtener estadísticas generales de conductores',
      tags: ['conductores'],
      response: {
        200: estadisticasConductoresResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await getEstadisticas();

      if (!result.success || !result.data) {
        return reply.code(500).send({
          error: 'Error interno',
          message: result.message || 'Error al obtener estadísticas',
        });
      }

      return result.data;
    },
  });
};

export default conductoresRoutes;
