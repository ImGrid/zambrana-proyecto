import { api } from '@/lib/axios';
import type {
  CreatePedidoRequest,
  CreatePedidoResponse,
  ListPedidosParams,
  PedidosListResponse,
  PedidoResponse,
  ConfirmarPedidoRequest,
  CancelarPedidoRequest,
} from '../types/pedido.types';

export const createPedidoApi = async (data: CreatePedidoRequest): Promise<CreatePedidoResponse> => {
  const response = await api.post<CreatePedidoResponse>('/pedidos', data);
  return response.data;
};

export const getPedidosApi = async (params: ListPedidosParams = {}): Promise<PedidosListResponse> => {
  const response = await api.get<PedidosListResponse>('/pedidos', { params });
  return response.data;
};

export const getPedidoByIdApi = async (id: number): Promise<PedidoResponse> => {
  const response = await api.get<PedidoResponse>(`/pedidos/${id}`);
  return response.data;
};

export const confirmarPedidoApi = async (
  id: number,
  data: ConfirmarPedidoRequest
): Promise<CreatePedidoResponse> => {
  const response = await api.patch<CreatePedidoResponse>(`/pedidos/${id}/confirmar`, data);
  return response.data;
};

export const cancelarPedidoApi = async (
  id: number,
  data: CancelarPedidoRequest
): Promise<CreatePedidoResponse> => {
  const response = await api.patch<CreatePedidoResponse>(`/pedidos/${id}/cancelar`, data);
  return response.data;
};
