import { useQuery } from '@tanstack/react-query';
import { getPedidoByIdApi } from '../api/pedido.api';

export const usePedidoById = (id: number) => {
  return useQuery({
    queryKey: ['pedido', id],
    queryFn: () => getPedidoByIdApi(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};
