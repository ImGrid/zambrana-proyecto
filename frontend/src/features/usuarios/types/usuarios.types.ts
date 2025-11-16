// Tipos alineados 100% con backend/src/modules/usuarios/usuarios.schemas.ts

// Usuario completo (usado en detalle y después de updates)
export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  created_at: string;
}

// Usuario en lista (versión simplificada)
export interface UsuarioListItem {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  created_at: string;
}

// Respuesta de lista de usuarios
export interface UsuariosListResponse {
  usuarios: UsuarioListItem[];
  total: number;
  limit: number;
  offset: number;
}

// Parámetros de query para listar usuarios
export interface ListUsuariosParams {
  limit?: number;
  offset?: number;
}

// Datos para actualizar usuario
export interface UpdateUsuarioData {
  nombre?: string;
  rol?: 'admin' | 'gerente' | 'conductor' | 'cliente';
  activo?: boolean;
}

// Datos para cambiar contraseña
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Respuesta de update
export interface UsuarioUpdateResponse {
  message: string;
  usuario?: Usuario;
}

// Respuesta genérica de mensaje
export interface MessageResponse {
  message: string;
}
