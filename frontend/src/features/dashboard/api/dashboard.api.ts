import { api } from '@/lib/axios';
import type { DashboardResponse, DashboardQueryParams } from '../types/dashboard.types';

/**
 * Obtiene las métricas del dashboard
 * GET /api/reportes/dashboard?dias={number}
 */
export const getDashboardApi = async (params?: DashboardQueryParams): Promise<DashboardResponse> => {
  const { data } = await api.get<DashboardResponse>('/reportes/dashboard', {
    params: {
      dias: params?.dias ?? 30
    }
  });

  return data;
};

/**
 * Refresca las vistas materializadas del dashboard
 * POST /api/reportes/refresh
 */
export const refreshDashboardViewsApi = async (): Promise<{
  message: string;
  refreshed: string[];
  errors: Array<{ view: string; error: string }>;
  duration_ms: number;
}> => {
  const { data } = await api.post('/reportes/refresh');
  return data;
};
