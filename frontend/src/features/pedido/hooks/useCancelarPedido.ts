import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cancelarPedidoApi } from '../api/pedido.api';
import type { CancelarPedidoRequest } from '../types/pedido.types';

export const useCancelarPedido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CancelarPedidoRequest }) =>
      cancelarPedidoApi(id, data),
    onSuccess: (response) => {
      toast.success(response.message || 'Pedido cancelado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al cancelar pedido';
      toast.error(message);
    },
  });
};
