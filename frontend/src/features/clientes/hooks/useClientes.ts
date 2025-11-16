import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getClientesApi,
  getClienteByIdApi,
  createClienteApi,
  updateClienteApi,
  getEstadisticasClientesApi,
  getPerfilClienteApi,
  updatePerfilClienteApi
} from '../api/clientes.api';
import type { ListClientesParams, CreateClienteData, UpdateClienteData, UpdatePerfilData } from '../types/clientes.types';

// Hook para listar clientes
export const useClientes = (params?: ListClientesParams) => {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: () => getClientesApi(params),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

// Hook para obtener un cliente por ID
export const useCliente = (id: number | null) => {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => getClienteByIdApi(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para crear cliente
export const useCreateCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClienteData) => createClienteApi(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success(response.message || 'Cliente creado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al crear cliente';
      toast.error(message);
    },
  });
};

// Hook para actualizar cliente
export const useUpdateCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClienteData }) =>
      updateClienteApi(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', response.cliente?.id] });
      toast.success(response.message || 'Cliente actualizado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al actualizar cliente';
      toast.error(message);
    },
  });
};

// Hook para estadísticas de clientes
export const useEstadisticasClientes = () => {
  return useQuery({
    queryKey: ['clientes', 'estadisticas'],
    queryFn: getEstadisticasClientesApi,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};

// Hook para obtener perfil del cliente autenticado
export const usePerfilCliente = () => {
  return useQuery({
    queryKey: ['cliente', 'perfil'],
    queryFn: getPerfilClienteApi,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para actualizar perfil del cliente autenticado
export const useUpdatePerfilCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePerfilData) => updatePerfilClienteApi(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cliente', 'perfil'] });
      toast.success(response.message || 'Perfil actualizado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al actualizar perfil';
      toast.error(message);
    },
  });
};
