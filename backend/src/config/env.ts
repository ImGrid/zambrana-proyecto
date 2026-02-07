import { z } from 'zod';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Definir schema de validación con Zod
const envSchema = z.object({
  // Aplicación
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),

  // PostgreSQL
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.string().default('5432').transform(Number),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),

  // Neo4j
  NEO4J_URI: z.string().url().default('bolt://localhost:7687'),
  NEO4J_USER: z.string().min(1),
  NEO4J_PASSWORD: z.string().min(1),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

// Validar y parsear variables de entorno
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Error en variables de entorno:');
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

// Exportar configuración validada y tipada
export const env = parseEnv();

// Exportar tipo inferido para usar en otros archivos
export type Env = z.infer<typeof envSchema>;
