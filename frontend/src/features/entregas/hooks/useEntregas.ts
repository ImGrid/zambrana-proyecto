import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  iniciarEntregaApi,
  registrarGPSApi,
  finalizarEntregaApi,
  getEstadoEntregaApi,
  getEntregasActivasApi,
  getHistorialTrackingApi,
  getEventosEntregaApi,
  cancelarEntregaApi,
  getEstadisticasEntregasApi,
} from '../api/entregas.api';
import type {
  IniciarEntregaInput,
  RecibirGPSInput,
  FinalizarEntregaInput,
  CancelarEntregaInput,
} from '../types/entregas.types';
import { POLLING_INTERVAL_MS } from '../constants/mapa.constants';

// Hook para obtener todas las entregas activas con POLLING
// Se actualiza cada 10 segundos para mostrar posiciones en tiempo real
export const useEntregasActivas = (enablePolling: boolean = true) => {
  return useQuery({
    queryKey: ['entregas', 'activas'],
    queryFn: () => getEntregasActivasApi(),
    staleTime: 0, // Siempre considerar datos como stale
    refetchInterval: enablePolling ? POLLING_INTERVAL_MS : false,
    refetchIntervalInBackground: true, // Continuar polling aunque la pestaña no esté activa
  });
};

// Hook para obtener el estado de una entrega específica con POLLING
// Usado para tracking individual de una entrega
export const useEstadoEntrega = (
  entregaId: number | null,
  enablePolling: boolean = true
) => {
  return useQuery({
    queryKey: ['entrega', 'estado', entregaId],
    queryFn: () => getEstadoEntregaApi(entregaId!),
    enabled: !!entregaId,
    staleTime: 0,
    refetchInterval: enablePolling ? POLLING_INTERVAL_MS : false,
    refetchIntervalInBackground: true,
  });
};

// Hook para obtener el historial de tracking completo
// No necesita polling, es datos históricos
export const useHistorialTracking = (
  entregaId: number | null,
  limite: number = 100,
  offset: number = 0
) => {
  return useQuery({
    queryKey: ['entrega', 'historial', entregaId, limite, offset],
    queryFn: () => getHistorialTrackingApi(entregaId!, limite, offset),
    enabled: !!entregaId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

// Hook para obtener eventos de una entrega
// No necesita polling frecuente, eventos no cambian constantemente
export const useEventosEntrega = (entregaId: number | null) => {
  return useQuery({
    queryKey: ['entrega', 'eventos', entregaId],
    queryFn: () => getEventosEntregaApi(entregaId!),
    enabled: !!entregaId,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });
};

// Hook para obtener estadísticas de entregas
export const useEstadisticasEntregas = () => {
  return useQuery({
    queryKey: ['entregas', 'estadisticas'],
    queryFn: () => getEstadisticasEntregasApi(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// MUTATIONS

// Hook para iniciar una entrega
export const useIniciarEntrega = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: IniciarEntregaInput) => iniciarEntregaApi(input),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['entregas', 'activas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['entregas', 'estadisticas'] });
      toast.success('Entrega iniciada correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Error al iniciar entrega';
      toast.error(message);
    },
  });
};

// Hook para registrar posición GPS
// Este hook NO muestra toast porque se ejecuta cada 10 segundos automaticamente
export const useRegistrarGPS = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entregaId, gpsData }: { entregaId: number; gpsData: RecibirGPSInput }) =>
      registrarGPSApi(entregaId, gpsData),
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas con esta entrega
      queryClient.invalidateQueries({ queryKey: ['entrega', 'estado', variables.entregaId] });
      queryClient.invalidateQueries({ queryKey: ['entregas', 'activas'] });
      queryClient.invalidateQueries({ queryKey: ['entrega', 'historial', variables.entregaId] });

      // Si hay warnings, mostrarlos
      if (data.warnings && data.warnings.length > 0) {
        data.warnings.forEach((warning) => toast.warning(warning));
      }
    },
    onError: (error: any) => {
      // Solo log en consola, no mostrar toast para no molestar al usuario
      console.error('Error al registrar GPS:', error);
    },
  });
};

// Hook para finalizar entrega
export const useFinalizarEntrega = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entregaId, input }: { entregaId: number; input: FinalizarEntregaInput }) =>
      finalizarEntregaApi(entregaId, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entrega', 'estado', variables.entregaId] });
      queryClient.invalidateQueries({ queryKey: ['entregas', 'activas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['entregas', 'estadisticas'] });

      toast.success(
        `Entrega finalizada. Distancia recorrida: ${data.metricas.distancia_recorrida_km.toFixed(2)} km`
      );
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Error al finalizar entrega';
      toast.error(message);
    },
  });
};

// Hook para cancelar entrega
export const useCancelarEntrega = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entregaId, input }: { entregaId: number; input: CancelarEntregaInput }) =>
      cancelarEntregaApi(entregaId, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entrega', 'estado', variables.entregaId] });
      queryClient.invalidateQueries({ queryKey: ['entregas', 'activas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['entregas', 'estadisticas'] });

      toast.success(data.mensaje || 'Entrega cancelada correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Error al cancelar entrega';
      toast.error(message);
    },
  });
};
