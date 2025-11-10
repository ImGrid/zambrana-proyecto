import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config/env.js';

// Tipo para el payload del JWT
interface JWTPayload {
  id: number;
  rol?: string;
  type?: string;
}

// Plugin de autenticación con JWT y cookies
export default fp(async function (fastify: FastifyInstance) {
  // Registrar plugin de cookies
  await fastify.register(cookie);

  // Registrar JWT con soporte para cookies
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: 'refreshToken',
      signed: false,
    },
    sign: {
      expiresIn: '10m', // Access token por defecto
    },
  });

  // Decorador para verificar autenticación
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({
        error: 'No autorizado',
        message: 'Token inválido o expirado',
      });
    }
  });

  // Decorador para verificar roles
  fastify.decorate('requireRole', function (...roles: string[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;

      if (!user || !user.rol || !roles.includes(user.rol)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'No tienes permisos para acceder a este recurso',
        });
      }
    };
  });
});

// Declarar tipos para TypeScript
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (
      ...roles: string[]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// Extender el tipo de @fastify/jwt para definir el payload
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}
