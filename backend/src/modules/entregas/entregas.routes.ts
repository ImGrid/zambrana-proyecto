import { FastifyPluginAsync } from 'fastify';
import * as entregasService from './entregas.service.js';
import {
  iniciarEntregaSchema,
  recibirGPSSchema,
  finalizarEntregaSchema,
  paginacionSchema,
  idParamSchema
} from './entregas.schemas.js';

/**
 * Plugin de rutas para entregas y tracking GPS
 */
export const entregasRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/entregas/iniciar
   *
   * Inicia una nueva entrega para un pedido confirmado
   *
   * Requiere: Rol ADMIN o GERENTE
   */
  fastify.post(
    '/iniciar',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Inicia una nueva entrega para un pedido',
        tags: ['entregas'],
        body: iniciarEntregaSchema,
        response: {
          200: {
            description: 'Entrega iniciada exitosamente',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const user = request.user;

        if (!user || (user.rol !== 'admin' && user.rol !== 'gerente')) {
          return reply.status(403).send({
            success: false,
            error: 'No tienes permisos para iniciar entregas'
          });
        }

        const { pedido_id } = iniciarEntregaSchema.parse(request.body);

        const entrega = await entregasService.iniciarEntrega(pedido_id);

        return reply.send({
          success: true,
          data: entrega,
          mensaje: 'Entrega iniciada exitosamente'
        });
      } catch (error: any) {
        fastify.log.error('Error al iniciar entrega:', error);
        return reply.status(400).send({
          success: false,
          error: error.message || 'Error al iniciar entrega'
        });
      }
    }
  );

  /**
   * POST /api/entregas/:id/gps
   *
   * Recibe una posicion GPS del camion durante la entrega
   *
   * Requiere: Autenticacion (CONDUCTOR puede enviar sus propias posiciones)
   */
  fastify.post(
    '/:id/gps',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Registra posicion GPS del camion',
        tags: ['entregas', 'gps'],
        params: idParamSchema,
        body: recibirGPSSchema,
        response: {
          200: {
            description: 'Posicion GPS registrada',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);
        const gpsData = recibirGPSSchema.parse(request.body);

        const resultado = await entregasService.recibirPosicionGPS(
          id,
          gpsData.latitud,
          gpsData.longitud,
          gpsData.velocidad_kmh,
          gpsData.direccion_grados,
          gpsData.precision_metros,
          gpsData.timestamp ? new Date(gpsData.timestamp) : undefined
        );

        return reply.send({
          success: true,
          data: resultado
        });
      } catch (error: any) {
        fastify.log.error('Error al registrar GPS:', error);
        return reply.status(400).send({
          success: false,
          error: error.message || 'Error al registrar posicion GPS'
        });
      }
    }
  );

  /**
   * PATCH /api/entregas/:id/finalizar
   *
   * Finaliza una entrega registrando firma y foto del cliente
   *
   * Requiere: Autenticacion (CONDUCTOR puede finalizar sus propias entregas)
   */
  fastify.patch(
    '/:id/finalizar',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Finaliza una entrega',
        tags: ['entregas'],
        params: idParamSchema,
        body: finalizarEntregaSchema,
        response: {
          200: {
            description: 'Entrega finalizada exitosamente',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);
        const finalizarData = finalizarEntregaSchema.parse(request.body);

        const resultado = await entregasService.finalizarEntrega(
          id,
          finalizarData.firma_cliente,
          finalizarData.foto_comprobante,
          finalizarData.observaciones
        );

        return reply.send({
          success: true,
          data: resultado,
          mensaje: 'Entrega finalizada exitosamente'
        });
      } catch (error: any) {
        fastify.log.error('Error al finalizar entrega:', error);
        return reply.status(400).send({
          success: false,
          error: error.message || 'Error al finalizar entrega'
        });
      }
    }
  );

  /**
   * GET /api/entregas/:id
   *
   * Obtiene el estado actual de una entrega con ultima posicion GPS
   *
   * Requiere: Autenticacion
   */
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Obtiene estado actual de una entrega',
        tags: ['entregas'],
        params: idParamSchema,
        response: {
          200: {
            description: 'Estado de la entrega',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);

        const estado = await entregasService.obtenerEstadoEntrega(id);

        return reply.send({
          success: true,
          data: estado
        });
      } catch (error: any) {
        fastify.log.error('Error al obtener estado de entrega:', error);
        return reply.status(404).send({
          success: false,
          error: error.message || 'Entrega no encontrada'
        });
      }
    }
  );

  /**
   * GET /api/entregas/activas
   *
   * Obtiene todas las entregas activas (EN_CAMINO)
   *
   * Requiere: Autenticacion
   */
  fastify.get(
    '/activas',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Obtiene todas las entregas activas',
        tags: ['entregas'],
        response: {
          200: {
            description: 'Lista de entregas activas',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const entregas = await entregasService.obtenerEntregasActivas();

        return reply.send({
          success: true,
          data: entregas,
          total: entregas.length
        });
      } catch (error: any) {
        fastify.log.error('Error al obtener entregas activas:', error);
        return reply.status(500).send({
          success: false,
          error: 'Error al obtener entregas activas'
        });
      }
    }
  );

  /**
   * GET /api/entregas/:id/historial
   *
   * Obtiene el historial completo de tracking de una entrega
   *
   * Requiere: Autenticacion
   */
  fastify.get(
    '/:id/historial',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Obtiene historial de tracking de una entrega',
        tags: ['entregas', 'gps'],
        params: idParamSchema,
        querystring: paginacionSchema,
        response: {
          200: {
            description: 'Historial de posiciones GPS',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);
        const { limite, offset } = paginacionSchema.parse(request.query);

        const historial = await entregasService.obtenerHistorialTracking(id, limite, offset);

        return reply.send({
          success: true,
          data: historial
        });
      } catch (error: any) {
        fastify.log.error('Error al obtener historial:', error);
        return reply.status(404).send({
          success: false,
          error: error.message || 'Error al obtener historial'
        });
      }
    }
  );

  /**
   * GET /api/entregas/:id/eventos
   *
   * Obtiene el historial de eventos de una entrega
   *
   * Requiere: Autenticacion
   */
  fastify.get(
    '/:id/eventos',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Obtiene eventos de una entrega',
        tags: ['entregas'],
        params: idParamSchema,
        response: {
          200: {
            description: 'Historial de eventos',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);

        const eventos = await entregasService.obtenerEventosEntrega(id);

        return reply.send({
          success: true,
          data: eventos
        });
      } catch (error: any) {
        fastify.log.error('Error al obtener eventos:', error);
        return reply.status(404).send({
          success: false,
          error: error.message || 'Error al obtener eventos'
        });
      }
    }
  );

  /**
   * PATCH /api/entregas/:id/cancelar
   *
   * Cancela una entrega en progreso
   *
   * Requiere: Rol ADMIN o GERENTE
   */
  fastify.patch(
    '/:id/cancelar',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Cancela una entrega',
        tags: ['entregas'],
        params: idParamSchema,
        body: {
          type: 'object',
          properties: {
            motivo: {
              type: 'string',
              minLength: 10,
              maxLength: 500,
              description: 'Motivo de la cancelacion'
            }
          },
          required: ['motivo']
        },
        response: {
          200: {
            description: 'Entrega cancelada',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const user = request.user;

        if (!user || (user.rol !== 'admin' && user.rol !== 'gerente')) {
          return reply.status(403).send({
            success: false,
            error: 'No tienes permisos para cancelar entregas'
          });
        }

        const { id } = idParamSchema.parse(request.params);
        const { motivo } = request.body as { motivo: string };

        const resultado = await entregasService.cancelarEntrega(id, motivo);

        return reply.send({
          success: true,
          data: resultado
        });
      } catch (error: any) {
        fastify.log.error('Error al cancelar entrega:', error);
        return reply.status(400).send({
          success: false,
          error: error.message || 'Error al cancelar entrega'
        });
      }
    }
  );

  /**
   * GET /api/entregas/estadisticas
   *
   * Obtiene estadisticas generales de entregas
   *
   * Requiere: Rol ADMIN o GERENTE
   */
  fastify.get(
    '/estadisticas',
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Obtiene estadisticas de entregas',
        tags: ['entregas']
      }
    },
    async (request, reply) => {
      try {
        const user = request.user;

        if (!user || (user.rol !== 'admin' && user.rol !== 'gerente')) {
          return reply.status(403).send({
            success: false,
            error: 'No tienes permisos para ver estadisticas'
          });
        }

        const estadisticas = await entregasService.obtenerEstadisticasEntregas();

        return reply.send({
          success: true,
          data: estadisticas
        });
      } catch (error: any) {
        fastify.log.error('Error al obtener estadisticas:', error);
        return reply.status(500).send({
          success: false,
          error: 'Error al obtener estadisticas'
        });
      }
    }
  );
};
