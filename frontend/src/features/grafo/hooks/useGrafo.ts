import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getGrafoOperacionesApi,
  getGrafoPedidoApi,
  getGrafoClienteApi,
  getGrafoStatsApi,
  sincronizarGrafoApi
} from '../api/grafo.api';
import type { GrafoQueryParams } from '../types/grafo.types';

// Hook para obtener grafo de operaciones
export const useGrafoOperaciones = (params?: GrafoQueryParams) => {
  return useQuery({
    queryKey: ['grafo', 'operaciones', params],
    queryFn: () => getGrafoOperacionesApi(params),
    staleTime: 1000 * 60 * 2,
  });
};

// Hook para obtener grafo de un pedido especifico
export const useGrafoPedido = (pedidoId: number | null) => {
  return useQuery({
    queryKey: ['grafo', 'pedido', pedidoId],
    queryFn: () => getGrafoPedidoApi(pedidoId!),
    enabled: !!pedidoId,
    staleTime: 1000 * 60 * 2,
  });
};

// Hook para obtener grafo de un cliente
export const useGrafoCliente = (clienteId: number | null) => {
  return useQuery({
    queryKey: ['grafo', 'cliente', clienteId],
    queryFn: () => getGrafoClienteApi(clienteId!),
    enabled: !!clienteId,
    staleTime: 1000 * 60 * 2,
  });
};

// Hook para obtener estadisticas del grafo
export const useGrafoStats = () => {
  return useQuery({
    queryKey: ['grafo', 'stats'],
    queryFn: getGrafoStatsApi,
    staleTime: 1000 * 60 * 5,
  });
};

// Hook para sincronizar datos
export const useSincronizarGrafo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sincronizarGrafoApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['grafo'] });
      toast.success(data.mensaje || 'Sincronizacion completada');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al sincronizar';
      toast.error(message);
    },
  });
};
