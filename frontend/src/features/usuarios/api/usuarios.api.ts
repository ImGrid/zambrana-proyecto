import { api } from '@/lib/axios';
import type {
  UsuariosListResponse,
  ListUsuariosParams,
  Usuario,
  UpdateUsuarioData,
  UsuarioUpdateResponse,
  ChangePasswordData,
  MessageResponse
} from '../types/usuarios.types';

// GET /api/usuarios - Listar usuarios con paginación
export const getUsuariosApi = async (params?: ListUsuariosParams): Promise<UsuariosListResponse> => {
  const { data } = await api.get<UsuariosListResponse>('/usuarios', {
    params: {
      limit: params?.limit,
      offset: params?.offset
    }
  });
  return data;
};

// GET /api/usuarios/:id - Obtener usuario por ID
export const getUsuarioByIdApi = async (id: number): Promise<Usuario> => {
  const { data } = await api.get<Usuario>(`/usuarios/${id}`);
  return data;
};

// PUT /api/usuarios/:id - Actualizar usuario
export const updateUsuarioApi = async (
  id: number,
  updateData: UpdateUsuarioData
): Promise<UsuarioUpdateResponse> => {
  const { data } = await api.put<UsuarioUpdateResponse>(`/usuarios/${id}`, updateData);
  return data;
};

// DELETE /api/usuarios/:id - Desactivar usuario (soft delete)
export const deactivateUsuarioApi = async (id: number): Promise<MessageResponse> => {
  const { data } = await api.delete<MessageResponse>(`/usuarios/${id}`);
  return data;
};

// POST /api/usuarios/:id/change-password - Cambiar contraseña
export const changePasswordApi = async (
  id: number,
  passwordData: ChangePasswordData
): Promise<MessageResponse> => {
  const { data } = await api.post<MessageResponse>(`/usuarios/${id}/change-password`, passwordData);
  return data;
};
