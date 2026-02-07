import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  loginSchema,
  registerSchema,
  registerPublicSchema,
  loginResponseSchema,
  refreshResponseSchema,
  refreshBodySchema,
  messageResponseSchema,
  userSchema,
} from './auth.schemas.js';
import { registerUser, loginUser, getUserById, registerPublicUser } from './auth.service.js';
import { env } from '../../config/env.js';
import { rateLimitConfigs } from '../../config/rate-limit.config.js';

const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // POST /register - Registrar nuevo usuario (admin)
  fastify.route({
    method: 'POST',
    url: '/register',
    config: {
      rateLimit: rateLimitConfigs.auth.register,
    },
    schema: {
      description: 'Registrar un nuevo usuario en el sistema (uso administrativo)',
      tags: ['auth'],
      body: registerSchema,
      response: {
        201: loginResponseSchema,
        400: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { email, password, rol, nombre } = request.body;

      const result = await registerUser(email, password, rol, nombre);

      if (!result.success || !result.user) {
        return reply.code(400).send({
          error: 'Error de registro',
          message: result.message || 'No se pudo registrar el usuario',
        });
      }

      // Generar tokens
      const accessToken = await reply.jwtSign(
        { id: result.user.id, rol: result.user.rol },
        { expiresIn: '10m' }
      );

      const refreshToken = await reply.jwtSign(
        { id: result.user.id, type: 'refresh' },
        { expiresIn: '7d' }
      );

      // Establecer cookie segura con refresh token
      reply.setCookie('refreshToken', refreshToken, {
        path: '/',
        secure: env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 días en segundos
      });

      return reply.code(201).send({
        accessToken,
        refreshToken,
        user: result.user,
      });
    },
  });

  // POST /register/public - Registro público para clientes
  fastify.route({
    method: 'POST',
    url: '/register/public',
    config: {
      rateLimit: rateLimitConfigs.auth.registerPublic,
    },
    schema: {
      description: 'Registro público para nuevos clientes',
      tags: ['auth'],
      body: registerPublicSchema,
      response: {
        201: loginResponseSchema,
        400: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { nombre, email, password, tipo_cliente_id, telefono } = request.body;

      const result = await registerPublicUser({
        nombre,
        email,
        password,
        tipo_cliente_id,
        telefono,
      });

      if (!result.success || !result.user) {
        return reply.code(400).send({
          error: 'Error de registro',
          message: result.message || 'No se pudo registrar el usuario',
        });
      }

      // Generar tokens
      const accessToken = await reply.jwtSign(
        { id: result.user.id, rol: result.user.rol },
        { expiresIn: '10m' }
      );

      const refreshToken = await reply.jwtSign(
        { id: result.user.id, type: 'refresh' },
        { expiresIn: '7d' }
      );

      // Establecer cookie segura con refresh token
      reply.setCookie('refreshToken', refreshToken, {
        path: '/',
        secure: env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 días en segundos
      });

      return reply.code(201).send({
        accessToken,
        refreshToken,
        user: result.user,
      });
    },
  });

  // POST /login - Iniciar sesión
  fastify.route({
    method: 'POST',
    url: '/login',
    config: {
      rateLimit: rateLimitConfigs.auth.login,
    },
    schema: {
      description: 'Iniciar sesión con email y contraseña',
      tags: ['auth'],
      body: loginSchema,
      response: {
        200: loginResponseSchema,
        401: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { email, password } = request.body;

      const result = await loginUser(email, password);

      if (!result.success || !result.user) {
        return reply.code(401).send({
          error: 'Credenciales inválidas',
          message: result.message || 'Email o contraseña incorrectos',
        });
      }

      // Generar access token (corto)
      const accessToken = await reply.jwtSign(
        { id: result.user.id, rol: result.user.rol },
        { expiresIn: '10m' }
      );

      // Generar refresh token (largo)
      const refreshToken = await reply.jwtSign(
        { id: result.user.id, type: 'refresh' },
        { expiresIn: '7d' }
      );

      // Establecer cookie segura con refresh token
      reply.setCookie('refreshToken', refreshToken, {
        path: '/',
        secure: env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 días en segundos
      });

      return {
        accessToken,
        refreshToken,
        user: result.user,
      };
    },
  });

  // POST /refresh - Renovar access token usando refresh token
  fastify.route({
    method: 'POST',
    url: '/refresh',
    config: {
      rateLimit: rateLimitConfigs.auth.general,
    },
    schema: {
      description: 'Renovar access token usando refresh token (cookie o body)',
      tags: ['auth'],
      body: refreshBodySchema,
      response: {
        200: refreshResponseSchema,
        401: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      try {
        // Verificar refresh token desde body (movil) o cookie (web)
        const bodyToken = (request.body as { refreshToken?: string })?.refreshToken;
        let payload: { id: number; type?: string };

        if (bodyToken) {
          // Ruta movil: token en body
          const decoded = fastify.jwt.verify<{ id: number; type?: string }>(bodyToken);
          payload = decoded;
        } else {
          // Ruta web: token en cookie
          await request.jwtVerify({ onlyCookie: true });
          payload = request.user as { id: number; type?: string };
        }

        // Verificar que sea un refresh token
        if (payload.type !== 'refresh') {
          return reply.code(401).send({
            error: 'Token inválido',
            message: 'Este no es un refresh token válido',
          });
        }

        // Obtener usuario de la base de datos para incluir el rol
        const user = await getUserById(payload.id);

        if (!user) {
          return reply.code(401).send({
            error: 'Usuario no encontrado',
            message: 'El usuario ya no existe en el sistema',
          });
        }

        // Generar nuevo access token con el rol incluido
        const accessToken = await reply.jwtSign(
          { id: user.id, rol: user.rol },
          { expiresIn: '10m' }
        );

        return { accessToken };
      } catch {
        return reply.code(401).send({
          error: 'Refresh token inválido',
          message: 'El refresh token ha expirado o es inválido',
        });
      }
    },
  });

  // POST /logout - Cerrar sesión
  fastify.route({
    method: 'POST',
    url: '/logout',
    config: {
      rateLimit: rateLimitConfigs.auth.general,
    },
    schema: {
      description: 'Cerrar sesión eliminando el refresh token',
      tags: ['auth'],
      response: {
        200: messageResponseSchema,
      },
    },
    handler: async (_request, reply) => {
      // Eliminar cookie de refresh token
      reply.clearCookie('refreshToken', { path: '/' });

      return {
        message: 'Sesión cerrada correctamente',
      };
    },
  });

  // GET /me - Obtener usuario actual (requiere autenticación)
  fastify.route({
    method: 'GET',
    url: '/me',
    onRequest: [fastify.authenticate],
    config: {
      rateLimit: rateLimitConfigs.auth.general,
    },
    schema: {
      description: 'Obtener información del usuario autenticado',
      tags: ['auth'],
      response: {
        200: userSchema,
        401: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const payload = request.user as { id: number };

      const user = await getUserById(payload.id);

      if (!user) {
        return reply.code(401).send({
          error: 'Usuario no encontrado',
          message: 'El usuario ya no existe en el sistema',
        });
      }

      return user;
    },
  });
};

export default authRoutes;
