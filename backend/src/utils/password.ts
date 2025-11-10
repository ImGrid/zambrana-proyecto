import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

// Salt rounds según el entorno: 12 en producción, 10 en desarrollo
const SALT_ROUNDS = env.NODE_ENV === 'production' ? 12 : 10;

// Hashear password con bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verificar password contra hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Verificar si un hash necesita ser actualizado
export function needsRehash(hash: string): boolean {
  const rounds = bcrypt.getRounds(hash);
  return rounds < SALT_ROUNDS;
}
