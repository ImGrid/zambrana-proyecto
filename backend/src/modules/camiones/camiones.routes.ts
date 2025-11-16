import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  listCamionesSchema,
  getCamionByIdSchema,
  createCamionSchema,
  updateCamionSchema,
  camionResponseSchema,
  camionesListResponseSchema,
  camionUpdateResponseSchema,
  errorResponseSchema,
  estadisticasCamionesResponseSchema
} from './camiones.schemas.js';
import {
  listCamiones,
  getCamionById,
  createCamion,
  updateCamion,
  toggleActivo,
  toggleMantenimiento,
  getEstadisticas
} from './camiones.service.js';

// eslint-disable-next-line @typescript-eslint/require-await
const camionesRoutes: FastifyPluginAsyncZod = async (fastify) => {

  // GET /camiones - Listar camiones (todos los usuarios autenticados)
  fastify.route({
    method: 'GET',
    url: '/',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Listar todos los camiones disponibles',
      tags: ['camiones'],
      querystring: listCamionesSchema,
      response: {
        200: camionesListResponseSchema,
        401: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      // Acceso directo sin destructuring para mantener type safety
      const result = await listCamiones(
        request.query.limit,
        request.query.offset,
        request.query.soloActivos,
        request.query.soloDisponibles
      );

      if (!result.success) {
        return reply.code(500).send({
          error: 'Error interno',
          message: result.message || 'Error al listar camiones'
        });
      }

      return {
        camiones: result.camiones || [],
        total: result.total || 0,
        limit: result.limit || 20,
        offset: result.offset || 0
      };
    }
  });

  // GET /camiones/:id - Obtener camión por ID (todos los usuarios autenticados)
  fastify.route({
    method: 'GET',
    url: '/:id',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Obtener información detallada de un camión',
      tags: ['camiones'],
      params: getCamionByIdSchema,
      response: {
        200: camionResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const result = await getCamionById(request.params.id);

      if (!result.success || !result.camion) {
        return reply.code(404).send({
          error: 'Camión no encontrado',
          message: result.message || 'El camión no existe'
        });
      }

      return result.camion;
    }
  });

  // POST /camiones - Crear nuevo camión (admin o gerente)
  fastify.route({
    method: 'POST',
    url: '/',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Crear un nuevo camión',
      tags: ['camiones'],
      body: createCamionSchema,
      response: {
        201: camionUpdateResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const result = await createCamion(request.body);

      if (!result.success || !result.camion) {
        return reply.code(400).send({
          error: 'Error al crear camión',
          message: result.message || 'No se pudo crear el camión'
        });
      }

      return reply.code(201).send({
        message: result.message || 'Camión creado exitosamente',
        camion: result.camion
      });
    }
  });

  // PUT /camiones/:id - Actualizar camión (admin o gerente)
  fastify.route({
    method: 'PUT',
    url: '/:id',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Actualizar información de un camión',
      tags: ['camiones'],
      params: getCamionByIdSchema,
      body: updateCamionSchema,
      response: {
        200: camionUpdateResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const result = await updateCamion(request.params.id, request.body);

      if (!result.success) {
        const statusCode = result.message?.includes('no encontrado') ? 404 : 400;
        return reply.code(statusCode).send({
          error: 'Error al actualizar camión',
          message: result.message || 'No se pudo actualizar el camión'
        });
      }

      return {
        message: result.message || 'Camión actualizado exitosamente',
        camion: result.camion
      };
    }
  });

  // PATCH /camiones/:id/toggle-activo - Activar/desactivar camión (admin o gerente)
  fastify.route({
    method: 'PATCH',
    url: '/:id/toggle-activo',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Activar o desactivar un camión',
      tags: ['camiones'],
      params: getCamionByIdSchema,
      response: {
        200: camionUpdateResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const result = await toggleActivo(request.params.id);

      if (!result.success) {
        return reply.code(404).send({
          error: 'Camión no encontrado',
          message: result.message || 'El camión no existe'
        });
      }

      return {
        message: result.message || 'Estado actualizado',
        camion: result.camion
      };
    }
  });

  // PATCH /camiones/:id/toggle-mantenimiento - Cambiar estado de mantenimiento (admin o gerente)
  fastify.route({
    method: 'PATCH',
    url: '/:id/toggle-mantenimiento',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Cambiar estado de mantenimiento de un camión',
      tags: ['camiones'],
      params: getCamionByIdSchema,
      response: {
        200: camionUpdateResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const result = await toggleMantenimiento(request.params.id);

      if (!result.success) {
        return reply.code(404).send({
          error: 'Camión no encontrado',
          message: result.message || 'El camión no existe'
        });
      }

      return {
        message: result.message || 'Estado de mantenimiento actualizado',
        camion: result.camion
      };
    }
  });

  // GET /camiones/estadisticas - Obtener estadísticas de camiones (admin, gerente)
  fastify.route({
    method: 'GET',
    url: '/estadisticas',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtener estadísticas generales de camiones',
      tags: ['camiones'],
      response: {
        200: estadisticasCamionesResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const result = await getEstadisticas();

      if (!result.success || !result.data) {
        return reply.code(500).send({
          error: 'Error interno',
          message: result.message || 'Error al obtener estadísticas'
        });
      }

      return result.data;
    }
  });
};

export default camionesRoutes;
