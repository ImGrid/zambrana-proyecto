import { pool } from '../../database/postgres/pool.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';

interface User {
  id: number;
  email: string;
  rol: string;
  nombre: string;
  created_at: string;
}

interface LoginResult {
  success: boolean;
  user?: User;
  message?: string;
}

interface RegisterResult {
  success: boolean;
  user?: User;
  message?: string;
}

// Tipos para las filas de la base de datos
interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  rol_id: number;
  nombre: string;
  activo: boolean;
  created_at: Date;
  rol?: string;
}

// Mapeo de nombres de rol a IDs
const ROL_MAP: Record<string, number> = {
  'admin': 1,
  'gerente': 2,
  'conductor': 3,
  'cliente': 4
};

// Registrar un nuevo usuario
export async function registerUser(
  email: string,
  password: string,
  rol: string,
  nombre: string
): Promise<RegisterResult> {
  try {
    // Verificar si el email ya existe
    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return {
        success: false,
        message: 'El email ya está registrado'
      };
    }

    // Obtener rol_id del mapeo
    const rolId = ROL_MAP[rol];
    if (!rolId) {
      return {
        success: false,
        message: 'Rol inválido'
      };
    }

    // Hashear password
    const passwordHash = await hashPassword(password);

    // Insertar usuario en la base de datos
    const result = await pool.query<UserRow>(
      `INSERT INTO usuarios (email, password_hash, rol_id, nombre, activo, created_at)
       VALUES ($1, $2, $3, $4, true, NOW())
       RETURNING id, email, rol_id, nombre, created_at`,
      [email, passwordHash, rolId, nombre]
    );

    const user = result.rows[0];
    if (!user) {
      return { success: false, message: 'Error al crear usuario' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        rol: rol,
        nombre: user.nombre,
        created_at: user.created_at.toISOString()
      }
    };
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Iniciar sesión
export async function loginUser(email: string, password: string): Promise<LoginResult> {
  try {
    // Buscar usuario por email con JOIN para obtener el nombre del rol
    const result = await pool.query<UserRow>(
      `SELECT u.id, u.email, u.password_hash, u.nombre, u.activo, u.created_at, r.nombre as rol
       FROM usuarios u
       INNER JOIN roles_usuario r ON u.rol_id = r.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'Credenciales inválidas'
      };
    }

    const user = result.rows[0];
    if (!user) {
      return { success: false, message: 'Credenciales inválidas' };
    }

    // Verificar si el usuario esta activo
    if (!user.activo) {
      return {
        success: false,
        message: 'Usuario desactivado. Contacta al administrador'
      };
    }

    // Verificar password
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return {
        success: false,
        message: 'Credenciales inválidas'
      };
    }

    // Login exitoso
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol || 'cliente',
        nombre: user.nombre,
        created_at: user.created_at.toISOString()
      }
    };
  } catch (error) {
    console.error('Error al hacer login:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Obtener usuario por ID
export async function getUserById(id: number): Promise<User | null> {
  try {
    const result = await pool.query<UserRow>(
      `SELECT u.id, u.email, u.nombre, u.created_at, r.nombre as rol
       FROM usuarios u
       INNER JOIN roles_usuario r ON u.rol_id = r.id
       WHERE u.id = $1 AND u.activo = true`,
      [id]
    );

    const user = result.rows[0];
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      rol: user.rol || 'cliente',
      nombre: user.nombre,
      created_at: user.created_at.toISOString()
    };
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return null;
  }
}

// Registrar un nuevo cliente público (autoregistro)
export async function registerPublicUser(data: {
  nombre: string;
  email: string;
  password: string;
  tipo_cliente_id: number;
  telefono?: string;
}): Promise<RegisterResult> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar si el email ya existe
    const existingUser = await client.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [data.email]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'El email ya está registrado'
      };
    }

    // Hashear password
    const passwordHash = await hashPassword(data.password);

    // Crear usuario con rol 'cliente' (rol_id = 4)
    const userResult = await client.query<UserRow>(
      `INSERT INTO usuarios (email, password_hash, rol_id, nombre, activo, created_at)
       VALUES ($1, $2, 4, $3, true, NOW())
       RETURNING id, email, nombre, created_at`,
      [data.email, passwordHash, data.nombre]
    );

    const newUser = userResult.rows[0];
    if (!newUser) {
      await client.query('ROLLBACK');
      return { success: false, message: 'Error al crear usuario' };
    }

    // Crear cliente asociado al usuario
    await client.query(
      `INSERT INTO clientes (usuario_id, tipo_cliente_id, razon_social, telefono, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [newUser.id, data.tipo_cliente_id, data.nombre, data.telefono || null]
    );

    await client.query('COMMIT');

    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        rol: 'cliente',
        nombre: newUser.nombre,
        created_at: newUser.created_at.toISOString()
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al registrar usuario público:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  } finally {
    client.release();
  }
}
