import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import hyperid from 'hyperid';
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider
} from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import { createLoggerConfig } from './config/logger.js';
import { globalRateLimitConfig } from './config/rate-limit.config.js';
import { healthRoutes } from './modules/health/health.routes.js';
import authPlugin from './plugins/auth.plugin.js';
import schedulerPlugin from './plugins/scheduler.plugin.js';
import authRoutes from './modules/auth/auth.routes.js';
import usuariosRoutes from './modules/usuarios/usuarios.routes.js';
import materialesRoutes from './modules/materiales/materiales.routes.js';
import camionesRoutes from './modules/camiones/camiones.routes.js';
import conductoresRoutes from './modules/conductores/conductores.routes.js';
import clientesRoutes from './modules/clientes/clientes.routes.js';
import pedidosRoutes from './modules/pedidos/pedidos.routes.js';
import entregasRoutes from './modules/entregas/entregas.routes.js';
import reportesRoutes from './modules/reportes/reportes.routes.js';
import sistemaExpertoRoutes from './modules/sistema-experto/sistema-experto.routes.js';
import grafoRoutes from './modules/grafo/grafo.routes.js';

// Generador de Request IDs único y rápido
const generateRequestId = hyperid();

// Construir y configurar la aplicación Fastify
export const buildApp = async () => {
  const app = Fastify({
    // Configuración de Request ID
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    genReqId: (req) => {
      // Si el cliente envía un request ID, usarlo; sino, generar uno nuevo
      return req.headers['x-request-id'] as string || generateRequestId();
    },

    // Logger configurado con logging avanzado (archivos + rotación + redacción)
    logger: createLoggerConfig(),
  }).withTypeProvider<ZodTypeProvider>();

  // Configurar validadores y serializadores de Zod
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Hook para incluir Request ID en headers de respuesta
  app.addHook('onSend', async (request, reply) => {
    // Agregar Request ID al header de respuesta
    reply.header('x-request-id', request.id);
  });

  // Configurar Swagger para documentación automática
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Agregados Zambrana API',
        description: 'Sistema de Tracking GPS para distribución de materiales de construcción',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Servidor de desarrollo',
        },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(fastifySwaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Plugins de seguridad
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  });

  // Configuración segura de CORS con whitelist
  const getAllowedOrigins = () => {
    if (env.NODE_ENV === 'production') {
      return [
        'https://tudominio.com',
        'https://www.tudominio.com'
      ];
    }

    // Desarrollo: whitelist de localhost (NO usar origin: true por seguridad)
    return [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5500',
      'http://localhost:5500'
    ];
  };

  await app.register(cors, {
    origin: getAllowedOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['Content-Length', 'X-Request-ID'],
    maxAge: 86400,  // Cache preflight 24 horas
    strictPreflight: true,
  });

  // Registrar rate limiting global (configurado con global: false)
  // Se aplicará por ruta específica según configuración
  await app.register(rateLimit, globalRateLimitConfig);

  // Registrar plugin de autenticación
  await app.register(authPlugin);

  // Registrar scheduler para refresh automatico de vistas materializadas
  await app.register(schedulerPlugin);

  // Registrar rutas
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(usuariosRoutes, { prefix: '/api/usuarios' });
  await app.register(materialesRoutes, { prefix: '/api/materiales' });
  await app.register(camionesRoutes, { prefix: '/api/camiones' });
  await app.register(conductoresRoutes, { prefix: '/api/conductores' });
  await app.register(clientesRoutes, { prefix: '/api/clientes' });
  await app.register(pedidosRoutes, { prefix: '/api/pedidos' });
  await app.register(entregasRoutes, { prefix: '/api/entregas' });
  await app.register(reportesRoutes, { prefix: '/api/reportes' });
  await app.register(sistemaExpertoRoutes, { prefix: '/api/sistema-experto' });
  await app.register(grafoRoutes, { prefix: '/api/grafo' });

  // Ruta raíz
  app.get('/', async (_request, reply) => {
    return reply.send({
      message: 'Sistema de Tracking GPS - Agregados Zambrana',
      version: '1.0.0',
      environment: env.NODE_ENV,
    });
  });

  // Manejador de errores global
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

    return reply.status(error.statusCode ?? 500).send({
      error: error.name,
      message: error.message,
      statusCode: error.statusCode ?? 500,
    });
  });

  return app;
};
