import { api } from '@/lib/axios';
import type {
  PedidosListResponse,
  ListPedidosParams,
  Pedido,
  CreatePedidoData,
  ConfirmarPedidoData,
  ReasignarPedidoData,
  CancelarPedidoData,
  PedidoSuccessResponse,
  HistorialEstadosResponse,
  TrackingPublico
} from '../types/pedidos.types';
import type { EstadisticasPedidos } from '../types/estadisticas.types';

// POST /api/pedidos - Crear nuevo pedido
export const createPedidoApi = async (data: CreatePedidoData): Promise<PedidoSuccessResponse> => {
  const { data: response } = await api.post<PedidoSuccessResponse>('/pedidos', data);
  return response;
};

// GET /api/pedidos - Listar pedidos con filtros
export const getPedidosApi = async (params?: ListPedidosParams): Promise<PedidosListResponse> => {
  const { data } = await api.get<PedidosListResponse>('/pedidos', {
    params: {
      limit: params?.limit,
      offset: params?.offset,
      estado_id: params?.estado_id,
      cliente_id: params?.cliente_id,
      fecha_desde: params?.fecha_desde,
      fecha_hasta: params?.fecha_hasta,
      sort_by: params?.sort_by,
      sort_order: params?.sort_order,
    }
  });
  return data;
};

// GET /api/pedidos/:id - Obtener pedido por ID
export const getPedidoByIdApi = async (id: number): Promise<Pedido> => {
  const { data } = await api.get<Pedido>(`/pedidos/${id}`);
  return data;
};

// PATCH /api/pedidos/:id/confirmar - Confirmar pedido y asignar recursos
export const confirmarPedidoApi = async (
  id: number,
  data: ConfirmarPedidoData
): Promise<PedidoSuccessResponse> => {
  const { data: response } = await api.patch<PedidoSuccessResponse>(`/pedidos/${id}/confirmar`, data);
  return response;
};

// PUT /api/pedidos/:id/asignar - Reasignar camión y conductor
export const reasignarPedidoApi = async (
  id: number,
  data: ReasignarPedidoData
): Promise<PedidoSuccessResponse> => {
  const { data: response } = await api.put<PedidoSuccessResponse>(`/pedidos/${id}/asignar`, data);
  return response;
};

// PATCH /api/pedidos/:id/cancelar - Cancelar pedido
export const cancelarPedidoApi = async (
  id: number,
  data: CancelarPedidoData
): Promise<PedidoSuccessResponse> => {
  const { data: response } = await api.patch<PedidoSuccessResponse>(`/pedidos/${id}/cancelar`, data);
  return response;
};

// DELETE /api/pedidos/:id - Eliminar pedido (solo admin, solo cancelados)
export const deletePedidoApi = async (id: number): Promise<{ message: string }> => {
  const { data } = await api.delete<{ message: string }>(`/pedidos/${id}`);
  return data;
};

// GET /api/pedidos/:id/historial - Obtener historial de estados
export const getHistorialEstadosApi = async (id: number): Promise<HistorialEstadosResponse> => {
  const { data } = await api.get<HistorialEstadosResponse>(`/pedidos/${id}/historial`);
  return data;
};

// GET /api/pedidos/tracking/:codigo - Tracking público (sin autenticación)
export const getTrackingPublicoApi = async (codigo: string): Promise<TrackingPublico> => {
  const { data } = await api.get<TrackingPublico>(`/pedidos/tracking/${codigo}`);
  return data;
};

// GET /api/pedidos/estadisticas - Obtener estadísticas de pedidos
export const getEstadisticasPedidosApi = async (dias: number = 30): Promise<EstadisticasPedidos> => {
  const { data } = await api.get<EstadisticasPedidos>('/pedidos/estadisticas', {
    params: { dias }
  });
  return data;
};
