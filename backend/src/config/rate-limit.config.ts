import type { RateLimitPluginOptions } from '@fastify/rate-limit';

// Configuración centralizada de rate limiting para diferentes endpoints
// Basado en buenas prácticas de seguridad para producción

export const rateLimitConfigs = {
  // Autenticación - Protección contra brute force
  auth: {
    // Login - El más crítico, prevenir ataques de fuerza bruta
    login: {
      max: 10,
      timeWindow: '15 minutes',
      groupId: 'auth-login',
    } satisfies Partial<RateLimitPluginOptions>,

    // Registro administrativo - Moderadamente restrictivo
    register: {
      max: 10,
      timeWindow: '1 hour',
    } satisfies Partial<RateLimitPluginOptions>,

    // Registro público - Más restrictivo para prevenir spam
    registerPublic: {
      max: 10,
      timeWindow: '1 hour',
    } satisfies Partial<RateLimitPluginOptions>,

    // Endpoints generales de auth (refresh, logout, me)
    general: {
      max: 500,
      timeWindow: '10 minutes',
    } satisfies Partial<RateLimitPluginOptions>,
  },

  // Endpoints públicos
  public: {
    // Tracking público de pedidos
    tracking: {
      max: 1000,
      timeWindow: '10 minutes',
    } satisfies Partial<RateLimitPluginOptions>,

    // Health checks - Muy generoso para monitoring
    health: {
      max: 1000,
      timeWindow: '1 minute',
    } satisfies Partial<RateLimitPluginOptions>,
  },

  // Reportes - Consultas pesadas a vistas materializadas
  reportes: {
    dashboard: {
      max: 5000,
      timeWindow: '10 minutes',
    } satisfies Partial<RateLimitPluginOptions>,
  },
};

// Configuración global del plugin
// Se registra una sola vez en app.ts con global: false
export const globalRateLimitConfig: RateLimitPluginOptions = {
  global: false, // No aplicar a todas las rutas
  max: 5000, // Valor por defecto (no se usa si global: false)
  timeWindow: '1 minute',

  // Generar key por usuario autenticado o IP
  keyGenerator: (request) => {
    // Si el usuario está autenticado, usar su ID
    // Esto permite rate limiting por usuario en lugar de por IP
    const user = request.user as { id?: number } | undefined;
    if (user?.id) {
      return `user:${user.id}`;
    }
    // Fallback a IP para endpoints públicos
    return request.ip;
  },

  // Agregar headers informativos en las respuestas
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
    'retry-after': true,
  },

  // Continuar incrementando el contador incluso si ya se excedió
  continueExceeding: true,

  // Si hay error en el store, permitir la request (fail open)
  skipOnError: false,

  // Mensaje de error personalizado
  errorResponseBuilder: (_request, context) => {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Has excedido el límite de ${context.max} peticiones. Intenta nuevamente en ${Math.ceil(context.ttl / 1000)} segundos.`,
      expiresIn: context.ttl,
    };
  },
};
