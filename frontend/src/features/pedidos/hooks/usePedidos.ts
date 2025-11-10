import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getPedidosApi,
  getPedidoByIdApi,
  createPedidoApi,
  confirmarPedidoApi,
  reasignarPedidoApi,
  cancelarPedidoApi,
  deletePedidoApi,
  getHistorialEstadosApi,
  getTrackingPublicoApi,
  getEstadisticasPedidosApi
} from '../api/pedidos.api';
import type {
  ListPedidosParams,
  CreatePedidoData,
  ConfirmarPedidoData,
  ReasignarPedidoData,
  CancelarPedidoData
} from '../types/pedidos.types';

// Hook para listar pedidos
export const usePedidos = (params?: ListPedidosParams) => {
  return useQuery({
    queryKey: ['pedidos', params],
    queryFn: () => getPedidosApi(params),
    staleTime: 1000 * 60 * 1, // 1 minuto (datos cambian frecuentemente)
  });
};

// Hook para obtener un pedido por ID
export const usePedido = (id: number | null) => {
  return useQuery({
    queryKey: ['pedido', id],
    queryFn: () => getPedidoByIdApi(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

// Hook para crear pedido
export const useCreatePedido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePedidoData) => createPedidoApi(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success(response.message || 'Pedido creado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al crear pedido';
      toast.error(message);
    },
  });
};

// Hook para confirmar pedido
export const useConfirmarPedido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ConfirmarPedidoData }) =>
      confirmarPedidoApi(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['pedido', response.pedido?.id] });
      queryClient.invalidateQueries({ queryKey: ['historial-estados', response.pedido?.id] });
      toast.success(response.message || 'Pedido confirmado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al confirmar pedido';
      toast.error(message);
    },
  });
};

// Hook para reasignar recursos
export const useReasignarPedido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReasignarPedidoData }) =>
      reasignarPedidoApi(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['pedido', response.pedido?.id] });
      queryClient.invalidateQueries({ queryKey: ['historial-estados', response.pedido?.id] });
      toast.success(response.message || 'Recursos reasignados correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al reasignar recursos';
      toast.error(message);
    },
  });
};

// Hook para cancelar pedido
export const useCancelarPedido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CancelarPedidoData }) =>
      cancelarPedidoApi(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['pedido', response.pedido?.id] });
      queryClient.invalidateQueries({ queryKey: ['historial-estados', response.pedido?.id] });
      toast.success(response.message || 'Pedido cancelado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al cancelar pedido';
      toast.error(message);
    },
  });
};

// Hook para eliminar pedido
export const useDeletePedido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deletePedidoApi(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success(response.message || 'Pedido eliminado correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al eliminar pedido';
      toast.error(message);
    },
  });
};

// Hook para obtener historial de estados
export const useHistorialEstados = (id: number | null) => {
  return useQuery({
    queryKey: ['historial-estados', id],
    queryFn: () => getHistorialEstadosApi(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });
};

// Hook para tracking público (sin autenticación)
export const useTrackingPublico = (codigo: string | null) => {
  return useQuery({
    queryKey: ['tracking-publico', codigo],
    queryFn: () => getTrackingPublicoApi(codigo!),
    enabled: !!codigo,
    staleTime: 1000 * 30, // 30 segundos (actualización frecuente para tracking)
  });
};

// Hook para estadísticas de pedidos
export const useEstadisticasPedidos = (dias: number = 30) => {
  return useQuery({
    queryKey: ['pedidos', 'estadisticas', dias],
    queryFn: () => getEstadisticasPedidosApi(dias),
    staleTime: 1000 * 60 * 5, // 5 minutos (matching backend cache)
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};
