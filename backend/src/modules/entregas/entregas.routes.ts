import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import * as entregasService from './entregas.service.js';
import {
  iniciarEntregaSchema,
  recibirGPSSchema,
  finalizarEntregaSchema,
  paginacionSchema,
  idParamSchema
} from './entregas.schemas.js';

const entregasRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // POST /entregas/iniciar - Inicia una nueva entrega para un pedido confirmado
  fastify.route({
    method: 'POST',
    url: '/iniciar',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Inicia una nueva entrega para un pedido confirmado',
      tags: ['entregas'],
      body: iniciarEntregaSchema,
      response: {
        200: z.object({
          success: z.boolean(),
          data: z.any(),
          mensaje: z.string()
        }),
        400: z.object({
          success: z.boolean(),
          error: z.string()
        }),
        403: z.object({
          success: z.boolean(),
          error: z.string()
        })
      }
    },
    handler: async (request, reply) => {
      try {
        const { pedido_id } = request.body;

        const entrega = await entregasService.iniciarEntrega(pedido_id);

        return {
          success: true,
          data: entrega,
          mensaje: 'Entrega iniciada exitosamente'
        };
      } catch (error: any) {
        fastify.log.error('Error al iniciar entrega:', error);
        return reply.code(400).send({
          success: false,
          error: error.message || 'Error al iniciar entrega'
        });
      }
    }
  });

  // POST /entregas/:id/gps - Registra posicion GPS del camion
  fastify.route({
    method: 'POST',
    url: '/:id/gps',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Registra posicion GPS del camion durante la entrega',
      tags: ['entregas', 'gps'],
      params: idParamSchema,
      body: recibirGPSSchema,
      response: {
        200: z.object({
          success: z.boolean(),
          data: z.any()
        }),
        400: z.object({
          success: z.boolean(),
          error: z.string()
        })
      }
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        const gpsData = request.body;

        const resultado = await entregasService.recibirPosicionGPS(
          id,
          gpsData.latitud,
          gpsData.longitud,
          gpsData.velocidad_kmh,
          gpsData.direccion_grados,
          gpsData.precision_metros,
          gpsData.timestamp ? new Date(gpsData.timestamp) : undefined
        );

        return {
          success: true,
          data: resultado
        };
      } catch (error: any) {
        fastify.log.error('Error al registrar GPS:', error);
        return reply.code(400).send({
          success: false,
          error: error.message || 'Error al registrar posicion GPS'
        });
      }
    }
  });

  // PATCH /entregas/:id/finalizar - Finaliza una entrega
  fastify.route({
    method: 'PATCH',
    url: '/:id/finalizar',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Finaliza una entrega registrando firma y foto del cliente',
      tags: ['entregas'],
      params: idParamSchema,
      body: finalizarEntregaSchema,
      response: {
        200: z.object({
          success: z.boolean(),
          data: z.any(),
          mensaje: z.string()
        }),
        400: z.object({
          success: z.boolean(),
          error: z.string()
        })
      }
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        const finalizarData = request.body;

        const resultado = await entregasService.finalizarEntrega(
          id,
          finalizarData.firma_cliente,
          finalizarData.foto_comprobante,
          finalizarData.observaciones
        );

        return {
          success: true,
          data: resultado,
          mensaje: 'Entrega finalizada exitosamente'
        };
      } catch (error: any) {
        fastify.log.error('Error al finalizar entrega:', error);
        return reply.code(400).send({
          success: false,
          error: error.message || 'Error al finalizar entrega'
        });
      }
    }
  });

  // GET /entregas/:id - Obtiene estado actual de una entrega
  fastify.route({
    method: 'GET',
    url: '/:id',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Obtiene estado actual de una entrega con ultima posicion GPS',
      tags: ['entregas'],
      params: idParamSchema,
      response: {
        200: z.object({
          success: z.boolean(),
          data: z.any()
        }),
        404: z.object({
          success: z.boolean(),
          error: z.string()
        })
      }
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params;

        const estado = await entregasService.obtenerEstadoEntrega(id);

        return {
          success: true,
          data: estado
        };
      } catch (error: any) {
        fastify.log.error('Error al obtener estado de entrega:', error);
        return reply.code(404).send({
          success: false,
          error: error.message || 'Entrega no encontrada'
        });
      }
    }
  });

  // GET /entregas/activas - Obtiene todas las entregas activas
  fastify.route({
    method: 'GET',
    url: '/activas',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Obtiene todas las entregas activas (EN_CAMINO)',
      tags: ['entregas'],
      response: {
        200: z.object({
          success: z.boolean(),
          data: z.array(z.any()),
          total: z.number()
        }),
        500: z.object({
          success: z.boolean(),
          error: z.string()
        })
      }
    },
    handler: async (request, reply) => {
      try {
        const entregas = await entregasService.obtenerEntregasActivas();

        return {
          success: true,
          data: entregas,
          total: entregas.length
        };
      } catch (error: any) {
        fastify.log.error('Error al obtener entregas activas:', error);
        return reply.code(500).send({
          success: false,
          error: 'Error al obtener entregas activas'
        });
      }
    }
  });

  // GET /entregas/:id/historial - Obtiene historial de tracking de una entrega
  fastify.route({
    method: 'GET',
    url: '/:id/historial',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Obtiene historial completo de tracking de una entrega',
      tags: ['entregas', 'gps'],
      params: idParamSchema,
      querystring: paginacionSchema,
      response: {
        200: z.object({
          success: z.boolean(),
          data: z.any()
        }),
        404: z.object({
          success: z.boolean(),
          error: z.string()
        })
      }
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        const { limite, offset } = request.query;

        const historial = await entregasService.obtenerHistorialTracking(id, limite, offset);

        return {
          success: true,
          data: historial
        };
      } catch (error: any) {
        fastify.log.error('Error al obtener historial:', error);
        return reply.code(404).send({
          success: false,
          error: error.message || 'Error al obtener historial'
        });
      }
    }
  });

  // GET /entregas/:id/eventos - Obtiene historial de eventos de una entrega
  fastify.route({
    method: 'GET',
    url: '/:id/eventos',
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Obtiene historial de eventos de una entrega',
      tags: ['entregas'],
      params: idParamSchema,
      response: {
        200: z.object({
          success: z.boolean(),
          data: z.any()
        }),
        404: z.object({
          success: z.boolean(),
          error: z.string()
        })
      }
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params;

        const eventos = await entregasService.obtenerEventosEntrega(id);

        return {
          success: true,
          data: eventos
        };
      } catch (error: any) {
        fastify.log.error('Error al obtener eventos:', error);
        return reply.code(404).send({
          success: false,
          error: error.message || 'Error al obtener eventos'
        });
      }
    }
  });

  // PATCH /entregas/:id/cancelar - Cancela una entrega en progreso
  fastify.route({
    method: 'PATCH',
    url: '/:id/cancelar',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Cancela una entrega en progreso',
      tags: ['entregas'],
      params: idParamSchema,
      body: z.object({
        motivo: z.string().min(10).max(500)
      }),
      response: {
        200: z.object({
          success: z.boolean(),
          data: z.any()
        }),
        400: z.object({
          success: z.boolean(),
          error: z.string()
        }),
        403: z.object({
          success: z.boolean(),
          error: z.string()
        })
      }
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        const { motivo } = request.body;

        const resultado = await entregasService.cancelarEntrega(id, motivo);

        return {
          success: true,
          data: resultado
        };
      } catch (error: any) {
        fastify.log.error('Error al cancelar entrega:', error);
        return reply.code(400).send({
          success: false,
          error: error.message || 'Error al cancelar entrega'
        });
      }
    }
  });

  // GET /entregas/estadisticas - Obtiene estadisticas generales de entregas
  fastify.route({
    method: 'GET',
    url: '/estadisticas',
    onRequest: [fastify.authenticate, fastify.requireRole('admin', 'gerente')],
    schema: {
      description: 'Obtiene estadisticas generales de entregas',
      tags: ['entregas'],
      response: {
        200: z.object({
          success: z.boolean(),
          data: z.any()
        }),
        403: z.object({
          success: z.boolean(),
          error: z.string()
        }),
        500: z.object({
          success: z.boolean(),
          error: z.string()
        })
      }
    },
    handler: async (request, reply) => {
      try {
        const estadisticas = await entregasService.obtenerEstadisticasEntregas();

        return {
          success: true,
          data: estadisticas
        };
      } catch (error: any) {
        fastify.log.error('Error al obtener estadisticas:', error);
        return reply.code(500).send({
          success: false,
          error: 'Error al obtener estadisticas'
        });
      }
    }
  });
};

export default entregasRoutes;
