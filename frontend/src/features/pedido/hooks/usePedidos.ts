import { useQuery } from '@tanstack/react-query';
import { getPedidosApi } from '../api/pedido.api';
import type { ListPedidosParams } from '../types/pedido.types';

export const usePedidos = (params: ListPedidosParams = {}) => {
  return useQuery({
    queryKey: ['pedidos', params],
    queryFn: () => getPedidosApi(params),
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};
