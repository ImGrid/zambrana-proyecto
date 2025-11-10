import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getMaterialesApi,
  getMaterialByIdApi,
  createMaterialApi,
  updatePrecioApi,
  ajustarStockApi,
  toggleActivoMaterialApi,
  getHistorialPreciosApi,
  getEstadisticasMaterialesApi
} from '../api/materiales.api';
import type {
  ListMaterialesParams,
  CreateMaterialData,
  UpdatePrecioData,
  AjustarStockData
} from '../types/materiales.types';

// Hook para listar materiales
export const useMateriales = (params?: ListMaterialesParams) => {
  return useQuery({
    queryKey: ['materiales', params],
    queryFn: () => getMaterialesApi(params),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

// Hook para obtener un material por ID
export const useMaterial = (id: number | null) => {
  return useQuery({
    queryKey: ['material', id],
    queryFn: () => getMaterialByIdApi(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para crear material
export const useCreateMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMaterialData) => createMaterialApi(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['materiales'] });
      toast.success(response.message || 'Material creado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al crear material';
      toast.error(message);
    },
  });
};

// Hook para actualizar precio de un material
export const useUpdatePrecio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePrecioData }) =>
      updatePrecioApi(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['materiales'] });
      queryClient.invalidateQueries({ queryKey: ['material', response.material?.id] });
      queryClient.invalidateQueries({ queryKey: ['historial-precios', response.material?.id] });
      toast.success(response.message || 'Precio actualizado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al actualizar precio';
      toast.error(message);
    },
  });
};

// Hook para ajustar stock de un material
export const useAjustarStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AjustarStockData }) =>
      ajustarStockApi(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['materiales'] });
      queryClient.invalidateQueries({ queryKey: ['material', response.material?.id] });
      toast.success(response.message || 'Stock ajustado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al ajustar stock';
      toast.error(message);
    },
  });
};

// Hook para activar/desactivar material
export const useToggleActivoMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => toggleActivoMaterialApi(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['materiales'] });
      queryClient.invalidateQueries({ queryKey: ['material', response.material?.id] });
      toast.success(response.message || 'Estado del material actualizado');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al actualizar estado';
      toast.error(message);
    },
  });
};

// Hook para obtener historial de precios
export const useHistorialPrecios = (id: number | null) => {
  return useQuery({
    queryKey: ['historial-precios', id],
    queryFn: () => getHistorialPreciosApi(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para estadísticas de materiales
export const useEstadisticasMateriales = () => {
  return useQuery({
    queryKey: ['materiales', 'estadisticas'],
    queryFn: getEstadisticasMaterialesApi,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};
