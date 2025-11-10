import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getConductoresApi,
  getConductorByIdApi,
  createConductorApi,
  updateConductorApi,
  toggleActivoConductorApi,
  getLicenciasProximasVencerApi,
  getEstadisticasConductoresApi
} from '../api/conductores.api';
import type { ListConductoresParams, CreateConductorData, UpdateConductorData } from '../types/conductores.types';

// Hook para listar conductores
export const useConductores = (params?: ListConductoresParams) => {
  return useQuery({
    queryKey: ['conductores', params],
    queryFn: () => getConductoresApi(params),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

// Hook para obtener un conductor por ID
export const useConductor = (id: number | null) => {
  return useQuery({
    queryKey: ['conductor', id],
    queryFn: () => getConductorByIdApi(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para crear conductor
export const useCreateConductor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConductorData) => createConductorApi(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['conductores'] });
      toast.success(response.message || 'Conductor creado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al crear conductor';
      toast.error(message);
    },
  });
};

// Hook para actualizar conductor
export const useUpdateConductor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateConductorData }) =>
      updateConductorApi(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['conductores'] });
      queryClient.invalidateQueries({ queryKey: ['conductor', response.conductor?.id] });
      toast.success(response.message || 'Conductor actualizado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al actualizar conductor';
      toast.error(message);
    },
  });
};

// Hook para activar/desactivar conductor
export const useToggleActivo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => toggleActivoConductorApi(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['conductores'] });
      queryClient.invalidateQueries({ queryKey: ['conductor', response.conductor?.id] });
      toast.success(response.message || 'Estado actualizado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al cambiar estado';
      toast.error(message);
    },
  });
};

// Hook para obtener licencias próximas a vencer
export const useLicenciasProximasVencer = (dias: number = 30) => {
  return useQuery({
    queryKey: ['licencias-vencer', dias],
    queryFn: () => getLicenciasProximasVencerApi(dias),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};

// Hook para estadísticas de conductores
export const useEstadisticasConductores = () => {
  return useQuery({
    queryKey: ['conductores', 'estadisticas'],
    queryFn: getEstadisticasConductoresApi,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};
