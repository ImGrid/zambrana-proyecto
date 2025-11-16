import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardApi, refreshDashboardViewsApi } from '../api/dashboard.api';
import type { DashboardQueryParams } from '../types/dashboard.types';

/**
 * Hook para obtener las métricas del dashboard
 * Usa React Query para caching y revalidación automática
 */
export const useDashboard = (params?: DashboardQueryParams) => {
  return useQuery({
    queryKey: ['dashboard', params?.dias ?? 30],
    queryFn: () => getDashboardApi(params),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};

/**
 * Hook para refrescar las vistas materializadas del dashboard
 * Invalida el cache y vuelve a cargar los datos
 */
export const useRefreshDashboard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshDashboardViewsApi,
    onSuccess: () => {
      // Invalidar todas las queries del dashboard para recargar datos frescos
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
