import { pool } from '../../database/postgres/pool.js';

// Tipos para las filas de la base de datos
export interface UsuarioRow {
  id: number;
  email: string;
  password_hash: string;
  rol_id: number;
  nombre: string;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
  rol?: string;
}

export interface UsuarioListItem {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  created_at: Date;
}

// Listar todos los usuarios con paginacion
export async function findAllUsuarios(
  limit: number = 20,
  offset: number = 0
): Promise<UsuarioListItem[]> {
  const result = await pool.query<UsuarioRow>(
    `SELECT
      u.id,
      u.email,
      u.nombre,
      u.activo,
      u.created_at,
      r.nombre as rol
    FROM usuarios u
    INNER JOIN roles_usuario r ON u.rol_id = r.id
    ORDER BY u.created_at DESC
    LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows.map(row => ({
    id: row.id,
    email: row.email,
    nombre: row.nombre,
    rol: row.rol || 'cliente',
    activo: row.activo,
    created_at: row.created_at
  }));
}

// Contar total de usuarios
export async function countUsuarios(): Promise<number> {
  const result = await pool.query<{ count: string }>(
    'SELECT COUNT(*) as count FROM usuarios'
  );

  // Verificar que existan resultados antes de acceder a rows[0]
  if (result.rows.length === 0) {
    return 0;
  }

  const row = result.rows[0];
  if (!row) {
    return 0;
  }

  return parseInt(row.count, 10);
}

// Buscar usuario por ID
export async function findUsuarioById(id: number): Promise<UsuarioListItem | null> {
  const result = await pool.query<UsuarioRow>(
    `SELECT
      u.id,
      u.email,
      u.nombre,
      u.activo,
      u.created_at,
      r.nombre as rol
    FROM usuarios u
    INNER JOIN roles_usuario r ON u.rol_id = r.id
    WHERE u.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    nombre: row.nombre,
    rol: row.rol || 'cliente',
    activo: row.activo,
    created_at: row.created_at
  };
}

// Buscar usuario por email
export async function findUsuarioByEmail(email: string): Promise<UsuarioRow | null> {
  const result = await pool.query<UsuarioRow>(
    `SELECT
      u.id,
      u.email,
      u.password_hash,
      u.rol_id,
      u.nombre,
      u.activo,
      u.created_at,
      u.updated_at,
      r.nombre as rol
    FROM usuarios u
    INNER JOIN roles_usuario r ON u.rol_id = r.id
    WHERE u.email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return row;
}

// Actualizar usuario
export async function updateUsuario(
  id: number,
  data: { nombre?: string; rol_id?: number; activo?: boolean }
): Promise<UsuarioListItem | null> {
  const updates: string[] = [];
  const values: (string | number | boolean)[] = [];
  let paramIndex = 1;

  if (data.nombre !== undefined) {
    updates.push(`nombre = $${paramIndex++}`);
    values.push(data.nombre);
  }

  if (data.rol_id !== undefined) {
    updates.push(`rol_id = $${paramIndex++}`);
    values.push(data.rol_id);
  }

  if (data.activo !== undefined) {
    updates.push(`activo = $${paramIndex++}`);
    values.push(data.activo);
  }

  if (updates.length === 0) {
    return findUsuarioById(id);
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query<UsuarioRow>(
    `UPDATE usuarios
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, email, nombre, rol_id, activo, created_at`,
    values
  );

  if (result.rows.length === 0) {
    return null;
  }

  return findUsuarioById(id);
}

// Desactivar usuario (soft delete)
export async function deactivateUsuario(id: number): Promise<boolean> {
  const result = await pool.query(
    `UPDATE usuarios
    SET activo = false, updated_at = NOW()
    WHERE id = $1`,
    [id]
  );

  return result.rowCount !== null && result.rowCount > 0;
}

// Cambiar contraseña
export async function updatePassword(
  id: number,
  newPasswordHash: string
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE usuarios
    SET password_hash = $1, updated_at = NOW()
    WHERE id = $2`,
    [newPasswordHash, id]
  );

  return result.rowCount !== null && result.rowCount > 0;
}

// Verificar si email existe (para validaciones)
export async function emailExists(email: string, excludeId?: number): Promise<boolean> {
  let query = 'SELECT EXISTS(SELECT 1 FROM usuarios WHERE email = $1';
  const values: (string | number)[] = [email];

  if (excludeId !== undefined) {
    query += ' AND id != $2';
    values.push(excludeId);
  }

  query += ') as exists';

  const result = await pool.query<{ exists: boolean }>(query, values);

  // Verificar que existan resultados antes de acceder a rows[0]
  if (result.rows.length === 0) {
    return false;
  }

  const row = result.rows[0];
  if (!row) {
    return false;
  }

  return row.exists;
}
