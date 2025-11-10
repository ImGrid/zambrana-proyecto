import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  listClientesSchema,
  getClienteByIdSchema,
  createClienteSchema,
  updateClienteSchema,
  updateClienteProfileSchema,
  clienteResponseSchema,
  clientesListResponseSchema,
  clienteUpdateResponseSchema,
  errorResponseSchema,
  estadisticasClientesResponseSchema
} from './clientes.schemas.js';
import {
  listClientes,
  getClienteById,
  createCliente,
  updateCliente,
  updateClienteProfile,
  getEstadisticas
} from './clientes.service.js';

// eslint-disable-next-line @typescript-eslint/require-await
const clientesRoutes: FastifyPluginAsyncZod = async (fastify) => {

  // GET /clientes - Listar clientes (todos los usuarios autenticados)
  fastify.route({
    method: 'GET',
    url: '/',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Listar todos los clientes',
      tags: ['clientes'],
      querystring: listClientesSchema,
      response: {
        200: clientesListResponseSchema,
        401: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      // Acceso directo sin destructuring para mantener type safety
      const result = await listClientes(request.query.limit, request.query.offset);

      if (!result.success) {
        return reply.code(500).send({
          error: 'Error interno',
          message: result.message || 'Error al listar clientes'
        });
      }

      return {
        clientes: result.clientes || [],
        total: result.total || 0,
        limit: result.limit || 20,
        offset: result.offset || 0
      };
    }
  });

  // GET /clientes/:id - Obtener cliente por ID (todos los usuarios autenticados)
  fastify.route({
    method: 'GET',
    url: '/:id',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Obtener información detallada de un cliente',
      tags: ['clientes'],
      params: getClienteByIdSchema,
      response: {
        200: clienteResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const result = await getClienteById(request.params.id);

      if (!result.success || !result.cliente) {
        return reply.code(404).send({
          error: 'Cliente no encontrado',
          message: result.message || 'El cliente no existe'
        });
      }

      return result.cliente;
    }
  });

  // POST /clientes - Crear nuevo cliente (admin o gerente)
  fastify.route({
    method: 'POST',
    url: '/',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Crear un nuevo cliente',
      tags: ['clientes'],
      body: createClienteSchema,
      response: {
        201: clienteUpdateResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const result = await createCliente(request.body);

      if (!result.success || !result.cliente) {
        return reply.code(400).send({
          error: 'Error al crear cliente',
          message: result.message || 'No se pudo crear el cliente'
        });
      }

      return reply.code(201).send({
        message: result.message || 'Cliente creado exitosamente',
        cliente: result.cliente
      });
    }
  });

  // PUT /clientes/:id - Actualizar cliente (admin o gerente)
  fastify.route({
    method: 'PUT',
    url: '/:id',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Actualizar información de un cliente',
      tags: ['clientes'],
      params: getClienteByIdSchema,
      body: updateClienteSchema,
      response: {
        200: clienteUpdateResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const result = await updateCliente(request.params.id, request.body);

      if (!result.success) {
        const statusCode = result.message?.includes('no encontrado') ? 404 : 400;
        return reply.code(statusCode).send({
          error: 'Error al actualizar cliente',
          message: result.message || 'No se pudo actualizar el cliente'
        });
      }

      return {
        message: result.message || 'Cliente actualizado exitosamente',
        cliente: result.cliente
      };
    }
  });

  // PUT /clientes/me - Actualizar perfil del cliente autenticado
  fastify.route({
    method: 'PUT',
    url: '/me',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Actualizar perfil del cliente autenticado (solo clientes)',
      tags: ['clientes'],
      body: updateClienteProfileSchema,
      response: {
        200: clienteUpdateResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    handler: async (request, reply) => {
      const user = request.user as { id: number; rol: string };

      // Verificar que el usuario sea un cliente
      if (user.rol !== 'cliente') {
        return reply.code(403).send({
          error: 'Acceso denegado',
          message: 'Solo los clientes pueden actualizar su perfil mediante este endpoint'
        });
      }

      const result = await updateClienteProfile(user.id, request.body);

      if (!result.success) {
        const statusCode = result.message?.includes('no encontró') ? 404 : 400;
        return reply.code(statusCode).send({
          error: 'Error al actualizar perfil',
          message: result.message || 'No se pudo actualizar el perfil'
        });
      }

      return {
        message: result.message || 'Perfil actualizado exitosamente',
        cliente: result.cliente
      };
    }
  });

  // GET /clientes/estadisticas - Obtener estadísticas de clientes (admin, gerente)
  fastify.route({
    method: 'GET',
    url: '/estadisticas',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtener estadísticas generales de clientes',
      tags: ['clientes'],
      response: {
        200: estadisticasClientesResponseSchema,
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

export default clientesRoutes;
