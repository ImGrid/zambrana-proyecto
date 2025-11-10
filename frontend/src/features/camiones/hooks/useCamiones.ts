import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getCamionesApi,
  getCamionByIdApi,
  createCamionApi,
  updateCamionApi,
  toggleActivoCamionApi,
  toggleMantenimientoCamionApi,
  getEstadisticasCamionesApi
} from '../api/camiones.api';
import type { ListCamionesParams, CreateCamionData, UpdateCamionData } from '../types/camiones.types';

// Hook para listar camiones
export const useCamiones = (params?: ListCamionesParams) => {
  return useQuery({
    queryKey: ['camiones', params],
    queryFn: () => getCamionesApi(params),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

// Hook para obtener un camión por ID
export const useCamion = (id: number | null) => {
  return useQuery({
    queryKey: ['camion', id],
    queryFn: () => getCamionByIdApi(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para crear camión
export const useCreateCamion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCamionData) => createCamionApi(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['camiones'] });
      toast.success(response.message || 'Camión creado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al crear camión';
      toast.error(message);
    },
  });
};

// Hook para actualizar camión
export const useUpdateCamion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCamionData }) =>
      updateCamionApi(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['camiones'] });
      queryClient.invalidateQueries({ queryKey: ['camion', response.camion?.id] });
      toast.success(response.message || 'Camión actualizado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al actualizar camión';
      toast.error(message);
    },
  });
};

// Hook para activar/desactivar camión
export const useToggleActivo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => toggleActivoCamionApi(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['camiones'] });
      queryClient.invalidateQueries({ queryKey: ['camion', response.camion?.id] });
      toast.success(response.message || 'Estado actualizado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al cambiar estado';
      toast.error(message);
    },
  });
};

// Hook para cambiar estado de mantenimiento
export const useToggleMantenimiento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => toggleMantenimientoCamionApi(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['camiones'] });
      queryClient.invalidateQueries({ queryKey: ['camion', response.camion?.id] });
      toast.success(response.message || 'Estado de mantenimiento actualizado');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al cambiar estado de mantenimiento';
      toast.error(message);
    },
  });
};

// Hook para estadísticas de camiones
export const useEstadisticasCamiones = () => {
  return useQuery({
    queryKey: ['camiones', 'estadisticas'],
    queryFn: getEstadisticasCamionesApi,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};
