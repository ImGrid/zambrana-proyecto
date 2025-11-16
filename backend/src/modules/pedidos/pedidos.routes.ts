import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  createPedidoSchema,
  listPedidosSchema,
  getPedidoByIdSchema,
  getTrackingByCodigoSchema,
  confirmarPedidoSchema,
  reasignarPedidoSchema,
  cancelarPedidoSchema,
  pedidoResponseSchema,
  pedidosListResponseSchema,
  trackingResponseSchema,
  historialEstadoSchema,
  pedidoSuccessResponseSchema,
  errorResponseSchema,
  getEstadisticasQuerySchema,
  estadisticasPedidosResponseSchema,
} from './pedidos.schemas.js';
import { pool } from '../../database/postgres/pool.js';
import {
  createPedido,
  listPedidos,
  getPedidoById,
  getTrackingByCodigo,
  confirmarPedido,
  reasignarPedido,
  cancelarPedido,
  deletePedido,
  getHistorialEstados,
  getEstadisticas,
} from './pedidos.service.js';
import { rateLimitConfigs } from '../../config/rate-limit.config.js';
import { calcularRutaHastaPedido } from '../entregas/rutas.service.js';

const pedidosRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // =====================================================
  // ENDPOINT PÚBLICO - TRACKING
  // =====================================================

  // GET /pedidos/tracking/:codigo - Tracking público (sin autenticación)
  fastify.route({
    method: 'GET',
    url: '/tracking/:codigo',
    config: {
      rateLimit: rateLimitConfigs.public.tracking,
    },
    schema: {
      description: 'Rastrear pedido por código de seguimiento (público)',
      tags: ['pedidos'],
      params: getTrackingByCodigoSchema,
      response: {
        200: trackingResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { codigo } = request.params;

      const result = await getTrackingByCodigo(codigo);

      if (!result.success || !result.tracking) {
        return reply.code(404).send({
          error: 'Código no encontrado',
          message: result.message || 'El código de seguimiento no existe',
        });
      }

      return result.tracking;
    },
  });

  // =====================================================
  // ENDPOINTS AUTENTICADOS
  // =====================================================

  // POST /pedidos - Crear nuevo pedido (cliente, gerente, admin)
  fastify.route({
    method: 'POST',
    url: '/',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Crear nuevo pedido con materiales',
      tags: ['pedidos'],
      body: createPedidoSchema,
      response: {
        201: pedidoSuccessResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const data = request.body;
      const currentUser = request.user as { id: number; rol: string };

      // Si el usuario es cliente, usar su cliente_id
      let clienteId = data.cliente_id;

      if (currentUser.rol === 'cliente') {
        // Obtener cliente_id del usuario
        const clienteResult = await pool.query<{ id: number }>(
          'SELECT id FROM clientes WHERE usuario_id = $1',
          [currentUser.id]
        );

        if (clienteResult.rows.length === 0) {
          return reply.code(400).send({
            error: 'Cliente no encontrado',
            message: 'No se encontró información de cliente para este usuario',
          });
        }

        const clienteRow = clienteResult.rows[0];
        if (!clienteRow) {
          return reply.code(400).send({
            error: 'Cliente no encontrado',
            message: 'No se encontró información de cliente para este usuario',
          });
        }

        clienteId = clienteRow.id;
      }

      if (!clienteId) {
        return reply.code(400).send({
          error: 'Cliente requerido',
          message: 'Debe especificar el ID del cliente',
        });
      }

      const result = await createPedido({
        ...data,
        cliente_id: clienteId,
      });

      if (!result.success || !result.pedido) {
        return reply.code(400).send({
          error: 'Error al crear pedido',
          message: result.message || 'No se pudo crear el pedido',
        });
      }

      return reply.code(201).send({
        message: result.message || 'Pedido creado exitosamente',
        pedido: result.pedido,
      });
    },
  });

  // GET /pedidos - Listar pedidos (todos los usuarios autenticados)
  fastify.route({
    method: 'GET',
    url: '/',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Listar pedidos con filtros',
      tags: ['pedidos'],
      querystring: listPedidosSchema,
      response: {
        200: pedidosListResponseSchema,
        401: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { limit, offset, estado_id, cliente_id, fecha_desde, fecha_hasta } = request.query;
      const currentUser = request.user as { id: number; rol: string };

      // Si es cliente, solo puede ver sus propios pedidos
      let filtroClienteId = cliente_id;

      if (currentUser.rol === 'cliente') {
        const clienteResult = await pool.query<{ id: number }>(
          'SELECT id FROM clientes WHERE usuario_id = $1',
          [currentUser.id]
        );

        if (clienteResult.rows.length === 0) {
          return {
            pedidos: [],
            total: 0,
            limit,
            offset,
          };
        }

        const clienteRow = clienteResult.rows[0];
        if (!clienteRow) {
          return {
            pedidos: [],
            total: 0,
            limit,
            offset,
          };
        }

        filtroClienteId = clienteRow.id;
      }

      const result = await listPedidos(limit, offset, {
        estado_id,
        cliente_id: filtroClienteId,
        fecha_desde,
        fecha_hasta,
      });

      if (!result.success) {
        return reply.code(500).send({
          error: 'Error interno',
          message: result.message || 'Error al listar pedidos',
        });
      }

      return {
        pedidos: result.pedidos || [],
        total: result.total || 0,
        limit: result.limit || 20,
        offset: result.offset || 0,
      };
    },
  });

  // GET /pedidos/:id - Obtener detalle de pedido (todos los usuarios autenticados)
  fastify.route({
    method: 'GET',
    url: '/:id',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Obtener detalle completo de un pedido',
      tags: ['pedidos'],
      params: getPedidoByIdSchema,
      response: {
        200: pedidoResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const currentUser = request.user as { id: number; rol: string };

      const result = await getPedidoById(id);

      if (!result.success || !result.pedido) {
        return reply.code(404).send({
          error: 'Pedido no encontrado',
          message: result.message || 'El pedido no existe',
        });
      }

      // Si es cliente, verificar que sea su pedido
      if (currentUser.rol === 'cliente') {
        const clienteResult = await pool.query<{ id: number }>(
          'SELECT id FROM clientes WHERE usuario_id = $1',
          [currentUser.id]
        );

        if (clienteResult.rows.length > 0) {
          const clienteRow = clienteResult.rows[0];
          if (clienteRow && result.pedido.cliente_id !== clienteRow.id) {
            return reply.code(403).send({
              error: 'Acceso denegado',
              message: 'No tiene permiso para ver este pedido',
            });
          }
        }
      }

      return result.pedido;
    },
  });

  // PATCH /pedidos/:id/confirmar - Confirmar pedido (gerente, admin)
  fastify.route({
    method: 'PATCH',
    url: '/:id/confirmar',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Confirmar pedido y asignar recursos (camión y conductor)',
      tags: ['pedidos'],
      params: getPedidoByIdSchema,
      body: confirmarPedidoSchema,
      response: {
        200: pedidoSuccessResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const data = request.body;

      const result = await confirmarPedido(id, data);

      if (!result.success || !result.pedido) {
        const statusCode = result.message?.includes('no encontrado') ? 404 : 400;
        return reply.code(statusCode).send({
          error: 'Error al confirmar pedido',
          message: result.message || 'No se pudo confirmar el pedido',
        });
      }

      return {
        message: result.message || 'Pedido confirmado exitosamente',
        pedido: result.pedido,
      };
    },
  });

  // PUT /pedidos/:id/asignar - Reasignar recursos (gerente, admin)
  fastify.route({
    method: 'PUT',
    url: '/:id/asignar',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Reasignar camión y conductor a un pedido',
      tags: ['pedidos'],
      params: getPedidoByIdSchema,
      body: reasignarPedidoSchema,
      response: {
        200: pedidoSuccessResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const data = request.body;

      const result = await reasignarPedido(id, data);

      if (!result.success || !result.pedido) {
        const statusCode = result.message?.includes('no encontrado') ? 404 : 400;
        return reply.code(statusCode).send({
          error: 'Error al reasignar recursos',
          message: result.message || 'No se pudo reasignar los recursos',
        });
      }

      return {
        message: result.message || 'Recursos reasignados exitosamente',
        pedido: result.pedido,
      };
    },
  });

  // PATCH /pedidos/:id/cancelar - Cancelar pedido (cliente si PENDIENTE, admin siempre)
  fastify.route({
    method: 'PATCH',
    url: '/:id/cancelar',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Cancelar un pedido (cliente solo si está pendiente)',
      tags: ['pedidos'],
      params: getPedidoByIdSchema,
      body: cancelarPedidoSchema,
      response: {
        200: pedidoSuccessResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const { motivo } = request.body;
      const currentUser = request.user as { id: number; rol: string };

      // Verificar permisos
      const pedidoResult = await getPedidoById(id);

      if (!pedidoResult.success || !pedidoResult.pedido) {
        return reply.code(404).send({
          error: 'Pedido no encontrado',
          message: 'El pedido no existe',
        });
      }

      // Si es cliente, verificar que sea su pedido
      if (currentUser.rol === 'cliente') {
        const clienteResult = await pool.query<{ id: number }>(
          'SELECT id FROM clientes WHERE usuario_id = $1',
          [currentUser.id]
        );

        if (clienteResult.rows.length === 0) {
          return reply.code(403).send({
            error: 'Acceso denegado',
            message: 'No tiene permiso para cancelar pedidos',
          });
        }

        const clienteRow = clienteResult.rows[0];
        if (!clienteRow) {
          return reply.code(403).send({
            error: 'Acceso denegado',
            message: 'No tiene permiso para cancelar pedidos',
          });
        }

        if (pedidoResult.pedido.cliente_id !== clienteRow.id) {
          return reply.code(403).send({
            error: 'Acceso denegado',
            message: 'No tiene permiso para cancelar este pedido',
          });
        }
      }

      const result = await cancelarPedido(id, motivo);

      if (!result.success || !result.pedido) {
        return reply.code(400).send({
          error: 'Error al cancelar pedido',
          message: result.message || 'No se pudo cancelar el pedido',
        });
      }

      return {
        message: result.message || 'Pedido cancelado exitosamente',
        pedido: result.pedido,
      };
    },
  });

  // DELETE /pedidos/:id - Eliminar pedido (solo admin, solo cancelados)
  fastify.route({
    method: 'DELETE',
    url: '/:id',
    onRequest: [fastify.authenticate, fastify.requireRole('admin')],
    schema: {
      description: 'Eliminar un pedido cancelado (solo administrador)',
      tags: ['pedidos'],
      params: getPedidoByIdSchema,
      response: {
        200: z.object({
          message: z.string(),
        }),
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;

      const result = await deletePedido(id);

      if (!result.success) {
        return reply.code(400).send({
          error: 'Error al eliminar pedido',
          message: result.message,
        });
      }

      return {
        message: result.message,
      };
    },
  });

  // GET /pedidos/:id/historial - Ver historial de estados (gerente, admin)
  fastify.route({
    method: 'GET',
    url: '/:id/historial',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtener historial completo de cambios de estado',
      tags: ['pedidos'],
      params: getPedidoByIdSchema,
      response: {
        200: z.object({
          historial: z.array(historialEstadoSchema),
        }),
        401: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;

      const result = await getHistorialEstados(id);

      if (!result.success) {
        const statusCode = result.message?.includes('no encontrado') ? 404 : 500;
        return reply.code(statusCode).send({
          error: 'Error al obtener historial',
          message: result.message || 'No se pudo obtener el historial',
        });
      }

      return {
        historial: result.historial || [],
      };
    },
  });

  // GET /pedidos/estadisticas - Obtener estadísticas de pedidos (admin, gerente)
  fastify.route({
    method: 'GET',
    url: '/estadisticas',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtener estadísticas generales de pedidos',
      tags: ['pedidos'],
      querystring: getEstadisticasQuerySchema,
      response: {
        200: estadisticasPedidosResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { dias } = request.query;
      const result = await getEstadisticas(dias);

      if (!result.success || !result.data) {
        return reply.code(500).send({
          error: 'Error interno',
          message: result.message || 'Error al obtener estadísticas',
        });
      }

      return result.data;
    },
  });

  // GET /pedidos/:id/ruta - Calcular ruta óptima usando Neo4j (admin, gerente)
  fastify.route({
    method: 'GET',
    url: '/:id/ruta',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Calcular ruta óptima desde la planta hasta la ubicación de entrega del pedido usando Neo4j',
      tags: ['pedidos'],
      params: getPedidoByIdSchema,
      response: {
        200: z.object({
          pedido_id: z.number(),
          ruta_calculada: z.object({
            nodos: z.array(z.object({
              id: z.string(),
              nombre: z.string(),
              tipo: z.string(),
              latitud: z.number(),
              longitud: z.number()
            })),
            segmentos: z.array(z.object({
              origen: z.string(),
              destino: z.string(),
              distancia_km: z.number(),
              tiempo_minutos: z.number()
            })),
            distancia_total_km: z.number(),
            tiempo_total_minutos: z.number()
          }),
          interseccion_destino: z.object({
            id: z.string(),
            nombre: z.string(),
            distancia_metros: z.number()
          }),
          distancia_total_km: z.number(),
          tiempo_estimado_minutos: z.number()
        }),
        401: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        // Calcular ruta usando Neo4j
        const rutaCompleta = await calcularRutaHastaPedido(id);

        return {
          pedido_id: id,
          ruta_calculada: rutaCompleta.ruta_calculada,
          interseccion_destino: {
            id: rutaCompleta.interseccion_destino.id,
            nombre: rutaCompleta.interseccion_destino.nombre,
            distancia_metros: rutaCompleta.interseccion_destino.distancia_metros
          },
          distancia_total_km: rutaCompleta.distancia_total_km,
          tiempo_estimado_minutos: Math.round(rutaCompleta.tiempo_estimado_minutos)
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

        if (errorMessage.includes('no encontrado')) {
          return reply.code(404).send({
            error: 'Pedido no encontrado',
            message: errorMessage
          });
        }

        return reply.code(500).send({
          error: 'Error al calcular ruta',
          message: errorMessage
        });
      }
    },
  });
};

export default pedidosRoutes;
