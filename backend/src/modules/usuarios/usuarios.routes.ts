import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  listUsuariosSchema,
  getUsuarioByIdSchema,
  updateUsuarioSchema,
  changePasswordSchema,
  usuarioResponseSchema,
  usuariosListResponseSchema,
  usuarioUpdatedResponseSchema,
  messageResponseSchema
} from './usuarios.schemas.js';
import {
  listUsuarios,
  getUsuarioById,
  updateUsuario,
  deactivateUsuario,
  changePassword
} from './usuarios.service.js';

// eslint-disable-next-line @typescript-eslint/require-await
const usuariosRoutes: FastifyPluginAsyncZod = async (fastify) => {

  // GET /usuarios - Listar usuarios con paginación (solo admin)
  fastify.route({
    method: 'GET',
    url: '/',
    onRequest: [fastify.authenticate, fastify.requireRole('admin')],
    schema: {
      description: 'Listar todos los usuarios del sistema con paginación',
      tags: ['usuarios'],
      querystring: listUsuariosSchema,
      response: {
        200: usuariosListResponseSchema,
        401: z.object({
          error: z.string(),
          message: z.string()
        }),
        403: z.object({
          error: z.string(),
          message: z.string()
        }),
        500: z.object({
          error: z.string(),
          message: z.string()
        })
      }
    },
    handler: async (request, reply) => {
      const { limit, offset, sort_by, sort_order } = request.query;

      const result = await listUsuarios(limit, offset, sort_by, sort_order);

      if (!result.success) {
        return reply.code(500).send({
          error: 'Error interno',
          message: result.message || 'Error al listar usuarios'
        });
      }

      return {
        usuarios: result.usuarios || [],
        total: result.total || 0,
        limit: result.limit || 20,
        offset: result.offset || 0
      };
    }
  });

  // GET /usuarios/:id - Obtener usuario por ID (solo admin)
  fastify.route({
    method: 'GET',
    url: '/:id',
    onRequest: [fastify.authenticate, fastify.requireRole('admin')],
    schema: {
      description: 'Obtener información detallada de un usuario específico',
      tags: ['usuarios'],
      params: getUsuarioByIdSchema,
      response: {
        200: usuarioResponseSchema,
        401: z.object({
          error: z.string(),
          message: z.string()
        }),
        403: z.object({
          error: z.string(),
          message: z.string()
        }),
        404: z.object({
          error: z.string(),
          message: z.string()
        })
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params;

      const result = await getUsuarioById(id);

      if (!result.success || !result.usuario) {
        return reply.code(404).send({
          error: 'Usuario no encontrado',
          message: result.message || 'El usuario no existe'
        });
      }

      return result.usuario;
    }
  });

  // PUT /usuarios/:id - Actualizar usuario (solo admin)
  fastify.route({
    method: 'PUT',
    url: '/:id',
    onRequest: [fastify.authenticate, fastify.requireRole('admin')],
    schema: {
      description: 'Actualizar información de un usuario',
      tags: ['usuarios'],
      params: getUsuarioByIdSchema,
      body: updateUsuarioSchema,
      response: {
        200: usuarioUpdatedResponseSchema,
        400: z.object({
          error: z.string(),
          message: z.string()
        }),
        401: z.object({
          error: z.string(),
          message: z.string()
        }),
        403: z.object({
          error: z.string(),
          message: z.string()
        }),
        404: z.object({
          error: z.string(),
          message: z.string()
        })
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const updateData = request.body;

      const result = await updateUsuario(id, updateData);

      if (!result.success || !result.usuario) {
        const statusCode = result.message?.includes('no encontrado') ? 404 : 400;
        return reply.code(statusCode).send({
          error: 'Error al actualizar',
          message: result.message || 'No se pudo actualizar el usuario'
        });
      }

      return {
        message: result.message || 'Usuario actualizado exitosamente',
        usuario: result.usuario
      };
    }
  });

  // DELETE /usuarios/:id - Desactivar usuario (soft delete, solo admin)
  fastify.route({
    method: 'DELETE',
    url: '/:id',
    onRequest: [fastify.authenticate, fastify.requireRole('admin')],
    schema: {
      description: 'Desactivar un usuario (soft delete)',
      tags: ['usuarios'],
      params: getUsuarioByIdSchema,
      response: {
        200: messageResponseSchema,
        400: z.object({
          error: z.string(),
          message: z.string()
        }),
        401: z.object({
          error: z.string(),
          message: z.string()
        }),
        403: z.object({
          error: z.string(),
          message: z.string()
        }),
        404: z.object({
          error: z.string(),
          message: z.string()
        })
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params;

      const result = await deactivateUsuario(id);

      if (!result.success) {
        const statusCode = result.message?.includes('no encontrado') ? 404 : 400;
        return reply.code(statusCode).send({
          error: 'Error al desactivar',
          message: result.message || 'No se pudo desactivar el usuario'
        });
      }

      return {
        message: result.message || 'Usuario desactivado exitosamente'
      };
    }
  });

  // POST /usuarios/:id/change-password - Cambiar contraseña
  // Permite que el usuario cambie su propia contraseña o que admin cambie cualquier contraseña
  fastify.route({
    method: 'POST',
    url: '/:id/change-password',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Cambiar contraseña de un usuario',
      tags: ['usuarios'],
      params: getUsuarioByIdSchema,
      body: changePasswordSchema,
      response: {
        200: messageResponseSchema,
        400: z.object({
          error: z.string(),
          message: z.string()
        }),
        401: z.object({
          error: z.string(),
          message: z.string()
        }),
        403: z.object({
          error: z.string(),
          message: z.string()
        })
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const { currentPassword, newPassword } = request.body;
      const currentUser = request.user as { id: number; rol?: string };

      // Verificar que el usuario puede cambiar esta contraseña
      // Solo puede cambiar su propia contraseña o ser admin
      if (currentUser.id !== id && currentUser.rol !== 'admin') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'No tienes permisos para cambiar esta contraseña'
        });
      }

      const result = await changePassword(id, currentPassword, newPassword);

      if (!result.success) {
        return reply.code(400).send({
          error: 'Error al cambiar contraseña',
          message: result.message
        });
      }

      return {
        message: result.message
      };
    }
  });
};

export default usuariosRoutes;
