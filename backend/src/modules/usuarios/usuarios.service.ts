import * as usuariosRepo from './usuarios.repository.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';

// Mapeo de nombres de rol a IDs
const ROL_MAP: Record<string, number> = {
  'admin': 1,
  'gerente': 2,
  'conductor': 3,
  'cliente': 4
};

// Tipos para respuestas
interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  created_at: string;
}

interface ListUsuariosResult {
  success: boolean;
  usuarios?: Usuario[];
  total?: number;
  limit?: number;
  offset?: number;
  message?: string;
}

interface GetUsuarioResult {
  success: boolean;
  usuario?: Usuario;
  message?: string;
}

interface UpdateUsuarioResult {
  success: boolean;
  usuario?: Usuario;
  message?: string;
}

interface ChangePasswordResult {
  success: boolean;
  message: string;
}

// Listar usuarios con paginación
export async function listUsuarios(
  limit: number = 20,
  offset: number = 0
): Promise<ListUsuariosResult> {
  try {
    const [usuarios, total] = await Promise.all([
      usuariosRepo.findAllUsuarios(limit, offset),
      usuariosRepo.countUsuarios()
    ]);

    return {
      success: true,
      usuarios: usuarios.map(u => ({
        id: u.id,
        email: u.email,
        nombre: u.nombre,
        rol: u.rol,
        activo: u.activo,
        created_at: u.created_at.toISOString()
      })),
      total,
      limit,
      offset
    };
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Obtener usuario por ID
export async function getUsuarioById(id: number): Promise<GetUsuarioResult> {
  try {
    const usuario = await usuariosRepo.findUsuarioById(id);

    if (!usuario) {
      return {
        success: false,
        message: 'Usuario no encontrado'
      };
    }

    return {
      success: true,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        activo: usuario.activo,
        created_at: usuario.created_at.toISOString()
      }
    };
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Actualizar usuario
export async function updateUsuario(
  id: number,
  data: { nombre?: string; rol?: string; activo?: boolean }
): Promise<UpdateUsuarioResult> {
  try {
    // Verificar que el usuario existe
    const existingUser = await usuariosRepo.findUsuarioById(id);
    if (!existingUser) {
      return {
        success: false,
        message: 'Usuario no encontrado'
      };
    }

    // Preparar datos para el repository
    const updateData: { nombre?: string; rol_id?: number; activo?: boolean } = {};

    if (data.nombre !== undefined) {
      updateData.nombre = data.nombre;
    }

    if (data.rol !== undefined) {
      const rolId = ROL_MAP[data.rol];
      if (!rolId) {
        return {
          success: false,
          message: 'Rol inválido'
        };
      }
      updateData.rol_id = rolId;
    }

    if (data.activo !== undefined) {
      updateData.activo = data.activo;
    }

    // Actualizar en base de datos
    const updatedUser = await usuariosRepo.updateUsuario(id, updateData);

    if (!updatedUser) {
      return {
        success: false,
        message: 'Error al actualizar usuario'
      };
    }

    return {
      success: true,
      usuario: {
        id: updatedUser.id,
        email: updatedUser.email,
        nombre: updatedUser.nombre,
        rol: updatedUser.rol,
        activo: updatedUser.activo,
        created_at: updatedUser.created_at.toISOString()
      },
      message: 'Usuario actualizado exitosamente'
    };
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Desactivar usuario (soft delete)
export async function deactivateUsuario(id: number): Promise<UpdateUsuarioResult> {
  try {
    // Verificar que el usuario existe y está activo
    const existingUser = await usuariosRepo.findUsuarioById(id);
    if (!existingUser) {
      return {
        success: false,
        message: 'Usuario no encontrado'
      };
    }

    if (!existingUser.activo) {
      return {
        success: false,
        message: 'El usuario ya está desactivado'
      };
    }

    // Desactivar usuario
    const success = await usuariosRepo.deactivateUsuario(id);

    if (!success) {
      return {
        success: false,
        message: 'Error al desactivar usuario'
      };
    }

    // Obtener usuario actualizado
    const updatedUser = await usuariosRepo.findUsuarioById(id);

    return {
      success: true,
      usuario: updatedUser ? {
        id: updatedUser.id,
        email: updatedUser.email,
        nombre: updatedUser.nombre,
        rol: updatedUser.rol,
        activo: updatedUser.activo,
        created_at: updatedUser.created_at.toISOString()
      } : undefined,
      message: 'Usuario desactivado exitosamente'
    };
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}

// Cambiar contraseña de usuario
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> {
  try {
    // Buscar por ID con password_hash
    const userRow = await usuariosRepo.findUsuarioById(userId);

    if (!userRow) {
      return {
        success: false,
        message: 'Usuario no encontrado'
      };
    }

    // Necesitamos obtener el password_hash actual
    // El repository actual no tiene una función para obtener el usuario completo con password
    // Vamos a agregar lógica aquí temporalmente (idealmente añadir al repository)
    const { pool } = await import('../../database/postgres/pool.js');
    const result = await pool.query<{ password_hash: string }>(
      'SELECT password_hash FROM usuarios WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'Usuario no encontrado'
      };
    }

    const row = result.rows[0];
    if (!row) {
      return {
        success: false,
        message: 'Usuario no encontrado'
      };
    }

    const passwordHash = row.password_hash;

    // Verificar contraseña actual
    const isValidPassword = await verifyPassword(currentPassword, passwordHash);

    if (!isValidPassword) {
      return {
        success: false,
        message: 'Contraseña actual incorrecta'
      };
    }

    // Hashear nueva contraseña
    const newPasswordHash = await hashPassword(newPassword);

    // Actualizar contraseña en base de datos
    const success = await usuariosRepo.updatePassword(userId, newPasswordHash);

    if (!success) {
      return {
        success: false,
        message: 'Error al cambiar contraseña'
      };
    }

    return {
      success: true,
      message: 'Contraseña cambiada exitosamente'
    };
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
}
