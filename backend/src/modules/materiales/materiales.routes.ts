import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  listMaterialesSchema,
  getMaterialByIdSchema,
  createMaterialSchema,
  updatePrecioSchema,
  ajustarStockSchema,
  materialResponseSchema,
  materialesListResponseSchema,
  estadisticasMaterialesResponseSchema
} from './materiales.schemas.js';
import {
  listMateriales,
  getMaterialById,
  createMaterial,
  updatePrecio,
  ajustarStock,
  toggleActivo,
  getHistorialPrecios,
  getEstadisticas
} from './materiales.service.js';

// eslint-disable-next-line @typescript-eslint/require-await
const materialesRoutes: FastifyPluginAsyncZod = async (fastify) => {

  // GET /materiales - Listar materiales (todos los usuarios autenticados)
  fastify.route({
    method: 'GET',
    url: '/',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Listar todos los materiales disponibles',
      tags: ['materiales'],
      querystring: listMaterialesSchema,
      response: {
        200: materialesListResponseSchema,
        401: z.object({
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
      const { limit, offset, soloActivos } = request.query;

      const result = await listMateriales(limit, offset, soloActivos);

      if (!result.success) {
        return reply.code(500).send({
          error: 'Error interno',
          message: result.message || 'Error al listar materiales'
        });
      }

      return {
        materiales: result.materiales || [],
        total: result.total || 0,
        limit: result.limit || 20,
        offset: result.offset || 0
      };
    }
  });

  // GET /materiales/:id - Obtener material por ID (todos los usuarios autenticados)
  fastify.route({
    method: 'GET',
    url: '/:id',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Obtener información detallada de un material',
      tags: ['materiales'],
      params: getMaterialByIdSchema,
      response: {
        200: materialResponseSchema,
        401: z.object({
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

      const result = await getMaterialById(id);

      if (!result.success || !result.material) {
        return reply.code(404).send({
          error: 'Material no encontrado',
          message: result.message || 'El material no existe'
        });
      }

      return result.material;
    }
  });

  // POST /materiales - Crear nuevo material (admin o gerente)
  fastify.route({
    method: 'POST',
    url: '/',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Crear un nuevo material',
      tags: ['materiales'],
      body: createMaterialSchema,
      response: {
        201: z.object({
          message: z.string(),
          material: materialResponseSchema
        }),
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
        500: z.object({
          error: z.string(),
          message: z.string()
        })
      }
    },
    handler: async (request, reply) => {
      const result = await createMaterial(request.body);

      if (!result.success || !result.material) {
        return reply.code(400).send({
          error: 'Error al crear material',
          message: result.message || 'No se pudo crear el material'
        });
      }

      return reply.code(201).send({
        message: result.message || 'Material creado exitosamente',
        material: result.material
      });
    }
  });

  // PUT /materiales/:id/precio - Actualizar precio (solo admin)
  fastify.route({
    method: 'PUT',
    url: '/:id/precio',
    onRequest: [fastify.authenticate, fastify.requireRole('admin')],
    schema: {
      description: 'Actualizar precio de un material (crea historial automáticamente)',
      tags: ['materiales'],
      params: getMaterialByIdSchema,
      body: updatePrecioSchema,
      response: {
        200: z.object({
          message: z.string(),
          material: materialResponseSchema
        }),
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
      const { precio_m3 } = request.body;
      const currentUser = request.user as { id: number };

      const result = await updatePrecio(id, precio_m3, currentUser.id);

      if (!result.success || !result.material) {
        const statusCode = result.message?.includes('no encontrado') ? 404 : 400;
        return reply.code(statusCode).send({
          error: 'Error al actualizar precio',
          message: result.message || 'No se pudo actualizar el precio'
        });
      }

      return {
        message: result.message || 'Precio actualizado exitosamente',
        material: result.material
      };
    }
  });

  // POST /materiales/:id/ajustar-stock - Ajustar stock (admin o gerente)
  fastify.route({
    method: 'POST',
    url: '/:id/ajustar-stock',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Ajustar stock de material manualmente (positivo=entrada, negativo=salida)',
      tags: ['materiales'],
      params: getMaterialByIdSchema,
      body: ajustarStockSchema,
      response: {
        200: z.object({
          message: z.string(),
          material: materialResponseSchema
        }),
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
      const { cantidad, motivo } = request.body;
      const currentUser = request.user as { id: number };

      const result = await ajustarStock(id, cantidad, currentUser.id, motivo);

      if (!result.success || !result.material) {
        const statusCode = result.message?.includes('no encontrado') ? 404 : 400;
        return reply.code(statusCode).send({
          error: 'Error al ajustar stock',
          message: result.message || 'No se pudo ajustar el stock'
        });
      }

      return {
        message: result.message || 'Stock ajustado exitosamente',
        material: result.material
      };
    }
  });

  // PATCH /materiales/:id/toggle-activo - Activar/desactivar material (solo admin)
  fastify.route({
    method: 'PATCH',
    url: '/:id/toggle-activo',
    onRequest: [fastify.authenticate, fastify.requireRole('admin')],
    schema: {
      description: 'Activar o desactivar un material',
      tags: ['materiales'],
      params: getMaterialByIdSchema,
      response: {
        200: z.object({
          message: z.string(),
          material: materialResponseSchema
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

      const result = await toggleActivo(id);

      if (!result.success || !result.material) {
        return reply.code(404).send({
          error: 'Material no encontrado',
          message: result.message || 'El material no existe'
        });
      }

      return {
        message: result.message || 'Estado actualizado',
        material: result.material
      };
    }
  });

  // GET /materiales/:id/historial-precios - Ver historial de precios (admin, gerente)
  fastify.route({
    method: 'GET',
    url: '/:id/historial-precios',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtener historial de cambios de precio de un material',
      tags: ['materiales'],
      params: getMaterialByIdSchema,
      response: {
        200: z.object({
          historial: z.array(z.object({
            id: z.number(),
            precio_m3: z.number(),
            fecha_vigencia_desde: z.date(),
            fecha_vigencia_hasta: z.date().nullable(),
            motivo: z.string().nullable(),
            usuario_nombre: z.string().nullable()
          }))
        }),
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
      const { id } = request.params;

      const result = await getHistorialPrecios(id);

      if (!result.success) {
        return reply.code(500).send({
          error: 'Error interno',
          message: result.message || 'Error al obtener historial'
        });
      }

      return {
        historial: result.historial || []
      };
    }
  });

  // GET /materiales/estadisticas - Obtener estadísticas de materiales (admin, gerente)
  fastify.route({
    method: 'GET',
    url: '/estadisticas',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtener estadísticas generales de materiales e inventario',
      tags: ['materiales'],
      response: {
        200: estadisticasMaterialesResponseSchema,
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

export default materialesRoutes;
