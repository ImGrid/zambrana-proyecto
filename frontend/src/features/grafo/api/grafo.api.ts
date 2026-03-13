import { api } from '@/lib/axios';
import type {
  GrafoResponse,
  GrafoStatsResponse,
  SincronizarResponse,
  GrafoQueryParams
} from '../types/grafo.types';

// GET /api/grafo/operaciones - Grafo general de operaciones
export const getGrafoOperacionesApi = async (params?: GrafoQueryParams): Promise<GrafoResponse> => {
  const { data } = await api.get<GrafoResponse>('/grafo/operaciones', { params });
  return data;
};

// GET /api/grafo/pedido/:pedido_id - Grafo de un pedido especifico
export const getGrafoPedidoApi = async (pedidoId: number): Promise<GrafoResponse> => {
  const { data } = await api.get<GrafoResponse>(`/grafo/pedido/${pedidoId}`);
  return data;
};

// GET /api/grafo/cliente/:cliente_id - Grafo de un cliente
export const getGrafoClienteApi = async (clienteId: number): Promise<GrafoResponse> => {
  const { data } = await api.get<GrafoResponse>(`/grafo/cliente/${clienteId}`);
  return data;
};

// GET /api/grafo/stats - Estadisticas del grafo
export const getGrafoStatsApi = async (): Promise<GrafoStatsResponse> => {
  const { data } = await api.get<GrafoStatsResponse>('/grafo/stats');
  return data;
};

// POST /api/grafo/sincronizar - Sincronizar datos
export const sincronizarGrafoApi = async (): Promise<SincronizarResponse> => {
  const { data } = await api.post<SincronizarResponse>('/grafo/sincronizar');
  return data;
};
