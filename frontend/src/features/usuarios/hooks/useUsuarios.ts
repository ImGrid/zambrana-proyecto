import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getUsuariosApi,
  getUsuarioByIdApi,
  updateUsuarioApi,
  deactivateUsuarioApi,
  changePasswordApi
} from '../api/usuarios.api';
import type {
  ListUsuariosParams,
  UpdateUsuarioData,
  ChangePasswordData
} from '../types/usuarios.types';

// Hook para listar usuarios
export const useUsuarios = (params?: ListUsuariosParams) => {
  return useQuery({
    queryKey: ['usuarios', params],
    queryFn: () => getUsuariosApi(params),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

// Hook para obtener un usuario por ID
export const useUsuario = (id: number | null) => {
  return useQuery({
    queryKey: ['usuario', id],
    queryFn: () => getUsuarioByIdApi(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para actualizar usuario
export const useUpdateUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUsuarioData }) =>
      updateUsuarioApi(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['usuario', response.usuario?.id] });
      toast.success(response.message || 'Usuario actualizado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al actualizar usuario';
      toast.error(message);
    },
  });
};

// Hook para desactivar usuario
export const useDeactivateUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deactivateUsuarioApi(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success(response.message || 'Usuario desactivado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al desactivar usuario';
      toast.error(message);
    },
  });
};

// Hook para cambiar contraseña
export const useChangePassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChangePasswordData }) =>
      changePasswordApi(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['usuario'] });
      toast.success(response.message || 'Contraseña cambiada correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al cambiar contraseña';
      toast.error(message);
    },
  });
};
