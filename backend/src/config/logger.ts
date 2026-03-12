import { env } from './env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import type { FastifyBaseLogger, FastifyServerOptions } from 'fastify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para redactar datos sensibles en logs
const redactSensitiveData = (key: string, value: unknown): unknown => {
  const sensitiveKeys = [
    'password',
    'token',
    'jwt',
    'authorization',
    'secret',
    'apikey',
    'api_key',
  ];

  if (typeof key === 'string' && sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
    return '[REDACTED]';
  }

  return value;
};

// Configuración de Pino según el entorno
export const createLoggerConfig = (): FastifyServerOptions['logger'] => {
  const isDevelopment = env.NODE_ENV === 'development';

  // Configuración base
  const baseConfig = {
    level: isDevelopment ? 'debug' : 'info',

    // Redactar datos sensibles
    serializers: {
      req: (req: any) => ({
        method: req.method,
        url: req.url,
        // No incluir headers completos (pueden tener tokens)
        userAgent: req.headers?.['user-agent'],
        ip: req.ip,
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
      }),
    },

    // Hook para redactar datos sensibles en todo el log
    hooks: {
      logMethod(inputArgs: any[], method: any) {
        // Redactar datos sensibles del objeto de log
        if (inputArgs.length >= 2 && typeof inputArgs[0] === 'object') {
          const logObj = inputArgs[0];
          for (const key in logObj) {
            logObj[key] = redactSensitiveData(key, logObj[key]);
          }
        }
        return method.apply(this, inputArgs);
      },
    },
  };

  // Desarrollo: logs bonitos en consola
  if (isDevelopment) {
    return {
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    };
  }

  // Producción: logs a archivo con rotación
  const logsDir = path.resolve(__dirname, '../../logs');

  return {
    ...baseConfig,
    transport: {
      targets: [
        // Target 1: Archivo con rotación diaria
        {
          target: 'pino-roll',
          level: 'info',
          options: {
            file: path.join(logsDir, 'app.log'),
            frequency: 'daily',
            mkdir: true,
          },
        },
        // Target 2: Errores en archivo separado
        {
          target: 'pino-roll',
          level: 'error',
          options: {
            file: path.join(logsDir, 'error.log'),
            frequency: 'daily',
            mkdir: true,
          },
        },
        // Target 3: También en consola (para Docker/PM2)
        {
          target: 'pino/file',
          level: 'info',
          options: {
            destination: 1, // stdout
          },
        },
      ],
    },
  };
};
